package com.example.demo.flashcard.ai.service;

import com.example.demo.flashcard.ai.config.AiProperties;
import com.example.demo.flashcard.ai.entity.AiGenerationGate;
import com.example.demo.flashcard.ai.repository.*;
import com.example.demo.flashcard.ai.exception.AiException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.*;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class AiGenerationUsageService {
    private final AiGateRepository gate;
    private final AiBatchRepository batches;
    private final AiProperties settings;
    private final PlatformTransactionManager transactions;

    @PostConstruct
    void initialize() {
        try {
            new TransactionTemplate(transactions).executeWithoutResult(status -> {
                if (!gate.existsById(1L)) {
                    var row = new AiGenerationGate();
                    row.setId(1L);
                    gate.saveAndFlush(row);
                }
            });
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Instance khác có thể vừa tạo singleton. Unique PK đảm bảo chỉ một hàng.
        }
    }

    public void reserve(Long uid, LocalDateTime now) {
        gate.lockGate().orElseThrow(() -> new AiException(503,"AI_GENERATION_FAILED"));
        var day = now.toLocalDate().atStartOfDay();
        if (batches.countByUserIdAndCreatedAtGreaterThanEqual(uid,day) >= settings.getDailyUserLimit())
            reject("APPLICATION_DAILY_LIMIT");
        if (batches.countByCreatedAtGreaterThanEqual(day) >= settings.getDailyGlobalLimit())
            reject("APPLICATION_GLOBAL_LIMIT");
        if (batches.countByUserIdAndStatusAndLeaseUntilAfter(uid,com.example.demo.flashcard.ai.entity.AiGenerationStatus.PENDING.name(),now) >= settings.getMaxConcurrentPerUser())
            reject("APPLICATION_CONCURRENT_LIMIT");
        // Dọn nội dung preview hết hạn khi có hoạt động mới; giữ ledger nhỏ cho quota/idempotency.
        batches.expire(now);
    }

    private void reject(String code) {
        log.warn("AI diagnostic={} providerRequestSent=false",code);
        throw new AiException(429,code);
    }
}
