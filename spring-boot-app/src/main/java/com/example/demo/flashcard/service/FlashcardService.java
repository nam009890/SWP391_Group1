package com.example.demo.flashcard.service;

import com.example.demo.flashcard.entity.Flashcard;

import java.util.List;
import java.util.Optional;

public interface FlashcardService {
    List<Flashcard> getFlashcardsByDeckId(Long deckId);
    Optional<Flashcard> addFlashcardToDeck(Long deckId, Flashcard flashcard);
}
