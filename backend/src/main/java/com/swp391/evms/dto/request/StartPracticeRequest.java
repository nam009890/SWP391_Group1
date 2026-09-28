package com.swp391.evms.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record StartPracticeRequest(@Min(1) @Max(50) Integer limit) {}
