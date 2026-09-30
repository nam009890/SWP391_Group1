package com.example.demo.flashcard.repository;

import com.example.demo.flashcard.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByDeckId(Long deckId);

    @Query("SELECT f FROM Flashcard f LEFT JOIN UserFlashcardReview r ON f.id = r.flashcard.id AND r.user.id = :userId " +
           "WHERE f.deck.id = :deckId AND (r IS NULL OR r.nextReviewDate <= CURRENT_TIMESTAMP)")
    List<Flashcard> findFlashcardsToStudy(@Param("deckId") Long deckId, @Param("userId") Long userId);
}
