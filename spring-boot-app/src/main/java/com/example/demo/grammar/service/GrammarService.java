package com.example.demo.grammar.service;

import com.example.demo.grammar.dto.GrammarQuestionDto;

import java.util.List;

public interface GrammarService {

    List<GrammarQuestionDto> getAllQuestions();

    GrammarQuestionDto getQuestionById(Long id);

    GrammarQuestionDto createQuestion(GrammarQuestionDto dto);

    GrammarQuestionDto updateQuestion(Long id, GrammarQuestionDto dto);

    void deleteQuestion(Long id);

    void deleteByQuestionKeyOrId(String key);

    List<GrammarQuestionDto> resetToDefaults();
}
