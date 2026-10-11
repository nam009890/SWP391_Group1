package com.example.demo.grammar.controller;

import com.example.demo.grammar.dto.GrammarGroupDto;
import com.example.demo.grammar.dto.GrammarQuestionDto;
import com.example.demo.grammar.dto.GrammarReportDto;
import com.example.demo.grammar.dto.GrammarResponseDto;
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
     * Get root grammar module data with all test groups, questions, and reports
     */
    @GetMapping("/questions")
    public ResponseEntity<GrammarResponseDto> getAllData() {
        return ResponseEntity.ok(grammarService.getAllData());
    }

    /**
     * Get list of all groups / tests
     */
    @GetMapping("/groups")
    public ResponseEntity<List<GrammarGroupDto>> getAllGroups() {
        return ResponseEntity.ok(grammarService.getAllGroups());
    }

    /**
     * Get a specific group by ID or group key
     */
    @GetMapping("/groups/{id}")
    public ResponseEntity<GrammarGroupDto> getGroupById(@PathVariable String id) {
        return ResponseEntity.ok(grammarService.getGroupById(id));
    }

    /**
     * Create a new test group
     */
    @PostMapping("/groups")
    public ResponseEntity<GrammarGroupDto> createGroup(@RequestBody GrammarGroupDto request) {
        return ResponseEntity.ok(grammarService.createGroup(request));
    }

    /**
     * Delete a test group by key or ID
     */
    @DeleteMapping("/groups/{id}")
    public ResponseEntity<Map<String, String>> deleteGroup(@PathVariable String id) {
        grammarService.deleteGroup(id);
        return ResponseEntity.ok(Map.of("message", "Deleted test group successfully: " + id));
    }

    /**
     * Get specific question by numeric ID
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
     * Submit an error report for a question
     */
    @PostMapping("/reports")
    public ResponseEntity<GrammarReportDto> submitReport(@RequestBody GrammarReportDto request) {
        return ResponseEntity.ok(grammarService.createReport(request));
    }

    /**
     * Mark an error report as resolved
     */
    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<GrammarReportDto> resolveReport(@PathVariable String id) {
        return ResponseEntity.ok(grammarService.resolveReport(id));
    }

    /**
     * Get reports for a specific creator / author
     */
    @GetMapping("/reports/user/{userEmail}")
    public ResponseEntity<List<GrammarReportDto>> getReportsForAuthor(@PathVariable String userEmail) {
        return ResponseEntity.ok(grammarService.getReportsForAuthor(userEmail));
    }

    /**
     * Reset questions bank to initial default 4 tests
     */
    @PostMapping("/reset-defaults")
    public ResponseEntity<GrammarResponseDto> resetDefaults() {
        return ResponseEntity.ok(grammarService.resetToDefaults());
    }
}
