package com.example.demo.weakvocabulary.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "weak_practice_attempts")
public class WeakPracticeAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private WeakPracticeSession session;
    @ManyToOne(optional = false)
    private WeakPracticeItem item;
    @ManyToOne(optional = false)
    private UserWeakVocabulary userWeakVocabulary;
    @Enumerated(EnumType.STRING)
    private WeakQuestionType questionType;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String questionContent;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String userAnswer;
    @Column(columnDefinition = "NVARCHAR(255)")
    private String correctAnswer;
    private boolean correct;
    private LocalDateTime attemptedAt = LocalDateTime.now();

    public WeakPracticeAttempt() {
    }

    @Builder
    public WeakPracticeAttempt(Long id, WeakPracticeSession session, WeakPracticeItem item,
                               UserWeakVocabulary userWeakVocabulary, WeakQuestionType questionType,
                               String questionContent, String userAnswer, String correctAnswer,
                               boolean correct, LocalDateTime attemptedAt) {
        this.id = id;
        this.session = session;
        this.item = item;
        this.userWeakVocabulary = userWeakVocabulary;
        this.questionType = questionType;
        this.questionContent = questionContent;
        this.userAnswer = userAnswer;
        this.correctAnswer = correctAnswer;
        this.correct = correct;
        this.attemptedAt = attemptedAt != null ? attemptedAt : LocalDateTime.now();
    }
}
