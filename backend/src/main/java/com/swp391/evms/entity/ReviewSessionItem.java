package com.swp391.evms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "review_session_items")
@Getter
@Setter
public class ReviewSessionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ReviewSession session;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_vocabulary_id", nullable = false)
    private UserVocabulary userVocabulary;
    @Column(name = "item_order")
    private Integer itemOrder;
    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    private QuestionType questionType;
    @Column(name = "question_content")
    private String questionContent;
    @Column(name = "correct_answer")
    private String correctAnswer;
    @Enumerated(EnumType.STRING)
    private ReviewItemStatus status;
    @Column(name = "created_at")
    private OffsetDateTime createdAt;
    @Column(name = "answered_at")
    private OffsetDateTime answeredAt;
    @Column(name = "options_json")
    private String optionsJson;
}
