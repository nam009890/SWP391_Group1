package com.example.demo.weakvocabulary.entity;

import com.example.demo.user.entity.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "weak_practice_sessions")
public class WeakPracticeSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;
    @Enumerated(EnumType.STRING)
    private WeakQuestionType questionType;
    @Enumerated(EnumType.STRING)
    private WeakPracticeStatus status = WeakPracticeStatus.IN_PROGRESS;
    private LocalDateTime startedAt = LocalDateTime.now();
    private LocalDateTime completedAt;
    private int totalQuestions;
    private int correctAnswers;
    private int wrongAnswers;

    public WeakPracticeSession() {
    }

    @Builder
    public WeakPracticeSession(Long id, User user, WeakQuestionType questionType,
                               WeakPracticeStatus status, LocalDateTime startedAt,
                               LocalDateTime completedAt, int totalQuestions,
                               int correctAnswers, int wrongAnswers) {
        this.id = id;
        this.user = user;
        this.questionType = questionType;
        this.status = status != null ? status : WeakPracticeStatus.IN_PROGRESS;
        this.startedAt = startedAt != null ? startedAt : LocalDateTime.now();
        this.completedAt = completedAt;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.wrongAnswers = wrongAnswers;
    }
}
