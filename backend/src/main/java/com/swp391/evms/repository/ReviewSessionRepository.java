package com.swp391.evms.repository;

import com.swp391.evms.entity.ReviewSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewSessionRepository extends JpaRepository<ReviewSession, Long> {
    Optional<ReviewSession> findByIdAndUserId(Long id, Long userId);
}
