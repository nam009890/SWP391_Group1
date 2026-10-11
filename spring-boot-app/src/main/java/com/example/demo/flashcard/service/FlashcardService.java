package com.example.demo.flashcard.service;

import com.example.demo.flashcard.dto.FlashcardRequest;
import com.example.demo.flashcard.dto.FlashcardResponse;

import java.util.List;

public interface FlashcardService {
    List<FlashcardResponse> getFlashcardsByDeckId(Long deckId);
    FlashcardResponse addFlashcardToDeck(Long deckId, FlashcardRequest request);
    List<FlashcardResponse> generateAiFlashcards(Long deckId, String prompt) throws Exception;
    FlashcardResponse updateFlashcard(Long deckId, Long flashcardId, FlashcardRequest request);
    void deleteFlashcard(Long deckId, Long flashcardId);
}
