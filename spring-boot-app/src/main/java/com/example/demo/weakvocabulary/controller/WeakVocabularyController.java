package com.example.demo.weakvocabulary.controller;

import com.example.demo.common.security.*;
import com.example.demo.weakvocabulary.dto.WeakDtos.*;
import com.example.demo.weakvocabulary.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weak-vocabularies")
@RequiredArgsConstructor
public class WeakVocabularyController {
    private final WeakVocabularyService weak;
    private final WeakPracticeService practice;

    @PostMapping("/flashcards/{id}")
    public ResponseEntity<WeakResponse> add(@CurrentUser UserPrincipal u, @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(weak.addManual(u.getId(), id));
    }

    @GetMapping
    public PageResponse list(@CurrentUser UserPrincipal u, @RequestParam(required = false) String keyword, @RequestParam(required = false) Long deckId, @RequestParam(required = false) String source, @RequestParam(required = false) Integer masteryMin, @RequestParam(required = false) Integer masteryMax, @RequestParam(required = false) Double accuracyMin, @RequestParam(required = false) Double accuracyMax, @RequestParam(required = false) String sort, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return weak.list(u.getId(), keyword, deckId, source, masteryMin, masteryMax, accuracyMin, accuracyMax, sort, page, size);
    }

    @PatchMapping("/{id}")
    public WeakResponse patch(@CurrentUser UserPrincipal u, @PathVariable Long id, @RequestBody PatchRequest r) {
        return weak.patch(u.getId(), id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser UserPrincipal u, @PathVariable Long id) {
        weak.softDelete(u.getId(), id);
    }

    @PostMapping("/practice-sessions")
    public SessionResponse start(@CurrentUser UserPrincipal u, @RequestBody PracticeStartRequest r) {
        return practice.start(u.getId(), r);
    }

    @GetMapping("/practice-sessions/{id}")
    public SessionResponse session(@CurrentUser UserPrincipal u, @PathVariable Long id) {
        return practice.session(u.getId(), id);
    }

    @PostMapping("/practice-sessions/{sid}/items/{iid}/answer")
    public AnswerResponse answer(@CurrentUser UserPrincipal u, @PathVariable Long sid, @PathVariable Long iid, @RequestBody AnswerRequest r) {
        return practice.answer(u.getId(), sid, iid, r);
    }

    @GetMapping("/practice-sessions/{id}/summary")
    public SummaryResponse summary(@CurrentUser UserPrincipal u, @PathVariable Long id) {
        return practice.summary(u.getId(), id);
    }
}
