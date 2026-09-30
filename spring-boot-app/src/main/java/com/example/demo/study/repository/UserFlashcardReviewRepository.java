package com.example.demo.study.repository;

import com.example.demo.study.entity.UserFlashcardReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserFlashcardReviewRepository extends JpaRepository<UserFlashcardReview, Long> {
    Optional<UserFlashcardReview> findByUserIdAndFlashcardId(Long userId, Long flashcardId);
}
