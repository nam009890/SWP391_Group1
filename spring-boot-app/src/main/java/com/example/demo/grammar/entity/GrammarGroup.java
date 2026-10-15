package com.example.demo.grammar.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "grammar_groups")
public class GrammarGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_key", nullable = false, unique = true, length = 100)
    private String groupKey;

    @Column(name = "title", nullable = false, length = 255, columnDefinition = "NVARCHAR(255)")
    private String title;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "author_name", length = 255, columnDefinition = "NVARCHAR(255)")
    private String authorName;

    @Column(name = "author_email", length = 255, columnDefinition = "NVARCHAR(255)")
    private String authorEmail;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GrammarQuestion> questions = new ArrayList<>();

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GrammarQuestionReport> reports = new ArrayList<>();

    public GrammarGroup() {
    }

    @Builder
    public GrammarGroup(Long id, String groupKey, String title, String description, String icon,
                        String authorName, String authorEmail, List<GrammarQuestion> questions,
                        List<GrammarQuestionReport> reports, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.groupKey = groupKey;
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.questions = questions != null ? questions : new ArrayList<>();
        this.reports = reports != null ? reports : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
