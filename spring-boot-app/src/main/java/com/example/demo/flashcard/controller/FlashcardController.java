package com.example.demo.flashcard.controller;

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
    public ResponseEntity<List<FlashcardResponse>> generateAiFlashcards(@PathVariable Long deckId, @RequestBody AiRequestDto request) throws Exception {
        return ResponseEntity.ok(flashcardService.generateAiFlashcards(deckId, request.getPrompt()));
    }

    @GetMapping("/models")
    public ResponseEntity<String> getAvailableModels() {
        return ResponseEntity.ok(geminiService.getAvailableModels());
    }
}
