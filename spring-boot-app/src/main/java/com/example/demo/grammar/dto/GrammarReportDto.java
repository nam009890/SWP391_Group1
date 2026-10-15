package com.example.demo.grammar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
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

    public GrammarReportDto() {
    }

    @Builder
    public GrammarReportDto(String id, Long dbId, String groupId, String testId, String testTitle,
                            String groupTitle, String questionId, String questionTitle, String errorType,
                            String description, String reporterName, String reporterEmail, String authorName,
                            String authorEmail, String status, String createdAt) {
        this.id = id;
        this.dbId = dbId;
        this.groupId = groupId;
        this.testId = testId;
        this.testTitle = testTitle;
        this.groupTitle = groupTitle;
        this.questionId = questionId;
        this.questionTitle = questionTitle;
        this.errorType = errorType;
        this.description = description;
        this.reporterName = reporterName;
        this.reporterEmail = reporterEmail;
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.status = status;
        this.createdAt = createdAt;
    }
}
