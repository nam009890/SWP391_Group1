package com.example.demo.flashcard.ai.entity;

/** Persisted batch states; kept in sync with the SQL CK_ai_status contract. */
public enum AiGenerationStatus {
    PENDING, READY, FAILED, EXPIRED, COMMITTED
}
