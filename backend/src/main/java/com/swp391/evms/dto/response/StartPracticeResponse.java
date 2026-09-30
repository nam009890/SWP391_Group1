package com.swp391.evms.dto.response;

import java.util.List;

public record StartPracticeResponse(Long sessionId, Integer totalQuestions, List<PracticeQuestionResponse> questions) {}
