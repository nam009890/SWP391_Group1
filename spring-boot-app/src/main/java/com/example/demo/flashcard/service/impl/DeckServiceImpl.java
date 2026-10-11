package com.example.demo.flashcard.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.dto.DeckRequest;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckResponse;
import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.repository.DeckRepository;
import com.example.demo.flashcard.service.DeckService;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final FlashcardRepository flashcardRepository;

    @Override
    public List<DeckDto> getMyDecksWithCount(Long userId) {
        return deckRepository.findMyDecksWithFlashcardCount(userId);
    }

    @Override
    public List<DeckDto> searchPublicDecks(String search) {
        String query = (search == null) ? "" : search;
        return deckRepository.findPublicDecksWithSearch(query);
    }

    @Override
    public DeckResponse createDeck(DeckRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Deck deck = Deck.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isPublic(request.isPublic())
                .user(user)
                .build();
        Deck savedDeck = deckRepository.save(deck);
        return mapToResponse(savedDeck);
    }

    @Override
    public DeckResponse getDeckById(Long id, Long userId) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));

        // Check if user is owner OR deck is public
        boolean isOwner = deck.getUser() != null && deck.getUser().getId().equals(userId);
        if (!isOwner && !deck.isPublic()) {
            throw new ResourceNotFoundException("Deck not found or you don't have access to it.");
        }

        return mapToResponse(deck);
    }

    @Override
    @Transactional
    public DeckResponse cloneDeck(Long deckId, Long userId) {
        Deck originalDeck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        if (!originalDeck.isPublic()) {
            throw new ResourceNotFoundException("You can only clone public decks");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Deck clonedDeck = Deck.builder()
                .name(originalDeck.getName() + " (Cloned)")
                .description(originalDeck.getDescription())
                .isPublic(false) // cloned decks are private by default
                .user(user)
                .build();
        
        Deck savedClonedDeck = deckRepository.save(clonedDeck);

        List<Flashcard> originalFlashcards = flashcardRepository.findByDeckId(deckId);
        List<Flashcard> clonedFlashcards = originalFlashcards.stream().map(f -> 
            Flashcard.builder()
                .vocabulary(f.getVocabulary())
                .meaning(f.getMeaning())
                .phonetic(f.getPhonetic())
                .exampleSentence(f.getExampleSentence())
                .deck(savedClonedDeck)
                .build()
        ).collect(Collectors.toList());

        flashcardRepository.saveAll(clonedFlashcards);

        return mapToResponse(savedClonedDeck);
    }

    @Override
    public void deleteDeck(Long deckId, Long userId) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        
        boolean isOwner = deck.getUser() != null && deck.getUser().getId().equals(userId);
        if (!isOwner) {
            throw new IllegalArgumentException("You can only delete your own decks.");
        }

        deckRepository.delete(deck);
    }

    private DeckResponse mapToResponse(Deck deck) {
        return DeckResponse.builder()
                .id(deck.getId())
                .name(deck.getName())
                .description(deck.getDescription())
                .isPublic(deck.isPublic())
                .authorId(deck.getUser() != null ? deck.getUser().getId() : null)
                .authorName(deck.getUser() != null ? deck.getUser().getName() : null)
                .build();
    }
}
