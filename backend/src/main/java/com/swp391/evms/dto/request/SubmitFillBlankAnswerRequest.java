package com.swp391.evms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitFillBlankAnswerRequest(@NotBlank @Size(max = 1000) String answer) {
}
