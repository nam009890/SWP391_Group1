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
@Table(name = "weak_practice_items")
public class WeakPracticeItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "session_id")
    private WeakPracticeSession session;
    @ManyToOne(optional = false)
    @JoinColumn(name = "weak_vocabulary_id")
    private UserWeakVocabulary userWeakVocabulary;
    private int itemOrder;
    @Enumerated(EnumType.STRING)
    private WeakQuestionType questionType;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String questionContent;
    @Column(columnDefinition = "NVARCHAR(255)")
    private String correctAnswer;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String optionsJson;
    @Builder.Default
    private boolean answered = false;
    private LocalDateTime answeredAt;
}
