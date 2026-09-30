package com.example.demo.study.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {
    private Long id;
    private Long userId;
    private Long flashcardId;
    private Integer easeFactor;
    private Integer intervalDays;
    private Integer repetitions;
    private LocalDateTime nextReviewDate;
}
