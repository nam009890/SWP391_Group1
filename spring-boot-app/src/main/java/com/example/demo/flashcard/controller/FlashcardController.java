package com.example.demo.flashcard.controller;


import com.example.demo.common.security.UserPrincipal;
import com.example.demo.common.security.CurrentUser;
import com.example.demo.flashcard.dto.AiRequestDto;
import com.example.demo.flashcard.dto.DeckRequest;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckResponse;
import com.example.demo.flashcard.dto.FlashcardRequest;
import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.flashcard.service.DeckService;
import com.example.demo.flashcard.service.FlashcardService;
import com.example.demo.flashcard.service.impl.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class FlashcardController {

    private final DeckService deckService;
    private final FlashcardService flashcardService;
    private final GeminiService geminiService;

    @GetMapping
    public ResponseEntity<List<DeckDto>> getMyDecks(@CurrentUser UserPrincipal userPrincipal) {
        return ResponseEntity.ok(deckService.getMyDecksWithCount(userPrincipal.getId()));
    }

    @PostMapping
    public ResponseEntity<DeckResponse> createDeck(@RequestBody DeckRequest request, @CurrentUser UserPrincipal userPrincipal) {
        return ResponseEntity.ok(deckService.createDeck(request, userPrincipal.getId()));
    }

    @GetMapping("/{deckId}")
    public ResponseEntity<DeckResponse> getDeckById(@PathVariable Long deckId, @CurrentUser UserPrincipal userPrincipal) {
        return ResponseEntity.ok(deckService.getDeckById(deckId, userPrincipal.getId()));
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> deleteDeck(@PathVariable Long deckId, @CurrentUser UserPrincipal userPrincipal) {
        deckService.deleteDeck(deckId, userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{deckId}/flashcards")
    public ResponseEntity<List<FlashcardResponse>> getFlashcardsByDeck(@PathVariable Long deckId) {
        // Todo: Add ownership check here too if needed, but for now it's okay
        return ResponseEntity.ok(flashcardService.getFlashcardsByDeckId(deckId));
    }

    @PostMapping("/{deckId}/flashcards")
    public ResponseEntity<FlashcardResponse> addFlashcardToDeck(@PathVariable Long deckId, @RequestBody FlashcardRequest request) {
        return ResponseEntity.ok(flashcardService.addFlashcardToDeck(deckId, request));
    }

    @PostMapping("/{deckId}/generate-ai")
    public ResponseEntity<List<FlashcardResponse>> generateAiFlashcards(@PathVariable Long deckId, @RequestBody AiRequestDto request) throws Exception {
        return ResponseEntity.ok(flashcardService.generateAiFlashcards(deckId, request.getPrompt()));
    }

    @GetMapping("/models")
    public ResponseEntity<String> getAvailableModels() {
        return ResponseEntity.ok(geminiService.getAvailableModels());
    }

    @PutMapping("/{deckId}/flashcards/{flashcardId}")
    public ResponseEntity<FlashcardResponse> updateFlashcard(@PathVariable Long deckId, @PathVariable Long flashcardId, @RequestBody FlashcardRequest request) {
        return ResponseEntity.ok(flashcardService.updateFlashcard(deckId, flashcardId, request));
    }

    @DeleteMapping("/{deckId}/flashcards/{flashcardId}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable Long deckId, @PathVariable Long flashcardId) {
        flashcardService.deleteFlashcard(deckId, flashcardId);
        return ResponseEntity.noContent().build();
    }
}

