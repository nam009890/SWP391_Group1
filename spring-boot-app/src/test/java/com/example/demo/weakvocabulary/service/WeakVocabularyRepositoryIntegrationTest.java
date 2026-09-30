package com.example.demo.weakvocabulary.service;

import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.weakvocabulary.dto.WeakDtos.PageResponse;
import com.example.demo.weakvocabulary.entity.UserWeakVocabulary;
import com.example.demo.weakvocabulary.repository.UserWeakVocabularyRepository;
import com.example.demo.weakvocabulary.service.impl.WeakVocabularyServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class WeakVocabularyRepositoryIntegrationTest {
    @Autowired private UserWeakVocabularyRepository weakRepo;
    @Autowired private UserRepository users;
    @Autowired private FlashcardRepository flashcards;
    private WeakVocabularyServiceImpl service;
    private User user;
    private Deck deckA;
    private Deck deckB;

    @BeforeEach
    void setUp() {
        service = new WeakVocabularyServiceImpl(weakRepo, users, flashcards);
        user = users.save(User.builder().email("u" + System.nanoTime() + "@test").build());
        deckA = Deck.builder().name("A").build(); deckB = Deck.builder().name("B").build();
        // Cascading is intentionally not assumed in production mappings.
        deckA = persistDeck(deckA); deckB = persistDeck(deckB);
    }

    private Deck persistDeck(Deck deck) {
        return (Deck) entityManager().merge(deck);
    }
    @Autowired private jakarta.persistence.EntityManager em;
    private jakarta.persistence.EntityManager entityManager() { return em; }
    private UserWeakVocabulary weak(String word, String meaning, Deck deck, int mastery, int correct, int total, boolean manual, boolean auto) {
        Flashcard card = flashcards.save(Flashcard.builder().deck(deck).vocabulary(word).meaning(meaning).exampleSentence("Use " + word + " today.").build());
        return weakRepo.save(UserWeakVocabulary.builder().user(user).flashcard(card).masteryScore(mastery).correctCount(correct).totalAttempts(total).wrongCount(Math.max(0, total - correct)).manualMarked(manual).autoDetected(auto).build());
    }
    private List<String> words(PageResponse page) { return page.getItems().stream().map(i -> i.getVocabulary()).toList(); }

    @Test void searchMatchesVocabularyPartialAndIgnoringCase() { weak("Maintain", "duy trì", deckA, 1, 0, 0, false, true); assertEquals(List.of("Maintain"), words(service.list(user.getId(), "TAIN", null, "ALL", null, null, null, null, "WORD_ASC", 0, 10))); }
    @Test void searchMatchesMeaningAndBlankDoesNotFilter() { weak("apple", "quả táo", deckA, 1, 0, 0, false, true); weak("banana", "quả chuối", deckA, 1, 0, 0, false, true); assertEquals(1, service.list(user.getId(), "TÁO", null, "ALL", null, null, null, null, null, 0, 10).getItems().size()); assertEquals(2, service.list(user.getId(), " ", null, "ALL", null, null, null, null, null, 0, 10).getItems().size()); }
    @Test void filtersDeckSourceMasteryAndCombinedValues() { weak("a", "a", deckA, 10, 1, 4, true, false); weak("b", "b", deckA, 30, 2, 4, false, true); weak("c", "c", deckB, 55, 3, 4, true, true); assertEquals(2, service.list(user.getId(), null, deckA.getId(), "ALL", null, null, null, null, null, 0, 10).getItems().size()); assertEquals(List.of("c"), words(service.list(user.getId(), null, deckB.getId(), "BOTH", 25, 60, 50d, 80d, null, 0, 10))); }
    @Test void sourceFiltersApplyExpectedSemantics() { weak("manual", "m", deckA, 1, 0, 0, true, false); weak("auto", "a", deckA, 1, 0, 0, false, true); weak("both", "b", deckA, 1, 0, 0, true, true); assertEquals(2, service.list(user.getId(), null, null, "MANUAL", null, null, null, null, null, 0, 10).getItems().size()); assertEquals(2, service.list(user.getId(), null, null, "AUTO", null, null, null, null, null, 0, 10).getItems().size()); assertEquals(List.of("both"), words(service.list(user.getId(), null, null, "BOTH", null, null, null, null, null, 0, 10))); }
    @Test void accuracyTreatsZeroAttemptsAsZero() { weak("zero", "z", deckA, 1, 0, 0, false, true); weak("high", "h", deckA, 1, 3, 4, false, true); assertEquals(List.of("zero"), words(service.list(user.getId(), null, null, "ALL", null, null, null, 24.99, "WORD_ASC", 0, 10))); }
    @Test void paginationUsesDatabasePageMetadata() { for (int i = 0; i < 7; i++) weak("word" + i, "m", deckA, i, 0, 1, false, true); PageResponse first = service.list(user.getId(), null, null, "ALL", null, null, null, null, "WORD_ASC", 0, 3); PageResponse second = service.list(user.getId(), null, null, "ALL", null, null, null, null, "WORD_ASC", 1, 3); assertEquals(7, first.getTotalElements()); assertEquals(3, first.getTotalPages()); assertTrue(first.isFirst()); assertFalse(second.isFirst()); assertEquals(3, second.getItems().size()); }
    @Test void masteryAndWordSortsAreGlobal() { weak("banana", "b", deckA, 30, 0, 1, false, true); weak("Apple", "a", deckA, 10, 0, 1, false, true); weak("maintain", "m", deckA, 50, 0, 1, false, true); assertEquals(List.of("Apple", "banana", "maintain"), words(service.list(user.getId(), null, null, "ALL", null, null, null, null, "WORD_ASC", 0, 10))); assertEquals(List.of("maintain", "banana", "Apple"), words(service.list(user.getId(), null, null, "ALL", null, null, null, null, "MASTERY_DESC", 0, 10))); }
    @Test void accuracySortOrdersBeforePagination() { weak("zero", "z", deckA, 1, 0, 0, false, true); weak("quarter", "q", deckA, 1, 1, 4, false, true); weak("half", "h", deckA, 1, 2, 4, false, true); weak("full", "f", deckA, 1, 4, 4, false, true); assertEquals(List.of("zero", "quarter"), words(service.list(user.getId(), null, null, "ALL", null, null, null, null, "ACCURACY_ASC", 0, 2))); assertEquals(List.of("full", "half"), words(service.list(user.getId(), null, null, "ALL", null, null, null, null, "ACCURACY_DESC", 0, 2))); }
}
