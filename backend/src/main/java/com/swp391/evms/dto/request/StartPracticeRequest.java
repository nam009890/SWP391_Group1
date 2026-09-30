package com.swp391.evms.dto.request;

import com.swp391.evms.entity.QuestionType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record StartPracticeRequest(@NotNull QuestionType questionType, @NotEmpty List<Long> userVocabularyIds) {}
