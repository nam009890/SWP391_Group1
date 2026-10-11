package com.example.demo.grammar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrammarReportDto {
    private String id; // e.g. rep_1728...
    private Long dbId;
    private String groupId;
    private String testId;
    private String testTitle;
    private String groupTitle;
    private String questionId;
    private String questionTitle;
    private String errorType;
    private String description;
    private String reporterName;
    private String reporterEmail;
    private String authorName;
    private String authorEmail;
    private String status;
    private String createdAt;
}
