package com.example.demo.study.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.study.dto.ReviewResponse;
import com.example.demo.study.entity.UserFlashcardReview;
import com.example.demo.study.repository.UserFlashcardReviewRepository;
import com.example.demo.study.service.StudyService;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyServiceImpl implements StudyService {

    private final FlashcardRepository flashcardRepository;
    private final UserFlashcardReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Override
    public List<FlashcardResponse> getFlashcardsToStudy(Long deckId, Long userId) {
        return flashcardRepository.findFlashcardsToStudy(deckId, userId).stream()
                .map(this::mapToFlashcardResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReviewResponse processReview(Long userId, Long flashcardId, int quality) {
        // Find existing review or create a new one
        UserFlashcardReview review = reviewRepository.findByUserIdAndFlashcardId(userId, flashcardId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    Flashcard flashcard = flashcardRepository.findById(flashcardId)
                            .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found"));
                            
                    return UserFlashcardReview.builder()
                            .user(user)
                            .flashcard(flashcard)
                            .easeFactor(2.5) // Default SM-2 ease factor
                            .repetitionCount(0)
                            .intervalDays(0)
                            .build();
                });

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
        return mapToReviewResponse(savedReview);
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
                .easeFactor((int)(review.getEaseFactor() * 100)) // Assuming we want an integer representation for DTO or keep it as is (Wait, ReviewResponse has Integer easeFactor, let's cast or map correctly)
                .intervalDays(review.getIntervalDays())
                .repetitions(review.getRepetitionCount())
                .nextReviewDate(review.getNextReviewDate())
                .build();
    }
}
