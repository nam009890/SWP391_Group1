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
    public enum DetectionStatus {
        NOT_DETECTED, AUTO_ADDED, ALREADY_WEAK, SUPPRESSED
    }

    public record WeakDetection(DetectionStatus status,
            com.example.demo.weakvocabulary.entity.WeakDetectionReason reason, Long weakVocabularyId) {
    }

    private String requestId;
    private long studyReviewCount;
    private Double studyAccuracy;
    private WeakDetection weakDetection;
    private Long id;
    private Long userId;
    private Long flashcardId;
    private Integer easeFactor;
    private Integer intervalDays;
    private Integer repetitions;
    private LocalDateTime nextReviewDate;
}
