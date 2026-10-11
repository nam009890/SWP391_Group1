package com.example.demo.weakvocabulary.repository;

import com.example.demo.weakvocabulary.entity.WeakPracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface WeakPracticeSessionRepository extends JpaRepository<WeakPracticeSession, Long> {
    Optional<WeakPracticeSession> findByIdAndUserId(Long id, Long userId);
}
