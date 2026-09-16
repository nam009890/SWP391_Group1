package com.example.demo.flashcard.service.impl;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.DeckRepository;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.flashcard.service.FlashcardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FlashcardServiceImpl implements FlashcardService {

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private DeckRepository deckRepository;

    @Override
    public List<Flashcard> getFlashcardsByDeckId(Long deckId) {
        return flashcardRepository.findByDeckId(deckId);
    }

    @Override
    public Optional<Flashcard> addFlashcardToDeck(Long deckId, Flashcard flashcard) {
        return deckRepository.findById(deckId).map(deck -> {
            flashcard.setDeck(deck);
            return flashcardRepository.save(flashcard);
        });
    }
}
