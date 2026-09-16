package com.example.demo.flashcard.service.impl;

import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.repository.DeckRepository;
import com.example.demo.flashcard.service.DeckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DeckServiceImpl implements DeckService {

    @Autowired
    private DeckRepository deckRepository;

    @Override
    public List<DeckDto> getAllDecksWithCount() {
        return deckRepository.findAllDecksWithFlashcardCount();
    }

    @Override
    public Deck createDeck(Deck deck) {
        return deckRepository.save(deck);
    }

    @Override
    public Optional<Deck> getDeckById(Long id) {
        return deckRepository.findById(id);
    }
}
