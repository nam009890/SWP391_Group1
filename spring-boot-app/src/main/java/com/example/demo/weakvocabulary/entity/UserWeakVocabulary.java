package com.example.demo.weakvocabulary.entity;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.user.entity.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "user_weak_vocabularies", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "flashcard_id"}))
public class UserWeakVocabulary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(optional = false)
    @JoinColumn(name = "flashcard_id")
    private Flashcard flashcard;
    private boolean manualMarked = false;
    private boolean autoDetected = false;
    private int masteryScore = 0;
    private int totalAttempts = 0;
    private int correctCount = 0;
    private int wrongCount = 0;
    private int consecutiveWrong = 0;
    private Integer lastStudyQuality;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String weakNote;
    private boolean weakDeleted = false;
    private LocalDateTime weakDeletedAt;
    private LocalDateTime lastPracticedAt;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UserWeakVocabulary() {
    }

    @Builder
    public UserWeakVocabulary(Long id, User user, Flashcard flashcard, boolean manualMarked, boolean autoDetected,
                              int masteryScore, int totalAttempts, int correctCount, int wrongCount, int consecutiveWrong,
                              Integer lastStudyQuality, String weakNote, boolean weakDeleted, LocalDateTime weakDeletedAt,
                              LocalDateTime lastPracticedAt, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.flashcard = flashcard;
        this.manualMarked = manualMarked;
        this.autoDetected = autoDetected;
        this.masteryScore = masteryScore;
        this.totalAttempts = totalAttempts;
        this.correctCount = correctCount;
        this.wrongCount = wrongCount;
        this.consecutiveWrong = consecutiveWrong;
        this.lastStudyQuality = lastStudyQuality;
        this.weakNote = weakNote;
        this.weakDeleted = weakDeleted;
        this.weakDeletedAt = weakDeletedAt;
        this.lastPracticedAt = lastPracticedAt;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }
}
