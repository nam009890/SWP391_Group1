package com.example.demo.weakvocabulary.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.weakvocabulary.dto.WeakDtos.PageResponse;
import com.example.demo.weakvocabulary.dto.WeakDtos.PatchRequest;
import com.example.demo.weakvocabulary.dto.WeakDtos.WeakResponse;
import com.example.demo.weakvocabulary.entity.UserWeakVocabulary;
import com.example.demo.weakvocabulary.repository.UserWeakVocabularyRepository;
import com.example.demo.weakvocabulary.service.WeakVocabularyService;
import jakarta.persistence.criteria.Expression;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WeakVocabularyServiceImpl implements WeakVocabularyService {
    private final UserWeakVocabularyRepository repo;
    private final UserRepository users;
    private final FlashcardRepository flashcards;

    @Override
    public WeakResponse addManual(Long userId, Long flashcardId) {
        UserWeakVocabulary weak = repo.findByUserIdAndFlashcardId(userId, flashcardId)
                .orElseGet(() -> UserWeakVocabulary.builder().user(user(userId)).flashcard(card(flashcardId)).build());
        weak.setManualMarked(true);
        weak.setWeakDeleted(false);
        weak.setWeakDeletedAt(null);
        return map(repo.save(weak));
    }

    @Override
    public void recordStudyDifficulty(Long userId, Long flashcardId, int quality) {
        if (quality > 3) return;
        UserWeakVocabulary weak = repo.findByUserIdAndFlashcardId(userId, flashcardId)
                .orElseGet(() -> UserWeakVocabulary.builder().user(user(userId)).flashcard(card(flashcardId)).build());
        if (weak.isWeakDeleted()) return;
        weak.setAutoDetected(true);
        weak.setLastStudyQuality(quality);
        repo.save(weak);
    }

    @Override
    public PageResponse list(Long userId, String keyword, Long deckId, String source, Integer masteryMin, Integer masteryMax,
                             Double accuracyMin, Double accuracyMax, String sort, int page, int size) {
        Specification<UserWeakVocabulary> specification = (root, query, cb) -> cb.and(
                cb.equal(root.get("user").get("id"), userId), cb.isFalse(root.get("weakDeleted")));
        if (keyword != null && !keyword.isBlank()) {
            String term = "%" + keyword.toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("flashcard").get("vocabulary")), term),
                    cb.like(cb.lower(root.get("flashcard").get("meaning")), term)));
        }
        if (deckId != null) specification = specification.and((root, query, cb) -> cb.equal(root.get("flashcard").get("deck").get("id"), deckId));
        if (source != null && !"ALL".equals(source)) specification = specification.and((root, query, cb) -> switch (source) {
            case "AUTO" -> cb.isTrue(root.get("autoDetected"));
            case "MANUAL" -> cb.isTrue(root.get("manualMarked"));
            case "BOTH" -> cb.and(cb.isTrue(root.get("autoDetected")), cb.isTrue(root.get("manualMarked")));
            default -> cb.conjunction();
        });
        if (masteryMin != null) specification = specification.and((root, query, cb) -> cb.ge(root.get("masteryScore"), masteryMin));
        if (masteryMax != null) specification = specification.and((root, query, cb) -> cb.le(root.get("masteryScore"), masteryMax));
        if (accuracyMin != null) specification = specification.and((root, query, cb) -> accuracyPredicate(root, cb, accuracyMin, true));
        if (accuracyMax != null) specification = specification.and((root, query, cb) -> accuracyPredicate(root, cb, accuracyMax, false));

        String resolvedSort = sort == null ? "WEAKEST_FIRST" : sort;
        Sort pageableSort = switch (resolvedSort) {
            case "MASTERY_DESC" -> Sort.by("masteryScore").descending();
            case "UPDATED_DESC" -> Sort.by("updatedAt").descending();
            case "WORD_ASC" -> Sort.by("flashcard.vocabulary").ascending();
            case "WORD_DESC" -> Sort.by("flashcard.vocabulary").descending();
            case "ACCURACY_ASC", "ACCURACY_DESC" -> Sort.unsorted();
            default -> Sort.by("masteryScore").ascending();
        };
        if (resolvedSort.equals("ACCURACY_ASC") || resolvedSort.equals("ACCURACY_DESC")) {
            boolean ascending = resolvedSort.equals("ACCURACY_ASC");
            specification = specification.and((root, query, cb) -> {
                if (!Long.class.equals(query.getResultType())) {
                    query.orderBy(ascending ? cb.asc(accuracyExpression(root, cb)) : cb.desc(accuracyExpression(root, cb)));
                }
                return cb.conjunction();
            });
        }
        Page<UserWeakVocabulary> result = repo.findAll(specification, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), pageableSort));
        return PageResponse.builder().items(result.map(this::map).getContent()).page(result.getNumber()).size(result.getSize())
                .totalElements(result.getTotalElements()).totalPages(result.getTotalPages()).first(result.isFirst()).last(result.isLast()).build();
    }

    private Expression<Double> accuracyExpression(jakarta.persistence.criteria.Root<UserWeakVocabulary> root, jakarta.persistence.criteria.CriteriaBuilder cb) {
        return cb.<Double>selectCase().when(cb.equal(root.get("totalAttempts"), 0), 0d)
                .otherwise(cb.quot(cb.toDouble(root.get("correctCount")), cb.toDouble(root.get("totalAttempts"))).as(Double.class));
    }

    private jakarta.persistence.criteria.Predicate accuracyPredicate(jakarta.persistence.criteria.Root<UserWeakVocabulary> root, jakarta.persistence.criteria.CriteriaBuilder cb, double boundary, boolean minimum) {
        Expression<Double> accuracy = accuracyExpression(root, cb);
        return minimum ? cb.ge(accuracy, boundary / 100d) : cb.le(accuracy, boundary / 100d);
    }

    @Override public WeakResponse patch(Long userId, Long id, PatchRequest request) { UserWeakVocabulary weak = owned(userId, id); if (request.getWeakNote() != null) weak.setWeakNote(request.getWeakNote()); if (request.getManualMarked() != null) weak.setManualMarked(request.getManualMarked()); return map(repo.save(weak)); }
    @Override public void softDelete(Long userId, Long id) { UserWeakVocabulary weak = owned(userId, id); weak.setWeakDeleted(true); weak.setWeakDeletedAt(LocalDateTime.now()); repo.save(weak); }
    private UserWeakVocabulary owned(Long userId, Long id) { return repo.findById(id).filter(w -> w.getUser().getId().equals(userId) && !w.isWeakDeleted()).orElseThrow(() -> new ResourceNotFoundException("Weak vocabulary not found")); }
    private User user(Long id) { return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found")); }
    private Flashcard card(Long id) { return flashcards.findById(id).orElseThrow(() -> new ResourceNotFoundException("Flashcard not found")); }
    private WeakResponse map(UserWeakVocabulary w) { Flashcard f = w.getFlashcard(); double accuracy = w.getTotalAttempts() == 0 ? 0 : Math.round(w.getCorrectCount() * 10000d / w.getTotalAttempts()) / 100d; String reason = w.isManualMarked() ? "MANUAL_MARK" : w.getConsecutiveWrong() >= 2 ? "CONSECUTIVE_WRONG" : w.getLastStudyQuality() != null && w.getLastStudyQuality() <= 1 ? "STUDY_FORGOT" : w.getLastStudyQuality() != null && w.getLastStudyQuality() <= 3 ? "STUDY_HARD" : w.getTotalAttempts() >= 3 && accuracy < 60 ? "LOW_PRACTICE_ACCURACY" : "STUDY_HARD"; return WeakResponse.builder().weakVocabularyId(w.getId()).flashcardId(f.getId()).deckId(f.getDeck() == null ? null : f.getDeck().getId()).deckName(f.getDeck() == null ? null : f.getDeck().getName()).vocabulary(f.getVocabulary()).meaning(f.getMeaning()).phonetic(f.getPhonetic()).exampleSentence(f.getExampleSentence()).manualMarked(w.isManualMarked()).autoDetected(w.isAutoDetected()).masteryScore(w.getMasteryScore()).totalAttempts(w.getTotalAttempts()).correctCount(w.getCorrectCount()).wrongCount(w.getWrongCount()).consecutiveWrong(w.getConsecutiveWrong()).accuracy(accuracy).weakReason(reason).weakNote(w.getWeakNote()).lastStudyQuality(w.getLastStudyQuality()).lastPracticedAt(w.getLastPracticedAt()).createdAt(w.getCreatedAt()).updatedAt(w.getUpdatedAt()).build(); }
}
