package com.example.demo.flashcard.controller;

import com.example.demo.flashcard.dto.AiRequestDto;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.service.DeckService;
import com.example.demo.flashcard.service.FlashcardService;
import com.example.demo.flashcard.service.impl.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/decks")
public class FlashcardController {

    @Autowired
    private DeckService deckService;

    @Autowired
    private FlashcardService flashcardService;

    @Autowired
    private GeminiService geminiService;

    @GetMapping
    public ResponseEntity<List<DeckDto>> getAllDecks() {
        List<DeckDto> decks = deckService.getAllDecksWithCount();
        return ResponseEntity.ok(decks);
    }

    @PostMapping
    public ResponseEntity<Deck> createDeck(@RequestBody Deck deck) {
        Deck savedDeck = deckService.createDeck(deck);
        return ResponseEntity.ok(savedDeck);
    }

    @GetMapping("/{deckId}")
    public ResponseEntity<Deck> getDeckById(@PathVariable Long deckId) {
        return deckService.getDeckById(deckId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{deckId}/flashcards")
    public ResponseEntity<List<Flashcard>> getFlashcardsByDeck(@PathVariable Long deckId) {
        List<Flashcard> flashcards = flashcardService.getFlashcardsByDeckId(deckId);
        return ResponseEntity.ok(flashcards);
    }

    @PostMapping("/{deckId}/flashcards")
    public ResponseEntity<Flashcard> addFlashcardToDeck(@PathVariable Long deckId, @RequestBody Flashcard flashcard) {
        return flashcardService.addFlashcardToDeck(deckId, flashcard)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{deckId}/generate-ai")
    public ResponseEntity<List<Flashcard>> generateAiFlashcards(@PathVariable Long deckId, @RequestBody AiRequestDto request) {
        try {
            // Check if deck exists
            if (deckService.getDeckById(deckId).isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Call Gemini AI
            List<Flashcard> generatedCards = geminiService.generateFlashcards(request.getPrompt());
            
            // Save each generated card to the deck
            for (Flashcard card : generatedCards) {
                flashcardService.addFlashcardToDeck(deckId, card);
            }
            
            return ResponseEntity.ok(generatedCards);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/models")
    public ResponseEntity<String> getAvailableModels() {
        try {
            return ResponseEntity.ok(geminiService.getAvailableModels());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
