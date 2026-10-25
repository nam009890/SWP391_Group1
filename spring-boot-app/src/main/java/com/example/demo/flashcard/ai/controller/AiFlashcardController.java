package com.example.demo.flashcard.ai.controller;

import com.example.demo.common.security.*;
import com.example.demo.flashcard.ai.config.AiProperties;
import com.example.demo.flashcard.ai.dto.AiDtos.*;
import com.example.demo.flashcard.ai.service.*;
import com.example.demo.flashcard.service.DeckAccessPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/decks/{deckId}/ai")
@RequiredArgsConstructor
public class AiFlashcardController {
    private final AiFlashcardGenerationService generation;
    private final AiGenerationStore store;
    private final AiProperties settings;
    private final DeckAccessPolicy access;

    @GetMapping("/options")
    public Options options(@PathVariable Long deckId) {
        access.requireOwner(deckId);
        String source = settings.source();
        return new Options(source,!"DISABLED".equals(source),Math.min(20,settings.getMaxCards()),
                List.of("Travel","Business English"),List.of("A1","A2","B1","B2","C1","C2"),
                List.of(5,10,15,20).stream().filter(n -> n <= settings.getMaxCards()).toList());
    }
    @PostMapping("/preview")
    public Preview preview(@CurrentUser UserPrincipal user, @PathVariable Long deckId, @RequestBody PreviewRequest request) {
        return generation.preview(user.getId(),deckId,request);
    }
    @PostMapping("/commit")
    public CommitResult commit(@CurrentUser UserPrincipal user, @PathVariable Long deckId, @RequestBody CommitRequest request) {
        return store.commit(user.getId(),deckId,request);
    }
    @PostMapping("/preview/offline")
    public Preview offlinePreview(@CurrentUser UserPrincipal user, @PathVariable Long deckId, @RequestBody PreviewRequest request) {
        return generation.offlinePreview(user.getId(),deckId,request);
    }
}
