package com.example.demo.grammar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrammarQuestionDto {

    private Object id; // Can be numeric or string key (e.g. "cau_1_tim_loi_sai")

    private Long dbId;

    private String groupId;

    private String title;

    private String type;

    private String instruction;

    // Spot the error specific fields
    private Object tokens;

    @JsonProperty("correct_token_id")
    private Integer correctTokenId;

    private String correction;

    @JsonProperty("error_type")
    private String errorType;

    private String hint;

    private String explanation;

    // Fill blank specific fields
    private String template;

    private Object blanks;

    private Object validation;

    // Media & Image Question fields
    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("image_caption")
    private String imageCaption;

    @JsonProperty("question_text")
    private String questionText;

    private Object options;

    @JsonProperty("correct_answer")
    private String correctAnswer;

    // Passage Cloze & Reading Comprehension fields
    @JsonProperty("passage_title")
    private String passageTitle;

    @JsonProperty("passage_text")
    private String passageText;

    @JsonProperty("sub_questions")
    private Object subQuestions;

    // Audio Listening fields
    @JsonProperty("audio_url")
    private String audioUrl;

    private String transcript;

    public GrammarQuestionDto() {
    }

    @Builder
    public GrammarQuestionDto(Object id, Long dbId, String groupId, String title, String type, String instruction,
                              Object tokens, Integer correctTokenId, String correction, String errorType,
                              String hint, String explanation, String template, Object blanks, Object validation,
                              String imageUrl, String imageCaption, String questionText, Object options,
                              String correctAnswer, String passageTitle, String passageText, Object subQuestions,
                              String audioUrl, String transcript) {
        this.id = id;
        this.dbId = dbId;
        this.groupId = groupId;
        this.title = title;
        this.type = type;
        this.instruction = instruction;
        this.tokens = tokens;
        this.correctTokenId = correctTokenId;
        this.correction = correction;
        this.errorType = errorType;
        this.hint = hint;
        this.explanation = explanation;
        this.template = template;
        this.blanks = blanks;
        this.validation = validation;
        this.imageUrl = imageUrl;
        this.imageCaption = imageCaption;
        this.questionText = questionText;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.passageTitle = passageTitle;
        this.passageText = passageText;
        this.subQuestions = subQuestions;
        this.audioUrl = audioUrl;
        this.transcript = transcript;
    }
}
