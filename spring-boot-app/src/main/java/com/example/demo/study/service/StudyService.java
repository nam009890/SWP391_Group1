package com.example.demo.study.service;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.study.entity.UserFlashcardReview;

import java.util.List;

public interface StudyService {
    List<Flashcard> getFlashcardsToStudy(Long deckId, Long userId);
    UserFlashcardReview processReview(Long userId, Long flashcardId, int quality);
}
