package com.example.demo.grammar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrammarResponseDto {

    @JsonProperty("lesson_id")
    private String lessonId;

    @JsonProperty("lesson_title")
    private String lessonTitle;

    private List<GrammarGroupDto> groups = new ArrayList<>();

    public GrammarResponseDto() {
    }

    @Builder
    public GrammarResponseDto(String lessonId, String lessonTitle, List<GrammarGroupDto> groups) {
        this.lessonId = lessonId;
        this.lessonTitle = lessonTitle;
        this.groups = groups != null ? groups : new ArrayList<>();
    }
}
