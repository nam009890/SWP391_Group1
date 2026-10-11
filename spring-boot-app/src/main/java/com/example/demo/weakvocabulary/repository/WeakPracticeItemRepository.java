package com.example.demo.weakvocabulary.repository;

import com.example.demo.weakvocabulary.entity.WeakPracticeItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface WeakPracticeItemRepository extends JpaRepository<WeakPracticeItem, Long> {
    List<WeakPracticeItem> findBySessionIdOrderByItemOrder(Long id);

    Optional<WeakPracticeItem> findByIdAndSessionId(Long id, Long sessionId);
}
