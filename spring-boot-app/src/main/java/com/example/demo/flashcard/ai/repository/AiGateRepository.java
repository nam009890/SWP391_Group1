package com.example.demo.flashcard.ai.repository;

import com.example.demo.flashcard.ai.entity.AiGenerationGate;
import org.springframework.data.jpa.repository.*;
public interface AiGateRepository extends JpaRepository<AiGenerationGate,Long> {
    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from AiGenerationGate g where g.id = 1")
    java.util.Optional<AiGenerationGate> lockGate();
}
