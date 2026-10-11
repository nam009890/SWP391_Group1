package com.example.demo.grammar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrammarResponseDto {

    @JsonProperty("lesson_id")
    private String lessonId;

    @JsonProperty("lesson_title")
    private String lessonTitle;

    @Builder.Default
    private List<GrammarGroupDto> groups = new ArrayList<>();
}
