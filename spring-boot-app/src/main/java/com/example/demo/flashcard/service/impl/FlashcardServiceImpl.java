package com.example.demo.flashcard.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.dto.FlashcardRequest;
import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.DeckRepository;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.flashcard.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlashcardServiceImpl implements FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final DeckRepository deckRepository;
    private final GeminiService geminiService;

    @Override
    public List<FlashcardResponse> getFlashcardsByDeckId(Long deckId) {
        return flashcardRepository.findByDeckId(deckId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FlashcardResponse addFlashcardToDeck(Long deckId, FlashcardRequest request) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));

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

    @Override
    public List<FlashcardResponse> generateAiFlashcards(Long deckId, String prompt) throws Exception {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + deckId));

        List<Flashcard> generatedCards = geminiService.generateFlashcards(prompt);
        
        List<Flashcard> savedCards = generatedCards.stream().map(card -> {
            card.setDeck(deck);
            return flashcardRepository.save(card);
        }).collect(Collectors.toList());

        return savedCards.stream().map(this::mapToResponse).collect(Collectors.toList());
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
