package com.example.demo.weakvocabulary.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
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
    private boolean answered = false;
    private LocalDateTime answeredAt;

    public WeakPracticeItem() {
    }

    @Builder
    public WeakPracticeItem(Long id, WeakPracticeSession session, UserWeakVocabulary userWeakVocabulary,
                            int itemOrder, WeakQuestionType questionType, String questionContent,
                            String correctAnswer, String optionsJson, boolean answered, LocalDateTime answeredAt) {
        this.id = id;
        this.session = session;
        this.userWeakVocabulary = userWeakVocabulary;
        this.itemOrder = itemOrder;
        this.questionType = questionType;
        this.questionContent = questionContent;
        this.correctAnswer = correctAnswer;
        this.optionsJson = optionsJson;
        this.answered = answered;
        this.answeredAt = answeredAt;
    }
}
