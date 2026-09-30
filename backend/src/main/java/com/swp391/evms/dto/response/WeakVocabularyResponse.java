package com.swp391.evms.dto.response;

import java.time.OffsetDateTime;

public record WeakVocabularyResponse(Long userVocabularyId, Long vocabularyId, String word, String cefrLevel,
        String pronunciation, String partOfSpeech, String meaningVi, String example, Integer masteryScore,
        Integer totalAttempts, Integer correctCount, Integer wrongCount, Integer consecutiveWrong, Double accuracy,
        Boolean manualWeak, String weakReason, String weakNote, OffsetDateTime lastReviewedAt, OffsetDateTime nextReviewAt) {}
