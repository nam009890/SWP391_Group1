package com.example.demo.flashcard.service;

import com.example.demo.flashcard.dto.DeckRequest;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckResponse;

import java.util.List;

public interface DeckService {
    List<DeckDto> getAllDecksWithCount();
    DeckResponse createDeck(DeckRequest request);
    DeckResponse getDeckById(Long id);
}
