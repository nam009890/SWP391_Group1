package com.swp391.evms.dto.response;

import java.util.List;

public record PracticeSessionResponse(Long sessionId, String status, Integer totalQuestions, Integer answeredQuestions,
                                      List<FillBlankQuestionResponse> pendingQuestions) {}
