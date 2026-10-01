package com.example.demo.grammar.controller;

import com.example.demo.grammar.dto.GrammarQuestionDto;
import com.example.demo.grammar.service.GrammarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grammar")
@RequiredArgsConstructor
public class GrammarController {

    private final GrammarService grammarService;

    /**
     * Get all grammar exercise questions for learners & CMS
     */
    @GetMapping("/questions")
    public ResponseEntity<Map<String, Object>> getAllQuestions() {
        List<GrammarQuestionDto> list = grammarService.getAllQuestions();
        return ResponseEntity.ok(Map.of(
                "lesson_id", "grammar_module_01",
                "lesson_title", "Ngữ Pháp Căn Bản: Thì & Câu Điều Kiện",
                "questions", list
        ));
    }

    /**
     * Get specific question by ID
     */
    @GetMapping("/questions/{id}")
    public ResponseEntity<GrammarQuestionDto> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(grammarService.getQuestionById(id));
    }

    /**
     * Create a new grammar question
     */
    @PostMapping("/questions")
    public ResponseEntity<GrammarQuestionDto> createQuestion(@RequestBody GrammarQuestionDto request) {
        return ResponseEntity.ok(grammarService.createQuestion(request));
    }

    /**
     * Update an existing grammar question
     */
    @PutMapping("/questions/{id}")
    public ResponseEntity<GrammarQuestionDto> updateQuestion(
            @PathVariable Long id,
            @RequestBody GrammarQuestionDto request
    ) {
        return ResponseEntity.ok(grammarService.updateQuestion(id, request));
    }

    /**
     * Delete a question by ID or Question Key
     */
    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Map<String, String>> deleteQuestion(@PathVariable String id) {
        grammarService.deleteByQuestionKeyOrId(id);
        return ResponseEntity.ok(Map.of("message", "Deleted question successfully: " + id));
    }

    /**
     * Reset questions bank to initial sample defaults
     */
    @PostMapping("/reset-defaults")
    public ResponseEntity<Map<String, Object>> resetDefaults() {
        List<GrammarQuestionDto> list = grammarService.resetToDefaults();
        return ResponseEntity.ok(Map.of(
                "lesson_id", "grammar_module_01",
                "lesson_title", "Ngữ Pháp Căn Bản: Thì & Câu Điều Kiện",
                "questions", list,
                "message", "Reset grammar questions bank to defaults"
        ));
    }
}
