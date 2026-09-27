package com.example.demo.grammar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrammarQuestionDto {

    private Object id; // Can be numeric or string key (e.g. "cau_1_tim_loi_sai")

    private Long dbId;

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
}
