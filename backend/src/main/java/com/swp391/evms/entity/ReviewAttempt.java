package com.swp391.evms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "review_attempts")
@Getter @Setter
public class ReviewAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "session_id") private ReviewSession session;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_vocabulary_id") private UserVocabulary userVocabulary;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "session_item_id") private ReviewSessionItem sessionItem;
    @Enumerated(EnumType.STRING) @Column(name = "question_type") private QuestionType questionType;
    @Column(name = "question_content") private String questionContent;
    @Column(name = "user_answer") private String userAnswer;
    @Column(name = "correct_answer") private String correctAnswer;
    @Column(name = "is_correct") private Boolean correct;
    @Column(name = "response_time_ms") private Integer responseTimeMs;
    @Column(name = "attempted_at") private OffsetDateTime attemptedAt;
}
