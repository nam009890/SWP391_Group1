package com.example.demo.grammar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrammarGroupDto {

    private String id; // groupKey, e.g. group_test_01

    private Long dbId;

    private String title;

    private String description;

    private String icon;

    private AuthorDto author;

    private List<GrammarQuestionDto> questions = new ArrayList<>();

    private List<GrammarReportDto> reports = new ArrayList<>();

    public GrammarGroupDto() {
    }

    @Builder
    public GrammarGroupDto(String id, Long dbId, String title, String description, String icon, AuthorDto author, List<GrammarQuestionDto> questions, List<GrammarReportDto> reports) {
        this.id = id;
        this.dbId = dbId;
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.author = author;
        this.questions = questions != null ? questions : new ArrayList<>();
        this.reports = reports != null ? reports : new ArrayList<>();
    }
}
