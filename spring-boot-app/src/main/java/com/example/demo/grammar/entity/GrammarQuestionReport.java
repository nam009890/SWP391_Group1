package com.example.demo.grammar.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "grammar_question_reports")
public class GrammarQuestionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_key", nullable = false, unique = true, length = 100)
    private String reportKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private GrammarGroup group;

    @Column(name = "question_key", length = 100)
    private String questionKey;

    @Column(name = "question_title", length = 255)
    private String questionTitle;

    @Column(name = "error_type", length = 255)
    private String errorType;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "reporter_name", length = 255)
    private String reporterName;

    @Column(name = "reporter_email", length = 255)
    private String reporterEmail;

    @Column(name = "author_name", length = 255)
    private String authorName;

    @Column(name = "author_email", length = 255)
    private String authorEmail;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING | RESOLVED

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
