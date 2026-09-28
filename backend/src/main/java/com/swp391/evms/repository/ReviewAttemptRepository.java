package com.swp391.evms.repository;

import com.swp391.evms.entity.ReviewAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewAttemptRepository extends JpaRepository<ReviewAttempt, Long> {
    boolean existsBySessionItemId(Long sessionItemId);
}
