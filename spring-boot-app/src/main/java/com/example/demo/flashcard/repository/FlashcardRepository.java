package com.example.demo.flashcard.repository;

import com.example.demo.flashcard.entity.Flashcard;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    @Query("select f.vocabulary from Flashcard f where f.deck.id = :deckId")
    List<String> vocabularyInDeck(@Param("deckId") Long deckId);
    long countByDeckDeletedFalse();
    List<Flashcard> findByDeckId(Long deckId);
    long countByDeckId(Long deckId);

    @Query("SELECT f.deck.id, COUNT(f.id) FROM Flashcard f WHERE f.deck.id IN :ids GROUP BY f.deck.id")
    List<Object[]> countsByDeckIds(@Param("ids") List<Long> ids);

    @Query("SELECT f FROM Flashcard f WHERE f.deck.deleted = false AND (f.deck.visibility = 'PUBLIC' OR f.deck.owner.id = :uid)")
    Page<Flashcard> findVisible(@Param("uid") Long uid, Pageable pageable);

    @Query("SELECT f FROM Flashcard f LEFT JOIN UserFlashcardReview r ON f.id = r.flashcard.id AND r.user.id = :userId " +
           "WHERE f.deck.id = :deckId AND (r IS NULL OR r.nextReviewDate <= CURRENT_TIMESTAMP)")
    List<Flashcard> findFlashcardsToStudy(@Param("deckId") Long deckId, @Param("userId") Long userId);
}
