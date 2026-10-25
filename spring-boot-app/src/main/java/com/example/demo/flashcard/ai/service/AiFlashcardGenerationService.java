package com.example.demo.flashcard.ai.service;

import com.example.demo.flashcard.ai.config.AiProperties;
import com.example.demo.flashcard.ai.dto.AiDtos.*;
import com.example.demo.flashcard.ai.provider.FlashcardGenerationProvider;
import com.example.demo.flashcard.ai.exception.AiException;
import com.example.demo.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiFlashcardGenerationService {
    private final AiGenerationStore store;
    private final AiProperties settings;
    private final List<FlashcardGenerationProvider> providers;

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Preview preview(Long uid, Long deckId, PreviewRequest request) {
        return generate(uid,deckId,request,settings.source());
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Preview offlinePreview(Long uid, Long deckId, PreviewRequest request) {
        return generate(uid,deckId,request,"DISABLED".equals(settings.source())?"DISABLED":com.example.demo.flashcard.ai.entity.AiGenerationSource.DEMO_LIBRARY.name());
    }

    private Preview generate(Long uid, Long deckId, PreviewRequest request, String source) {
        var reservation = store.reserve(uid,deckId,request,source);
        if (reservation.replay() != null) return reservation.replay();
        try {
            var provider = providers.stream().filter(p -> source.equals(p.source())).findFirst()
                    .orElseThrow(() -> new AiException(503,"AI_NOT_CONFIGURED"));
            // Không giữ transaction hay khóa database trong lúc chờ dịch vụ bên ngoài.
            var result = provider.generate(reservation.specification(),reservation.excluded());
            Preview preview = store.finish(uid,deckId,reservation,result);
            if (preview == null) throw new AiException(422,"NO_VALID_CARDS");
            return preview;
        } catch (BusinessException e) {
            AiException providerError = e instanceof AiException ai ? ai : null;
            store.fail(reservation.id(),e.getCode(),e.getStatus(),providerError == null ? null : providerError.getInputTokens(),
                    providerError == null ? null : providerError.getOutputTokens(),providerError == null ? null : providerError.getProviderAttempts());
            throw e;
        } catch (RuntimeException e) {
            store.fail(reservation.id(),"AI_GENERATION_FAILED",502,null,null,null);
            throw new AiException(502,"AI_GENERATION_FAILED");
        }
    }
}
