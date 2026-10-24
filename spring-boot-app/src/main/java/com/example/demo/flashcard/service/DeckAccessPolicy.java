package com.example.demo.flashcard.service;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.common.security.UserPrincipal;
import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.entity.DeckVisibility;
import com.example.demo.flashcard.repository.DeckRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeckAccessPolicy {
    private final DeckRepository decks;

    public DeckAccessPolicy(DeckRepository decks) { this.decks = decks; }

    public Long currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal
                ? principal.getId() : null;
    }

    public Long requireUserId() {
        Long id = currentUserId();
        if (id == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        return id;
    }

    public boolean canManageDeck(Deck deck, Long userId) {
        // Deck legacy không có owner luôn chỉ đọc, không được chiếm quyền sở hữu.
        return !deck.isDeleted() && userId != null && deck.getOwner() != null
                && userId.equals(deck.getOwner().getId());
    }

    public boolean canViewDeck(Deck deck, Long userId) {
        return deck != null && !deck.isDeleted()
                && (deck.getVisibility() == DeckVisibility.PUBLIC || canManageDeck(deck, userId));
    }

    public void requireViewAccess(Deck deck, Long userId) {
        // Kiểm tra backend để private deck không bị lộ qua URL hoặc dữ liệu học đã lưu.
        if (!canViewDeck(deck, userId)) throw new ResourceNotFoundException("Deck not found");
    }

    public Deck requireViewAccess(Long deckId, Long userId) {
        Deck deck = decks.findById(deckId).orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        requireViewAccess(deck, userId);
        return deck;
    }

    public Deck requireOwner(Long deckId) {
        Long userId = requireUserId();
        Deck deck = requireViewAccess(deckId, userId);
        if (!canManageDeck(deck, userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the deck owner can manage this deck");
        return deck;
    }
}
