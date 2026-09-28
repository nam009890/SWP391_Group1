package com.swp391.evms.controller;

import com.swp391.evms.dto.request.*;
import com.swp391.evms.dto.response.*;
import com.swp391.evms.service.*;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weak-vocabularies")
public class WeakVocabularyController {
    private final WeakVocabularyService weakVocabularyService;
    private final WeakVocabularyPracticeService practiceService;
    public WeakVocabularyController(WeakVocabularyService weakVocabularyService, WeakVocabularyPracticeService practiceService) {
        this.weakVocabularyService=weakVocabularyService; this.practiceService=practiceService;
    }
    @GetMapping
    public List<WeakVocabularyResponse> list(@RequestParam Long userId) { return weakVocabularyService.getWeakVocabularies(userId); }
    @PostMapping("/practice-sessions")
    public ResponseEntity<StartPracticeResponse> start(@RequestParam Long userId, @Valid @RequestBody(required = false) StartPracticeRequest request) {
        StartPracticeResponse response=practiceService.startPractice(userId, request);
        return ResponseEntity.created(URI.create("/api/weak-vocabularies/practice-sessions/" + response.sessionId())).body(response);
    }
    @GetMapping("/practice-sessions/{sessionId}")
    public PracticeSessionResponse session(@RequestParam Long userId, @PathVariable Long sessionId) { return practiceService.getSession(userId, sessionId); }
    @PostMapping("/practice-sessions/{sessionId}/items/{itemId}/answer")
    public SubmitFillBlankAnswerResponse answer(@RequestParam Long userId, @PathVariable Long sessionId, @PathVariable Long itemId,
        @Valid @RequestBody SubmitFillBlankAnswerRequest request) { return practiceService.submitAnswer(userId, sessionId, itemId, request); }
    @GetMapping("/practice-sessions/{sessionId}/summary")
    public PracticeSummaryResponse summary(@RequestParam Long userId, @PathVariable Long sessionId) { return practiceService.getSummary(userId, sessionId); }
}
