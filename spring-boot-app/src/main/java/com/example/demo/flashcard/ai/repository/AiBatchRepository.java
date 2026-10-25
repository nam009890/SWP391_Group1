package com.example.demo.flashcard.ai.repository;

import com.example.demo.flashcard.ai.entity.AiGenerationBatch;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;

public interface AiBatchRepository extends JpaRepository<AiGenerationBatch,String> {
    Optional<AiGenerationBatch> findByUserIdAndRequestId(Long userId, String requestId);
    long countByUserIdAndCreatedAtGreaterThanEqual(Long userId, LocalDateTime since);
    long countByCreatedAtGreaterThanEqual(LocalDateTime since);
    long countByUserIdAndStatusAndLeaseUntilAfter(Long userId, String status, LocalDateTime now);

    @Modifying
    @Query("update AiGenerationBatch b set b.status = 'EXPIRED', b.previewJson = null "
            + "where b.status = 'READY' and b.expiresAt < :now")
    int expire(@Param("now") LocalDateTime now);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from AiGenerationBatch b where b.id = :id")
    Optional<AiGenerationBatch> findForUpdate(@Param("id") String id);
}
