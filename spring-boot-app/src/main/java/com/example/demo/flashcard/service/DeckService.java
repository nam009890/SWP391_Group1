package com.example.demo.flashcard.service;

import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.entity.Deck;

import java.util.List;
import java.util.Optional;

public interface DeckService {
    List<DeckDto> getAllDecksWithCount();
    Deck createDeck(Deck deck);
    Optional<Deck> getDeckById(Long id);
}
