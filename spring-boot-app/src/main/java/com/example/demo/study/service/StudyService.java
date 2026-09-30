package com.example.demo.study.service;

import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.study.dto.ReviewResponse;

import java.util.List;

public interface StudyService {
    List<FlashcardResponse> getFlashcardsToStudy(Long deckId, Long userId);
    ReviewResponse processReview(Long userId, Long flashcardId, int quality);
}
