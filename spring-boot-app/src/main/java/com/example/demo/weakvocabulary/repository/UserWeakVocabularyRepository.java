package com.example.demo.weakvocabulary.repository;
import com.example.demo.weakvocabulary.entity.UserWeakVocabulary; import org.springframework.data.jpa.repository.*; import java.util.*;
public interface UserWeakVocabularyRepository extends JpaRepository<UserWeakVocabulary,Long>, JpaSpecificationExecutor<UserWeakVocabulary> { Optional<UserWeakVocabulary> findByUserIdAndFlashcardId(Long userId,Long flashcardId); }
