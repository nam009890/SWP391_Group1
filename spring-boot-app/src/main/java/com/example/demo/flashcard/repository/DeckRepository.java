package com.example.demo.flashcard.repository;

import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.entity.Deck;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long>, JpaSpecificationExecutor<Deck> {
    @Override
    @EntityGraph(attributePaths = "owner")
    Page<Deck> findAll(Specification<Deck> specification,
            Pageable pageable);
    
    @Query("SELECT new com.example.demo.flashcard.dto.DeckDto(d.id, d.name, d.description, " +
           "(SELECT COUNT(f.id) FROM Flashcard f WHERE f.deck.id = d.id)) " +
           "FROM Deck d WHERE d.deleted = false AND d.visibility = 'PUBLIC'")
    List<DeckDto> findAllDecksWithFlashcardCount();
}
