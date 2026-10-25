package com.example.demo.flashcard.ai.service;

import com.example.demo.common.exception.*;
import com.example.demo.flashcard.ai.config.AiProperties;
import com.example.demo.flashcard.ai.dto.AiDtos.*;
import com.example.demo.flashcard.ai.entity.AiGenerationBatch;
import com.example.demo.flashcard.ai.entity.AiGenerationSource;
import com.example.demo.flashcard.ai.entity.AiGenerationStatus;
import com.example.demo.flashcard.ai.repository.AiBatchRepository;
import com.example.demo.flashcard.ai.exception.AiException;
import com.example.demo.flashcard.ai.validation.AiFlashcardValidator;
import com.example.demo.flashcard.entity.*;
import com.example.demo.flashcard.repository.*;
import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.study.service.LearningActivityLock;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AiGenerationStore {
    private final AiBatchRepository batches;
    private final DeckRepository decks;
    private final FlashcardRepository cards;
    private final LearningActivityLock accounts;
    private final AiGenerationUsageService usage;
    private final AiProperties settings;
    private final AiFlashcardValidator validator;
    private final ObjectMapper json;
    private final EntityManager entityManager;

    public record Reservation(String id, Spec specification, List<String> excluded, Preview replay) {}

    @Transactional
    public Reservation reserve(Long uid, Long deckId, PreviewRequest request, String source) {
        accounts.acquire(uid);
        owner(uid,deckId);
        Spec spec = validator.specification(request,settings.getMaxCards());
        String key = uuid(request.requestId());
        String fingerprint = fingerprint(List.of(deckId,spec,source));
        var old = batches.findByUserIdAndRequestId(uid,key).orElse(null);
        if (old != null) {
            // Accept pre-Gemini fingerprints for the same source, preserving existing replay history.
            boolean legacyMatch=source.equals(old.getSource()) && old.getRequestFingerprint().equals(fingerprint(List.of(deckId,spec)));
            if (!old.getRequestFingerprint().equals(fingerprint) && !legacyMatch) throw new AiException(409,"GENERATION_REQUEST_CONFLICT");
            if (AiGenerationStatus.PENDING.name().equals(old.getStatus())) {
                throw new AiException(old.getLeaseUntil().isAfter(now()) ? 409 : 503,
                        old.getLeaseUntil().isAfter(now()) ? "GENERATION_IN_PROGRESS" : "AI_GENERATION_FAILED");
            }
            if (AiGenerationStatus.FAILED.name().equals(old.getStatus())) throw new AiException(
                    old.getFailureStatus() == null ? errorStatus(old.getFailureCode()) : old.getFailureStatus(),old.getFailureCode());
            if (old.getExpiresAt().isBefore(now()) || AiGenerationStatus.EXPIRED.name().equals(old.getStatus())) throw new AiException(410,"GENERATION_EXPIRED");
            return new Reservation(old.getId(),spec,List.of(),read(old.getPreviewJson(),Preview.class));
        }
        if ("DISABLED".equals(source)) throw new AiException(503,"AI_NOT_CONFIGURED");
        AiGenerationSource.valueOf(source); // Reject unknown persisted sources before quota reservation.
        LocalDateTime now = now();
        usage.reserve(uid,now);
        AiGenerationBatch batch = new AiGenerationBatch();
        batch.setId(UUID.randomUUID().toString());
        batch.setUserId(uid);
        batch.setDeckId(deckId);
        batch.setRequestId(key);
        batch.setRequestFingerprint(fingerprint);
        batch.setSource(source);
        batch.setPromptVersion(AiPromptBuilder.VERSION);
        batch.setStatus(AiGenerationStatus.PENDING.name());
        batch.setCreatedAt(now);
        batch.setExpiresAt(now.plusMinutes(20));
        batch.setLeaseUntil(now.plusSeconds(settings.timeout() * 2L + 40));
        batches.saveAndFlush(batch);
        return new Reservation(batch.getId(),spec,cards.vocabularyInDeck(deckId),null);
    }

    @Transactional
    public Preview finish(Long uid, Long deckId, Reservation reservation, ProviderResult result) {
        accounts.acquire(uid);
        owner(uid,deckId);
        AiGenerationBatch batch = batch(uid,deckId,reservation.id());
        if (!AiGenerationStatus.PENDING.name().equals(batch.getStatus()) || batch.getExpiresAt().isBefore(now())) throw new AiException(410,"GENERATION_EXPIRED");
        batch.setInputTokens(result.inputTokens());
        batch.setOutputTokens(result.outputTokens());
        batch.setProviderAttempts(result.attempts());
        Set<String> seen = new HashSet<>();
        cards.vocabularyInDeck(deckId).forEach(word -> seen.add(validator.normalize(word)));
        List<Candidate> accepted = new ArrayList<>();
        int invalid = 0;
        int duplicates = 0;
        if (result.cards() == null || result.cards().size() > 20) throw new AiException(502,"AI_INVALID_RESPONSE");
        for (Card raw : result.cards()) {
            Card card;
            try {
                card = validator.card(raw);
                validator.type(card,reservation.specification().type());
            } catch (IllegalArgumentException e) {
                invalid++;
                continue;
            }
            if (!seen.add(validator.normalize(card.vocabulary()))) {
                duplicates++;
                continue;
            }
            if (accepted.size() < reservation.specification().count()) {
                accepted.add(new Candidate(UUID.randomUUID().toString(),card.vocabulary(),card.meaning(),card.phonetic(),card.exampleSentence()));
            }
        }
        if (accepted.isEmpty()) {
            // Trả lỗi sau transaction để usage/token thực tế vẫn được ghi nhận.
            batch.setStatus(AiGenerationStatus.FAILED.name());
            batch.setFailureCode("NO_VALID_CARDS");
            batch.setFailureStatus(422);
            batches.save(batch);
            return null;
        }
        Preview preview = new Preview(batch.getId(),batch.getSource(),reservation.specification().count(),result.cards().size(),
                accepted.size(),duplicates,invalid,AiPromptBuilder.VERSION,batch.getExpiresAt(),
                accepted.size() < reservation.specification().count() ? "Chỉ có " + accepted.size() + " thẻ hợp lệ, không trùng. Không thêm nội dung thay thế." : "Hãy xem lại, chỉnh sửa và chọn thẻ trước khi lưu.",
                List.copyOf(accepted));
        batch.setStatus(AiGenerationStatus.READY.name());
        batch.setPreviewJson(write(preview));
        batches.save(batch);
        return preview;
    }

    @Transactional
    public void fail(String id, String code, int status, Long inputTokens, Long outputTokens, Integer attempts) {
        var batch = batches.findForUpdate(id).orElseThrow();
        if (AiGenerationStatus.PENDING.name().equals(batch.getStatus())) {
            batch.setStatus(AiGenerationStatus.FAILED.name());
            batch.setInputTokens(inputTokens);
            batch.setOutputTokens(outputTokens);
            batch.setProviderAttempts(attempts);
            batch.setFailureCode(code.length() <= 60 ? code : "AI_GENERATION_FAILED");
            batch.setFailureStatus(status);
            batches.save(batch);
        }
    }

    @Transactional
    public CommitResult commit(Long uid, Long deckId, CommitRequest request) {
        accounts.acquire(uid);
        Deck deck = owner(uid,deckId);
        AiGenerationBatch batch = batch(uid,deckId,uuid(request.generationId()));
        var selected = request.selectedCards();
        if (selected == null || selected.isEmpty() || selected.size() > 20 || selected.stream().anyMatch(Objects::isNull)) throw new IllegalArgumentException("Chọn từ 1 đến 20 thẻ");
        var canonical = selected.stream().sorted(Comparator.comparing(Candidate::candidateId,Comparator.nullsFirst(Comparator.naturalOrder()))).toList();
        String fingerprint = fingerprint(canonical);
        if (AiGenerationStatus.COMMITTED.name().equals(batch.getStatus())) {
            if (!fingerprint.equals(batch.getCommitFingerprint())) throw new AiException(409,"GENERATION_ALREADY_COMMITTED");
            return read(batch.getCommitJson(),CommitResult.class);
        }
        if (batch.getExpiresAt().isBefore(now()) || AiGenerationStatus.EXPIRED.name().equals(batch.getStatus())) throw new AiException(410,"GENERATION_EXPIRED");
        if (!AiGenerationStatus.READY.name().equals(batch.getStatus())) throw new AiException(409,"AI_GENERATION_FAILED");
        Preview preview = read(batch.getPreviewJson(),Preview.class);
        Set<String> candidates = new HashSet<>(preview.cards().stream().map(Candidate::candidateId).toList());
        Set<String> selectedIds = new HashSet<>();
        Set<String> vocabulary = new HashSet<>();
        cards.vocabularyInDeck(deckId).forEach(word -> vocabulary.add(validator.normalize(word)));
        List<Card> validated = new ArrayList<>();
        for (Candidate selection : canonical) {
            if (selection == null || !candidates.contains(selection.candidateId()) || !selectedIds.add(selection.candidateId())) {
                throw new IllegalArgumentException("Candidate không thuộc bản xem trước hoặc bị chọn trùng");
            }
            Card card = validator.card(selection.card());
            if (!vocabulary.add(validator.normalize(card.vocabulary()))) throw new AiException(409,"DUPLICATE_FLASHCARD");
            validated.add(card);
        }
        // Chỉ bắt đầu insert sau khi toàn bộ lựa chọn đã qua validation và kiểm tra trùng.
        List<FlashcardResponse> saved = new ArrayList<>();
        for (Card card : validated) {
            var entity = cards.save(Flashcard.builder().deck(deck).vocabulary(card.vocabulary()).meaning(card.meaning())
                    .phonetic(card.phonetic()).exampleSentence(card.exampleSentence()).build());
            saved.add(FlashcardResponse.builder().id(entity.getId()).deckId(deckId).vocabulary(entity.getVocabulary())
                    .meaning(entity.getMeaning()).phonetic(entity.getPhonetic()).exampleSentence(entity.getExampleSentence()).build());
        }
        cards.flush();
        CommitResult response = new CommitResult(batch.getId(),saved.size(),cards.countByDeckId(deckId),List.copyOf(saved));
        batch.setStatus(AiGenerationStatus.COMMITTED.name());
        batch.setCommitFingerprint(fingerprint);
        batch.setCommitJson(write(response));
        batches.save(batch);
        return response;
    }

    private Deck owner(Long uid, Long id) {
        Deck deck = decks.findForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Deck không tồn tại"));
        entityManager.refresh(deck,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if (deck.isDeleted() || deck.getOwner() == null || !uid.equals(deck.getOwner().getId())) {
            throw new BusinessException(403,"ACCESS_DENIED","Chỉ chủ Deck đang hoạt động được tạo hoặc lưu thẻ");
        }
        return deck;
    }
    private AiGenerationBatch batch(Long uid, Long deckId, String id) {
        return batches.findById(id).filter(b -> b.getUserId().equals(uid) && b.getDeckId().equals(deckId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản xem trước"));
    }
    public String uuid(String value) {
        try {
            String normalized = UUID.fromString(value).toString();
            if (!normalized.equalsIgnoreCase(value)) throw new IllegalArgumentException();
            return normalized;
        } catch (IllegalArgumentException | NullPointerException e) { throw new IllegalArgumentException("ID phải là UUID hợp lệ"); }
    }
    private LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }
    private int errorStatus(String code) {
        return switch (code == null ? "" : code) {
            case "AI_NOT_CONFIGURED","AI_PROVIDER_UNAVAILABLE","GEMINI_AUTH_ERROR","AI_TIMEOUT" -> 503;
            case "OPENAI_INSUFFICIENT_QUOTA","OPENAI_RATE_LIMIT","GEMINI_INSUFFICIENT_QUOTA","GEMINI_RATE_LIMIT","APPLICATION_DAILY_LIMIT","APPLICATION_GLOBAL_LIMIT","APPLICATION_CONCURRENT_LIMIT","AI_QUOTA_EXCEEDED","AI_RATE_LIMITED","GENERATION_LIMIT_REACHED" -> 429;
            case "NO_VALID_CARDS" -> 422;
            default -> 502;
        };
    }
    private String fingerprint(Object value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(write(value).getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    private String write(Object value) {
        try { return json.writeValueAsString(value); }
        catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalStateException("Không lưu được snapshot",e); }
    }
    private <T> T read(String value, Class<T> type) {
        try { return json.readValue(value,type); }
        catch (java.io.IOException e) { throw new IllegalStateException("Không đọc được snapshot",e); }
    }
}
