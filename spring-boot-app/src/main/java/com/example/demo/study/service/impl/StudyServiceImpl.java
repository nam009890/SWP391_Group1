package com.example.demo.study.service.impl;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.study.entity.UserFlashcardReview;
import com.example.demo.study.repository.UserFlashcardReviewRepository;
import com.example.demo.study.service.StudyService;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StudyServiceImpl implements StudyService {

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private UserFlashcardReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<Flashcard> getFlashcardsToStudy(Long deckId, Long userId) {
        return flashcardRepository.findFlashcardsToStudy(deckId, userId);
    }

    @Override
    public UserFlashcardReview processReview(Long userId, Long flashcardId, int quality) {
        // Find existing review or create a new one
        UserFlashcardReview review = reviewRepository.findByUserIdAndFlashcardId(userId, flashcardId)
                .orElseGet(() -> {
                    UserFlashcardReview newReview = new UserFlashcardReview();
                    
                    // Fetch user and flashcard references
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    Flashcard flashcard = flashcardRepository.findById(flashcardId)
                            .orElseThrow(() -> new RuntimeException("Flashcard not found"));
                            
                    newReview.setUser(user);
                    newReview.setFlashcard(flashcard);
                    newReview.setEaseFactor(2.5); // Default SM-2 ease factor
                    newReview.setRepetitionCount(0);
                    newReview.setIntervalDays(0);
                    return newReview;
                });

        // Apply Spaced Repetition logic (SuperMemo-2 simplified)
        
        // Quality: 
        // 0-2: Incorrect or very hard (forgot)
        // 3: Hard (remembered with serious difficulty)
        // 4: Good (remembered after hesitation)
        // 5: Easy (perfect response)
        
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

        return reviewRepository.save(review);
    }
}
