package com.swp391.evms.dto.response;

import java.time.OffsetDateTime;

public record PracticeSummaryResponse(Long sessionId, String status, Integer totalQuestions, Integer correctAnswers,
                Integer wrongAnswers, Double accuracy, OffsetDateTime startedAt, OffsetDateTime completedAt) {
}
