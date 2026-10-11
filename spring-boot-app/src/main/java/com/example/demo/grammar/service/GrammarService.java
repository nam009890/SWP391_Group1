package com.example.demo.grammar.service;

import com.example.demo.grammar.dto.GrammarGroupDto;
import com.example.demo.grammar.dto.GrammarQuestionDto;
import com.example.demo.grammar.dto.GrammarReportDto;
import com.example.demo.grammar.dto.GrammarResponseDto;

import java.util.List;

public interface GrammarService {

    GrammarResponseDto getAllData();

    List<GrammarGroupDto> getAllGroups();

    GrammarGroupDto getGroupById(String groupKeyOrId);

    GrammarGroupDto createGroup(GrammarGroupDto dto);

    void deleteGroup(String groupKeyOrId);

    GrammarQuestionDto getQuestionById(Long id);

    GrammarQuestionDto createQuestion(GrammarQuestionDto dto);

    GrammarQuestionDto updateQuestion(Long id, GrammarQuestionDto dto);

    void deleteQuestion(Long id);

    void deleteByQuestionKeyOrId(String keyOrId);

    GrammarReportDto createReport(GrammarReportDto dto);

    GrammarReportDto resolveReport(String reportKeyOrId);

    List<GrammarReportDto> getReportsForAuthor(String authorEmail);

    GrammarResponseDto resetToDefaults();
}
