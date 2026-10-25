package com.example.demo.weakvocabulary.repository;

import com.example.demo.weakvocabulary.entity.UserWeakVocabulary;
import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface UserWeakVocabularyRepository extends JpaRepository<UserWeakVocabulary, Long>, JpaSpecificationExecutor<UserWeakVocabulary> {
    Optional<UserWeakVocabulary> findByUserIdAndFlashcardId(Long userId, Long flashcardId);

    interface DeckOption {
        Long getId();
        String getName();
    }

    @Query("select distinct d.id as id, d.name as name from UserWeakVocabulary w "
            + "join w.flashcard f join f.deck d left join d.owner o "
            + "where w.user.id = :uid and w.weakDeleted = false and d.deleted = false "
            + "and (d.visibility = 'PUBLIC' or o.id = :uid) order by d.name")
    java.util.List<DeckOption> findActiveDeckOptions(@org.springframework.data.repository.query.Param("uid") Long userId);
}
