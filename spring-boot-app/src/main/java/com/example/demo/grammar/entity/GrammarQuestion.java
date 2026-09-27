package com.example.demo.grammar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "grammar_questions")
public class GrammarQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Friendly identifier key (e.g. cau_1_tim_loi_sai)
    @Column(name = "question_key", length = 100)
    private String questionKey;

    // Readable title in Vietnamese
    @Column(name = "title", length = 255)
    private String title;

    // Question type: SPOT_ERROR | FILL_BLANK_TEXT | FILL_BLANK_DROPDOWN | FILL_BLANK_CARDS
    @Column(name = "question_type", nullable = false, length = 50)
    private String questionType;

    // Instruction prompt
    @Column(name = "instruction", length = 500)
    private String instruction;

    // Full JSON content (tokens, template, blanks, options, validation)
    @Lob
    @Column(name = "payload_json", columnDefinition = "NVARCHAR(MAX)")
    private String payloadJson;

    // Specific to SPOT_ERROR
    @Column(name = "correct_token_id")
    private Integer correctTokenId;

    @Column(name = "correction", length = 255)
    private String correction;

    @Column(name = "error_type", length = 255)
    private String errorType;

    @Column(name = "hint", length = 500)
    private String hint;

    // Explanation & grammar rule
    @Lob
    @Column(name = "explanation", columnDefinition = "NVARCHAR(MAX)")
    private String explanation;

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
