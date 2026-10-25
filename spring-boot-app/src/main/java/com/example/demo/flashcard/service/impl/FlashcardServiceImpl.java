package com.example.demo.flashcard.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.dto.FlashcardRequest;
import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.DeckRepository;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.flashcard.service.DeckAccessPolicy;
import com.example.demo.flashcard.service.FlashcardService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FlashcardServiceImpl implements FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final DeckRepository deckRepository;
    private final com.example.demo.study.service.LearningActivityLock accounts;
    private final com.example.demo.flashcard.ai.validation.AiFlashcardValidator vocabulary;
    private final DeckAccessPolicy access;

    public FlashcardServiceImpl(FlashcardRepository flashcardRepository, DeckRepository deckRepository,
            DeckAccessPolicy access, com.example.demo.study.service.LearningActivityLock accounts,
            com.example.demo.flashcard.ai.validation.AiFlashcardValidator vocabulary) {
        this.flashcardRepository = flashcardRepository;
        this.deckRepository = deckRepository;
        this.accounts = accounts;
        this.vocabulary = vocabulary;
        this.access = access;
    }

    @Override
    public List<FlashcardResponse> getFlashcardsByDeckId(Long deckId) {
        access.requireViewAccess(deckId, access.currentUserId());
        return flashcardRepository.findByDeckId(deckId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public FlashcardResponse addFlashcardToDeck(Long deckId, FlashcardRequest request) {
        Long uid = access.requireUserId();
        accounts.acquire(uid);
        Deck deck = deckRepository.findForUpdate(deckId).orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        if (!access.canManageDeck(deck,uid)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Only the deck owner can add cards");

        if (request.getVocabulary() == null || request.getVocabulary().isBlank() || request.getVocabulary().length() > 255
                || request.getMeaning() == null || request.getMeaning().isBlank() || request.getMeaning().length() > 255)
            throw new IllegalArgumentException("Vocabulary and meaning must contain 1 to 255 characters");

        if ((request.getPhonetic() != null && request.getPhonetic().length() > 255)
                || (request.getExampleSentence() != null && request.getExampleSentence().length() > 2000)) {
            throw new IllegalArgumentException("Phonetic tối đa 255 và ví dụ tối đa 2000 ký tự");
        }
        if (flashcardRepository.vocabularyInDeck(deckId).stream().anyMatch(word -> vocabulary.normalize(word).equals(vocabulary.normalize(request.getVocabulary())))) {
            throw new com.example.demo.flashcard.ai.exception.AiException(409,"DUPLICATE_FLASHCARD");
        }
        Flashcard flashcard = Flashcard.builder()
                .vocabulary(request.getVocabulary())
                .meaning(request.getMeaning())
                .phonetic(request.getPhonetic())
                .exampleSentence(request.getExampleSentence())
                .deck(deck)
                .build();

        Flashcard savedFlashcard = flashcardRepository.save(flashcard);
        return mapToResponse(savedFlashcard);
    }

    private FlashcardResponse mapToResponse(Flashcard flashcard) {
        return FlashcardResponse.builder()
                .id(flashcard.getId())
                .deckId(flashcard.getDeck() != null ? flashcard.getDeck().getId() : null)
                .vocabulary(flashcard.getVocabulary())
                .meaning(flashcard.getMeaning())
                .phonetic(flashcard.getPhonetic())
                .exampleSentence(flashcard.getExampleSentence())
                .build();
    }
}
