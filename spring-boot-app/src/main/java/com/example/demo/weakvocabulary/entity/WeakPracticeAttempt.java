package com.example.demo.weakvocabulary.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "weak_practice_attempts", uniqueConstraints = @UniqueConstraint(
        name = "UQ_practice_attempt_item", columnNames = "item_id"))
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
    @Builder.Default
    private LocalDateTime attemptedAt = LocalDateTime.now();
}
