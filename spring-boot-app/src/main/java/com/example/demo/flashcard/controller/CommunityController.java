package com.example.demo.flashcard.controller;


import com.example.demo.common.security.UserPrincipal;
import com.example.demo.common.security.CurrentUser;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckResponse;
import com.example.demo.flashcard.service.DeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final DeckService deckService;

    @GetMapping("/decks")
    public ResponseEntity<List<DeckDto>> searchPublicDecks(@RequestParam(required = false, defaultValue = "") String search) {
        return ResponseEntity.ok(deckService.searchPublicDecks(search));
    }

    @PostMapping("/decks/{deckId}/clone")
    public ResponseEntity<DeckResponse> cloneDeck(@PathVariable Long deckId, @CurrentUser UserPrincipal userPrincipal) {
        return ResponseEntity.ok(deckService.cloneDeck(deckId, userPrincipal.getId()));
    }
}


