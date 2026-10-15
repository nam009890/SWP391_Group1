package com.example.demo.grammar.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
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

    @Column(name = "question_title", length = 255, columnDefinition = "NVARCHAR(255)")
    private String questionTitle;

    @Column(name = "error_type", length = 255, columnDefinition = "NVARCHAR(255)")
    private String errorType;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "reporter_name", length = 255, columnDefinition = "NVARCHAR(255)")
    private String reporterName;

    @Column(name = "reporter_email", length = 255, columnDefinition = "NVARCHAR(255)")
    private String reporterEmail;

    @Column(name = "author_name", length = 255, columnDefinition = "NVARCHAR(255)")
    private String authorName;

    @Column(name = "author_email", length = 255, columnDefinition = "NVARCHAR(255)")
    private String authorEmail;

    @Column(name = "status", length = 50)
    private String status = "PENDING"; // PENDING | RESOLVED

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public GrammarQuestionReport() {
    }

    @Builder
    public GrammarQuestionReport(Long id, String reportKey, GrammarGroup group, String questionKey,
                                 String questionTitle, String errorType, String description,
                                 String reporterName, String reporterEmail, String authorName,
                                 String authorEmail, String status, LocalDateTime createdAt) {
        this.id = id;
        this.reportKey = reportKey;
        this.group = group;
        this.questionKey = questionKey;
        this.questionTitle = questionTitle;
        this.errorType = errorType;
        this.description = description;
        this.reporterName = reporterName;
        this.reporterEmail = reporterEmail;
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.status = status != null ? status : "PENDING";
        this.createdAt = createdAt;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
