package com.example.demo.study.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.flashcard.service.DeckAccessPolicy;
import com.example.demo.study.dto.ReviewResponse;
import com.example.demo.study.entity.UserFlashcardReview;
import com.example.demo.study.repository.UserFlashcardReviewRepository;
import com.example.demo.study.service.StudyService;
import com.example.demo.user.entity.User;
import com.example.demo.weakvocabulary.service.WeakVocabularyService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.study.entity.FlashcardStudyEvent;
import com.example.demo.study.repository.FlashcardStudyEventRepository;
import com.example.demo.study.service.LearningActivityLock;
import com.example.demo.weakvocabulary.service.WeaknessRules;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
public class StudyServiceImpl implements StudyService {

    private final FlashcardRepository flashcardRepository;
    private final UserFlashcardReviewRepository reviewRepository;
    private final WeakVocabularyService weakVocabularyService;
    private final DeckAccessPolicy access;
    private final FlashcardStudyEventRepository events;
    private final LearningActivityLock activityLock;
    private final ObjectMapper json;

    public StudyServiceImpl(FlashcardRepository flashcardRepository, UserFlashcardReviewRepository reviewRepository,
            WeakVocabularyService weakVocabularyService,
            DeckAccessPolicy access, FlashcardStudyEventRepository events,
            LearningActivityLock activityLock, ObjectMapper json) {
        this.flashcardRepository = flashcardRepository;
        this.reviewRepository = reviewRepository;
        this.weakVocabularyService = weakVocabularyService;
        this.access = access;
        this.events = events;
        this.activityLock = activityLock;
        this.json = json;
    }

    @Override
    public List<FlashcardResponse> getFlashcardsToStudy(Long deckId, Long userId) {
        access.requireViewAccess(deckId, userId);
        return flashcardRepository.findFlashcardsToStudy(deckId, userId).stream()
                .map(this::mapToFlashcardResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewResponse processReview(Long userId, Long flashcardId, int quality) {
        return processReview(userId, flashcardId, quality, null);
    }

    @Override
    @Transactional
    public ReviewResponse processReview(Long userId, Long flashcardId, int quality, String requestId) {
        WeaknessRules.validateQuality(quality);
        String key = normalizeRequestId(requestId);
        User learner = activityLock.acquire(userId);
        Flashcard accessibleCard = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found"));
        access.requireViewAccess(accessibleCard.getDeck(), userId);
        FlashcardStudyEvent previous = events.findByUserIdAndRequestId(userId, key).orElse(null);
        if (previous != null) {
            if (!previous.getFlashcard().getId().equals(flashcardId) || previous.getQuality() != quality) {
                throw new BusinessException(409, "REVIEW_REQUEST_CONFLICT", "requestId đã được dùng cho đánh giá khác");
            }
            return readSnapshot(previous.getResponseJson());
        }
        UserFlashcardReview review = reviewRepository.findByUserIdAndFlashcardId(userId, flashcardId)
                .orElseGet(() -> UserFlashcardReview.builder()
                        .user(learner)
                        .flashcard(accessibleCard)
                        .easeFactor(2.5)
                        .repetitionCount(0)
                        .intervalDays(0)
                        .build());

        // Apply Spaced Repetition logic (SuperMemo-2 simplified)
        if (quality < 3) {
            // Failed
            review.setRepetitionCount(0);
            review.setIntervalDays(1); // Review tomorrow
        } else {
            // Succeeded
            int repetitions = review.getRepetitionCount();
            if (repetitions == 0) {
                review.setIntervalDays(1);
            } else if (repetitions == 1) {
                review.setIntervalDays(6);
            } else {
                int newInterval = (int) Math.round(review.getIntervalDays() * review.getEaseFactor());
                review.setIntervalDays(newInterval);
            }
            review.setRepetitionCount(repetitions + 1);
        }

        // Update Ease Factor
        double newEaseFactor = review.getEaseFactor() + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (newEaseFactor < 1.3) {
            newEaseFactor = 1.3; // Minimum ease factor
        }
        review.setEaseFactor(newEaseFactor);

        // Set Next Review Date
        review.setNextReviewDate(LocalDateTime.now().plusDays(review.getIntervalDays()));

        UserFlashcardReview savedReview = reviewRepository.save(review);
        FlashcardStudyEvent event = FlashcardStudyEvent.builder()
                .user(learner)
                .flashcard(accessibleCard)
                .quality(quality)
                .confidentRecall(quality == 4 || quality == 5)
                .requestId(key)
                .reviewedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        // Flush để mọi aggregate và cửa sổ ba lần gần nhất đều bao gồm review vừa nhận.
        events.saveAndFlush(event);
        long total = events.countByUserIdAndFlashcardId(userId, flashcardId);
        long confident = events.countByUserIdAndFlashcardIdAndConfidentRecallTrue(userId, flashcardId);
        List<Integer> latest = events.findByUserIdAndFlashcardIdOrderByIdDesc(userId, flashcardId,
                org.springframework.data.domain.PageRequest.of(0, WeaknessRules.RECENT_WINDOW))
                .stream().map(FlashcardStudyEvent::getQuality).toList();
        var reason = WeaknessRules.study(quality, latest, total, confident);
        var detection = weakVocabularyService.registerStudyDetection(userId, flashcardId, quality, reason);
        ReviewResponse response = mapToReviewResponse(savedReview);
        response.setRequestId(key);
        response.setStudyReviewCount(total);
        response.setStudyAccuracy(WeaknessRules.accuracy(confident, total));
        response.setWeakDetection(detection);
        event.setResponseJson(writeSnapshot(response));
        events.save(event);
        return response;
    }

    private String normalizeRequestId(String requestId) {
        // Client cũ không có requestId vẫn hoạt động, nhưng mỗi lần gọi là một review mới.
        if (requestId == null) {
            return UUID.randomUUID().toString();
        }
        try {
            String canonical = UUID.fromString(requestId).toString();
            if (!canonical.equalsIgnoreCase(requestId)) {
                throw new IllegalArgumentException();
            }
            return canonical;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("requestId phải là UUID hợp lệ");
        }
    }

    private String writeSnapshot(ReviewResponse response) {
        try {
            return json.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Không thể lưu kết quả review", e);
        }
    }

    private ReviewResponse readSnapshot(String snapshot) {
        try {
            return json.readValue(snapshot, ReviewResponse.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Không thể đọc kết quả review", e);
        }
    }

    private FlashcardResponse mapToFlashcardResponse(Flashcard flashcard) {
        return FlashcardResponse.builder()
                .id(flashcard.getId())
                .deckId(flashcard.getDeck() != null ? flashcard.getDeck().getId() : null)
                .vocabulary(flashcard.getVocabulary())
                .meaning(flashcard.getMeaning())
                .phonetic(flashcard.getPhonetic())
                .exampleSentence(flashcard.getExampleSentence())
                .build();
    }

    private ReviewResponse mapToReviewResponse(UserFlashcardReview review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .flashcardId(review.getFlashcard() != null ? review.getFlashcard().getId() : null)
                .easeFactor((int)(review.getEaseFactor() * 100)) // Giữ đơn vị phần trăm của API cũ.
                .intervalDays(review.getIntervalDays())
                .repetitions(review.getRepetitionCount())
                .nextReviewDate(review.getNextReviewDate())
                .build();
    }
}
