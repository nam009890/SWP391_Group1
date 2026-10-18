package com.example.demo.flashcard.repository;

import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {
    
    @Query("SELECT new com.example.demo.flashcard.dto.DeckDto(d.id, d.name, d.description, " +
           "(SELECT COUNT(f.id) FROM Flashcard f WHERE f.deck.id = d.id)) " +
           "FROM Deck d")
    List<DeckDto> findAllDecksWithFlashcardCount();
}
