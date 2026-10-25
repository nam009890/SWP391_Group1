package com.example.demo.weakvocabulary.service;

import com.example.demo.weakvocabulary.dto.WeakDtos.*;

public interface WeakVocabularyService {
    java.util.List<DeckOption> deckOptions(Long userId);

    WeakResponse addManual(Long userId, Long flashcardId);

    com.example.demo.study.dto.ReviewResponse.WeakDetection registerStudyDetection(
            Long userId, Long flashcardId, int quality,
            com.example.demo.weakvocabulary.entity.WeakDetectionReason reason);

    PageResponse list(Long userId, String keyword, Long deckId, String source, Integer masteryMin, Integer masteryMax, Double accuracyMin, Double accuracyMax, String sort, int page, int size);

    WeakResponse patch(Long userId, Long id, PatchRequest request);

    void softDelete(Long userId, Long id);
}
