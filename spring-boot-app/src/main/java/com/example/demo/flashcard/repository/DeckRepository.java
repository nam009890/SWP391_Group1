package com.example.demo.flashcard.repository;

import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {
    
    @Query("SELECT new com.example.demo.flashcard.dto.DeckDto(d.id, d.name, d.description, COUNT(f.id), d.isPublic, d.user.id, d.user.name) " +
           "FROM Deck d LEFT JOIN Flashcard f ON d.id = f.deck.id " +
           "WHERE d.user.id = :userId " +
           "GROUP BY d.id, d.name, d.description, d.isPublic, d.user.id, d.user.name")
    List<DeckDto> findMyDecksWithFlashcardCount(Long userId);

    @Query("SELECT new com.example.demo.flashcard.dto.DeckDto(d.id, d.name, d.description, COUNT(f.id), d.isPublic, d.user.id, d.user.name) " +
           "FROM Deck d LEFT JOIN Flashcard f ON d.id = f.deck.id " +
           "WHERE d.isPublic = true AND (LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "GROUP BY d.id, d.name, d.description, d.isPublic, d.user.id, d.user.name")
    List<DeckDto> findPublicDecksWithSearch(String search);
}
