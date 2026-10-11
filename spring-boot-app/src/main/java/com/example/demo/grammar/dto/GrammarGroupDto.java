package com.example.demo.grammar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
public class GrammarGroupDto {

    private String id; // groupKey, e.g. group_test_01

    private Long dbId;

    private String title;

    private String description;

    private String icon;

    private AuthorDto author;

    @Builder.Default
    private List<GrammarQuestionDto> questions = new ArrayList<>();

    @Builder.Default
    private List<GrammarReportDto> reports = new ArrayList<>();
}
