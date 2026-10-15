package com.example.demo.study.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long userId;
    private Long flashcardId;
    private Integer easeFactor;
    private Integer intervalDays;
    private Integer repetitions;
    private LocalDateTime nextReviewDate;

    public ReviewResponse() {
    }

    @Builder
    public ReviewResponse(Long id, Long userId, Long flashcardId, Integer easeFactor, Integer intervalDays, Integer repetitions, LocalDateTime nextReviewDate) {
        this.id = id;
        this.userId = userId;
        this.flashcardId = flashcardId;
        this.easeFactor = easeFactor;
        this.intervalDays = intervalDays;
        this.repetitions = repetitions;
        this.nextReviewDate = nextReviewDate;
    }
}
