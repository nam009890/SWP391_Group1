package com.swp391.evms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_vocabularies")
@Getter @Setter
public class UserVocabulary {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "vocabulary_id") private Vocabulary vocabulary;
    @Enumerated(EnumType.STRING) @Column(name = "learning_status") private LearningStatus learningStatus;
    @Column(name = "is_manual_weak") private Boolean manualWeak;
    @Column(name = "mastery_score") private Integer masteryScore;
    @Column(name = "total_attempts") private Integer totalAttempts;
    @Column(name = "correct_count") private Integer correctCount;
    @Column(name = "wrong_count") private Integer wrongCount;
    @Column(name = "consecutive_wrong") private Integer consecutiveWrong;
    @Column(name = "last_reviewed_at") private OffsetDateTime lastReviewedAt;
    @Column(name = "next_review_at") private OffsetDateTime nextReviewAt;
    @Column(name = "created_at") private OffsetDateTime createdAt;
    @Column(name = "updated_at") private OffsetDateTime updatedAt;
    @Column(name = "weak_deleted") private Boolean weakDeleted;
    @Column(name = "weak_deleted_at") private OffsetDateTime weakDeletedAt;
    @Column(name = "weak_note") private String weakNote;
}
