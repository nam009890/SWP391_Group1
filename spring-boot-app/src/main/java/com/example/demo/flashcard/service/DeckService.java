package com.example.demo.flashcard.service;

import com.example.demo.flashcard.dto.DeckRequest;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckResponse;

import java.util.List;

public interface DeckService {
    List<DeckDto> getMyDecksWithCount(Long userId);
    List<DeckDto> searchPublicDecks(String search);
    DeckResponse createDeck(DeckRequest request, Long userId);
    DeckResponse getDeckById(Long id, Long userId);
    DeckResponse cloneDeck(Long deckId, Long userId);
    void deleteDeck(Long deckId, Long userId);
}
