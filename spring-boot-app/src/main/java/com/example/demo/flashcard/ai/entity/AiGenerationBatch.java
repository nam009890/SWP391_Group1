package com.example.demo.flashcard.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_generation_batches", uniqueConstraints = @UniqueConstraint(
        name = "UQ_ai_user_request", columnNames = {"user_id","request_id"}))
@Getter
@Setter
@NoArgsConstructor
public class AiGenerationBatch {
    @Id @Column(length = 36) private String id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(nullable = false) private Long deckId;
    @Column(name = "request_id", nullable = false, length = 36) private String requestId;
    @Column(nullable = false, length = 64) private String requestFingerprint;
    @Column(nullable = false, length = 20) private String source;
    @Column(nullable = false, length = 40) private String promptVersion;
    @Column(nullable = false, length = 20) private String status;
    @Column(nullable = false) private LocalDateTime createdAt;
    @Column(nullable = false) private LocalDateTime expiresAt;
    @Column(nullable = false) private LocalDateTime leaseUntil;
    private Long inputTokens;
    private Long outputTokens;
    private Integer providerAttempts;
    @Column(length = 60) private String failureCode;
    private Integer failureStatus;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String previewJson;
    @Column(length = 64) private String commitFingerprint;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String commitJson;

    // Keep the existing VARCHAR/API contract while validating every entity write.
    @PrePersist
    @PreUpdate
    void validateStoredEnums() {
        AiGenerationSource.valueOf(source);
        AiGenerationStatus.valueOf(status);
    }
}
