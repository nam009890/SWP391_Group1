package com.example.demo.grammar.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "grammar_questions")
public class GrammarQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Friendly identifier key (e.g. cau_1_tim_loi_sai)
    @Column(name = "question_key", length = 100)
    private String questionKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private GrammarGroup group;

    // Readable title in Vietnamese
    @Column(name = "title", length = 255, columnDefinition = "NVARCHAR(255)")
    private String title;

    // Question type: SPOT_ERROR | FILL_BLANK_TEXT | FILL_BLANK_DROPDOWN | FILL_BLANK_CARDS | IMAGE_QUESTION | PASSAGE_CLOZE | READING_COMPREHENSION | AUDIO_LISTENING
    @Column(name = "question_type", nullable = false, length = 50)
    private String questionType;

    // Instruction prompt
    @Column(name = "instruction", columnDefinition = "NVARCHAR(MAX)")
    private String instruction;

    // Full JSON content (tokens, template, blanks, options, sub_questions, audio_url, etc.)
    @Column(name = "payload_json", columnDefinition = "NVARCHAR(MAX)")
    private String payloadJson;

    // Specific to SPOT_ERROR
    @Column(name = "correct_token_id")
    private Integer correctTokenId;

    @Column(name = "correction", length = 255, columnDefinition = "NVARCHAR(255)")
    private String correction;

    @Column(name = "error_type", length = 255, columnDefinition = "NVARCHAR(255)")
    private String errorType;

    @Column(name = "hint", length = 500, columnDefinition = "NVARCHAR(500)")
    private String hint;

    // Explanation & grammar rule
    @Column(name = "explanation", columnDefinition = "NVARCHAR(MAX)")
    private String explanation;

    public GrammarQuestion() {
    }

    @Builder
    public GrammarQuestion(Long id, String questionKey, GrammarGroup group, String title,
                           String questionType, String instruction, String payloadJson,
                           Integer correctTokenId, String correction, String errorType,
                           String hint, String explanation, LocalDateTime createdAt,
                           LocalDateTime updatedAt) {
        this.id = id;
        this.questionKey = questionKey;
        this.group = group;
        this.title = title;
        this.questionType = questionType;
        this.instruction = instruction;
        this.payloadJson = payloadJson;
        this.correctTokenId = correctTokenId;
        this.correction = correction;
        this.errorType = errorType;
        this.hint = hint;
        this.explanation = explanation;
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
