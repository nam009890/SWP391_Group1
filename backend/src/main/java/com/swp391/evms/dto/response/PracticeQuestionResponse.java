package com.swp391.evms.dto.response;

import java.util.List;
public record PracticeQuestionResponse(Long itemId, Integer itemOrder, String questionType, String question, String hint, List<String> options) {}
