package com.swp391.evms.dto.response;

public record SubmitFillBlankAnswerResponse(Long sessionId, Long itemId, Boolean correct, String submittedAnswer,
        String correctAnswer, Integer masteryScore, String learningStatus, Integer totalAttempts, Integer correctCount,
        Integer wrongCount, Integer consecutiveWrong, Integer answeredQuestions, Integer totalQuestions,
        Boolean sessionCompleted) {}
