package com.swp391.evms.repository;

import com.swp391.evms.entity.*;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewSessionItemRepository extends JpaRepository<ReviewSessionItem, Long> {
    List<ReviewSessionItem> findBySessionIdOrderByItemOrderAsc(Long sessionId);
    List<ReviewSessionItem> findBySessionIdAndStatusOrderByItemOrderAsc(Long sessionId, ReviewItemStatus status);
    Optional<ReviewSessionItem> findByIdAndSessionId(Long itemId, Long sessionId);
}
