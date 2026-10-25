package com.example.demo.weakvocabulary.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.entity.DeckVisibility;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.flashcard.service.DeckAccessPolicy;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.weakvocabulary.dto.WeakDtos.PageResponse;
import com.example.demo.weakvocabulary.dto.WeakDtos.PatchRequest;
import com.example.demo.weakvocabulary.dto.WeakDtos.WeakResponse;
import com.example.demo.weakvocabulary.entity.UserWeakVocabulary;
import com.example.demo.weakvocabulary.repository.UserWeakVocabularyRepository;
import com.example.demo.weakvocabulary.service.WeakVocabularyService;
import jakarta.persistence.criteria.Expression;
import com.example.demo.study.dto.ReviewResponse.WeakDetection;
import com.example.demo.study.dto.ReviewResponse.DetectionStatus;
import com.example.demo.study.repository.FlashcardStudyEventRepository;
import com.example.demo.study.service.LearningActivityLock;
import com.example.demo.weakvocabulary.entity.WeakDetectionReason;
import com.example.demo.weakvocabulary.service.WeaknessRules;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@Transactional(readOnly = true)
public class WeakVocabularyServiceImpl implements WeakVocabularyService {
    private final UserWeakVocabularyRepository repo;
    private final UserRepository users;
    private final FlashcardRepository flashcards;
    private final DeckAccessPolicy access;
    private final LearningActivityLock activityLock;
    private final FlashcardStudyEventRepository events;

    public WeakVocabularyServiceImpl(UserWeakVocabularyRepository repo, UserRepository users,
            FlashcardRepository flashcards, DeckAccessPolicy access,
            LearningActivityLock activityLock, FlashcardStudyEventRepository events) {
        this.repo = repo;
        this.users = users;
        this.flashcards = flashcards;
        this.access = access;
        this.activityLock = activityLock;
        this.events = events;
    }

    @Override
    public java.util.List<com.example.demo.weakvocabulary.dto.WeakDtos.DeckOption> deckOptions(Long userId) {
        return repo.findActiveDeckOptions(userId).stream()
                .map(option -> new com.example.demo.weakvocabulary.dto.WeakDtos.DeckOption(option.getId(), option.getName()))
                .toList();
    }

    @Override
    @Transactional
    public WeakResponse addManual(Long userId, Long flashcardId) {
        activityLock.acquire(userId);
        // Public deck cho phép lưu từ yếu cá nhân mà không thay đổi bộ thẻ gốc.
        access.requireViewAccess(card(flashcardId).getDeck(), userId);
        UserWeakVocabulary weak = repo.findByUserIdAndFlashcardId(userId, flashcardId)
                .orElseGet(() -> UserWeakVocabulary.builder().user(user(userId)).flashcard(card(flashcardId)).build());
        weak.setManualMarked(true);
        if (!weak.isAutoDetected()) {
            weak.setDetectionReason(WeakDetectionReason.MANUAL_MARK);
        }
        weak.setWeakDeleted(false);
        weak.setWeakDeletedAt(null);
        return map(repo.save(weak));
    }

    @Override
    @Transactional
    public WeakDetection registerStudyDetection(Long userId, Long flashcardId, int quality, WeakDetectionReason reason) {
        activityLock.acquire(userId);
        access.requireViewAccess(card(flashcardId).getDeck(), userId);
        UserWeakVocabulary weak = repo.findByUserIdAndFlashcardId(userId, flashcardId).orElse(null);
        if (weak != null) {
            weak.setLastStudyQuality(quality);
        }
        if (reason == null) {
            return new WeakDetection(DetectionStatus.NOT_DETECTED, null, weak == null ? null : weak.getId());
        }
        if (weak != null && weak.isWeakDeleted()) {
            // Chỉ manual Add được khôi phục từ đã xóa; không thay lý do hoặc ngày phát hiện.
            return new WeakDetection(DetectionStatus.SUPPRESSED, reason, weak.getId());
        }
        boolean existed = weak != null;
        if (!existed) {
            weak = UserWeakVocabulary.builder().user(user(userId)).flashcard(card(flashcardId)).build();
        }
        weak.setLastStudyQuality(quality);
        WeaknessRules.detected(weak, reason);
        repo.saveAndFlush(weak);
        return new WeakDetection(existed ? DetectionStatus.ALREADY_WEAK : DetectionStatus.AUTO_ADDED, reason, weak.getId());
    }

    @Override
    public PageResponse list(Long userId, String keyword, Long deckId, String source, Integer masteryMin, Integer masteryMax,
                             Double accuracyMin, Double accuracyMax, String sort, int page, int size) {
        Specification<UserWeakVocabulary> specification = (root, query, cb) -> cb.and(
                cb.equal(root.get("user").get("id"), userId), cb.isFalse(root.get("weakDeleted")),
                cb.isFalse(root.get("flashcard").get("deck").get("deleted")), cb.or(
                        cb.equal(root.get("flashcard").get("deck").get("visibility"), DeckVisibility.PUBLIC),
                        cb.equal(root.get("flashcard").get("deck").get("owner").get("id"), userId)));
        if (keyword != null && !keyword.isBlank()) {
            String term = "%" + keyword.toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("flashcard").get("vocabulary")), term),
                    cb.like(cb.lower(root.get("flashcard").get("meaning")), term)));
        }
        if (deckId != null)
            specification = specification.and((root, query, cb) -> cb.equal(root.get("flashcard").get("deck").get("id"), deckId));
        if (source != null && !"ALL".equals(source))
            specification = specification.and((root, query, cb) -> switch (source) {
                case "AUTO" -> cb.isTrue(root.get("autoDetected"));
                case "MANUAL" -> cb.isTrue(root.get("manualMarked"));
                case "BOTH" -> cb.and(cb.isTrue(root.get("autoDetected")), cb.isTrue(root.get("manualMarked")));
                default -> cb.conjunction();
            });
        if (masteryMin != null)
            specification = specification.and((root, query, cb) -> cb.ge(root.get("masteryScore"), masteryMin));
        if (masteryMax != null)
            specification = specification.and((root, query, cb) -> cb.le(root.get("masteryScore"), masteryMax));
        if (accuracyMin != null)
            specification = specification.and((root, query, cb) -> accuracyPredicate(root, cb, accuracyMin, true));
        if (accuracyMax != null)
            specification = specification.and((root, query, cb) -> accuracyPredicate(root, cb, accuracyMax, false));

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
        // Gom thống kê cho cả trang trong một truy vấn, không query history theo từng từ.
        Map<Long, FlashcardStudyEventRepository.Counts> counts = result.isEmpty() ? Map.of() : events.countsForCards(
                userId, result.getContent().stream().map(w -> w.getFlashcard().getId()).toList()).stream()
                .collect(Collectors.toMap(FlashcardStudyEventRepository.Counts::getFlashcardId, Function.identity()));
        return PageResponse.builder().items(result.getContent().stream().map(w -> {
            var count = counts.get(w.getFlashcard().getId());
            return map(w, count == null ? 0 : count.getReviewCount(), count == null ? 0 : count.getConfidentCount());
        }).toList()).page(result.getNumber()).size(result.getSize())
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

    @Override
    @Transactional
    public WeakResponse patch(Long userId, Long id, PatchRequest request) {
        activityLock.acquire(userId);
        UserWeakVocabulary weak = owned(userId, id);
        if (request.getWeakNote() != null) weak.setWeakNote(request.getWeakNote());
        if (request.getManualMarked() != null) {
            if (!request.getManualMarked() && !weak.isAutoDetected()) {
                throw new IllegalArgumentException("Dùng thao tác xóa để bỏ từ thủ công khỏi danh sách");
            }
            weak.setManualMarked(request.getManualMarked());
        }
        return map(repo.save(weak));
    }

    @Override
    @Transactional
    public void softDelete(Long userId, Long id) {
        activityLock.acquire(userId);
        UserWeakVocabulary weak = owned(userId, id);
        weak.setWeakDeleted(true);
        weak.setWeakDeletedAt(LocalDateTime.now());
        repo.save(weak);
    }

    private UserWeakVocabulary owned(Long userId, Long id) {
        UserWeakVocabulary weak = repo.findById(id).filter(w -> w.getUser().getId().equals(userId) && !w.isWeakDeleted()).orElseThrow(() -> new ResourceNotFoundException("Weak vocabulary not found"));
        access.requireViewAccess(weak.getFlashcard().getDeck(), userId);
        return weak;
    }

    private User user(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Flashcard card(Long id) {
        return flashcards.findById(id).orElseThrow(() -> new ResourceNotFoundException("Flashcard not found"));
    }

    private WeakResponse map(UserWeakVocabulary weak) {
        Long uid = weak.getUser().getId();
        Long fid = weak.getFlashcard().getId();
        return map(weak, events.countByUserIdAndFlashcardId(uid, fid),
                events.countByUserIdAndFlashcardIdAndConfidentRecallTrue(uid, fid));
    }

    private WeakResponse map(UserWeakVocabulary weak, long totalReviews, long confidentReviews) {
        Flashcard card = weak.getFlashcard();
        Double practiceAccuracy = WeaknessRules.accuracy(weak.getCorrectCount(), weak.getTotalAttempts());
        WeakDetectionReason reason = WeaknessRules.reason(weak);
        return WeakResponse.builder()
                .weakVocabularyId(weak.getId())
                .flashcardId(card.getId())
                .deckId(card.getDeck().getId())
                .deckName(card.getDeck().getName())
                .vocabulary(card.getVocabulary())
                .meaning(card.getMeaning())
                .phonetic(card.getPhonetic())
                .exampleSentence(card.getExampleSentence())
                .manualMarked(weak.isManualMarked())
                .autoDetected(weak.isAutoDetected())
                .masteryScore(weak.getMasteryScore())
                .totalAttempts(weak.getTotalAttempts())
                .correctCount(weak.getCorrectCount())
                .wrongCount(weak.getWrongCount())
                .consecutiveWrong(weak.getConsecutiveWrong())
                // Giữ accuracy=0 khi chưa luyện để tương thích filter cũ; UI đọc thêm totalAttempts.
                .accuracy(practiceAccuracy == null ? 0 : practiceAccuracy)
                .weakReason(reason.name())
                .detectionReason(reason)
                .firstDetectedAt(weak.getFirstDetectedAt())
                .lastDetectedAt(weak.getLastDetectedAt())
                .studyReviewCount(totalReviews)
                .studyAccuracy(WeaknessRules.accuracy(confidentReviews, totalReviews))
                .weakNote(weak.getWeakNote())
                .lastStudyQuality(weak.getLastStudyQuality())
                .lastPracticedAt(weak.getLastPracticedAt())
                .createdAt(weak.getCreatedAt())
                .updatedAt(weak.getUpdatedAt())
                .build();
    }
}
