package com.example.demo.flashcard.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.dto.DeckRequest;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckResponse;
import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.repository.DeckRepository;
import com.example.demo.flashcard.service.DeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;

    @Override
    public List<DeckDto> getAllDecksWithCount() {
        return deckRepository.findAllDecksWithFlashcardCount();
    }

    @Override
    public DeckResponse createDeck(DeckRequest request) {
        Deck deck = Deck.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        Deck savedDeck = deckRepository.save(deck);
        return mapToResponse(savedDeck);
    }

    @Override
    public DeckResponse getDeckById(Long id) {
        Deck deck = deckRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found with id: " + id));
        return mapToResponse(deck);
    }

    private DeckResponse mapToResponse(Deck deck) {
        return DeckResponse.builder()
                .id(deck.getId())
                .name(deck.getName())
                .description(deck.getDescription())
                .build();
    }
}
