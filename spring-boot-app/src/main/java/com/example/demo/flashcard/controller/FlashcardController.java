package com.example.demo.flashcard.controller;

import com.example.demo.flashcard.dto.AiRequestDto;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckPage;
import com.example.demo.flashcard.dto.DeckRequest;
import com.example.demo.flashcard.dto.DeckResponse;
import com.example.demo.flashcard.dto.FlashcardRequest;
import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.flashcard.entity.DeckVisibility;
import com.example.demo.flashcard.service.DeckAccessPolicy;
import com.example.demo.flashcard.service.DeckService;
import com.example.demo.flashcard.service.FlashcardService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/decks")
public class FlashcardController {

    private final DeckService deckService;
    private final FlashcardService flashcardService;
    private final DeckAccessPolicy access;

    public FlashcardController(DeckService deckService, FlashcardService flashcardService,
            DeckAccessPolicy access) {
        this.deckService = deckService;
        this.flashcardService = flashcardService;
        this.access = access;
    }

    @GetMapping("/public")
    public DeckPage publicDecks(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "NEWEST") String sort, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return DeckPage.from(deckService.list(false, keyword, null, sort, page, size));
    }

    @GetMapping("/my")
    public DeckPage myDecks(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) DeckVisibility visibility,
            @RequestParam(defaultValue = "NEWEST") String sort, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return DeckPage.from(deckService.list(true, keyword, visibility, sort, page, size));
    }

    @GetMapping("/public/{deckId}")
    public DeckResponse publicDeck(@PathVariable Long deckId) { return deckService.getPublic(deckId); }

    @GetMapping("/public/{deckId}/flashcards")
    public List<FlashcardResponse> publicCards(@PathVariable Long deckId) {
        access.requireViewAccess(deckId, null);
        return flashcardService.getFlashcardsByDeckId(deckId);
    }

    @PutMapping("/{deckId}")
    public DeckResponse update(@PathVariable Long deckId, @RequestBody DeckRequest request) {
        return deckService.update(deckId, request);
    }

    @PatchMapping("/{deckId}/visibility")
    public DeckResponse visibility(@PathVariable Long deckId, @RequestBody DeckRequest request) {
        return deckService.visibility(deckId, request.getVisibility());
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> delete(@PathVariable Long deckId) {
        deckService.delete(deckId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<DeckDto>> getAllDecks() {
        return ResponseEntity.ok(deckService.getAllDecksWithCount());
    }

    @PostMapping
    public ResponseEntity<DeckResponse> createDeck(@RequestBody DeckRequest request) {
        return ResponseEntity.ok(deckService.createDeck(request));
    }

    @GetMapping("/{deckId}")
    public ResponseEntity<DeckResponse> getDeckById(@PathVariable Long deckId) {
        return ResponseEntity.ok(deckService.getDeckById(deckId));
    }

    @GetMapping("/{deckId}/flashcards")
    public ResponseEntity<List<FlashcardResponse>> getFlashcardsByDeck(@PathVariable Long deckId) {
        return ResponseEntity.ok(flashcardService.getFlashcardsByDeckId(deckId));
    }

    @PostMapping("/{deckId}/flashcards")
    public ResponseEntity<FlashcardResponse> addFlashcardToDeck(@PathVariable Long deckId, @RequestBody FlashcardRequest request) {
        return ResponseEntity.ok(flashcardService.addFlashcardToDeck(deckId, request));
    }

    @PostMapping("/{deckId}/generate-ai")
    public ResponseEntity<List<FlashcardResponse>> generateAiFlashcards(
            @PathVariable Long deckId,
            @RequestBody AiRequestDto request
    ) {
        return ResponseEntity.ok(flashcardService.generateAiFlashcards(deckId, request.getPrompt()));
    }
}
