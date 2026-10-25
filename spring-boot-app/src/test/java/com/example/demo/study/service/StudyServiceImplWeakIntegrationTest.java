package com.example.demo.study.service;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.study.entity.UserFlashcardReview;
import com.example.demo.study.repository.UserFlashcardReviewRepository;
import com.example.demo.study.service.impl.StudyServiceImpl;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.weakvocabulary.service.WeakVocabularyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudyServiceImplWeakIntegrationTest {
    private UserFlashcardReviewRepository reviews;
    private WeakVocabularyService weakVocabulary;
    private StudyService service;

    @BeforeEach
    void setUp() {
        FlashcardRepository flashcards = mock(FlashcardRepository.class);
        reviews = mock(UserFlashcardReviewRepository.class);
        UserRepository users = mock(UserRepository.class);
        weakVocabulary = mock(WeakVocabularyService.class);
        User user = User.builder().id(1L).build();
        Flashcard flashcard = Flashcard.builder().id(2L).deck(com.example.demo.flashcard.entity.Deck.builder().id(1L).build()).build();
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(flashcards.findById(2L)).thenReturn(Optional.of(flashcard));
        when(reviews.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var events = mock(com.example.demo.study.repository.FlashcardStudyEventRepository.class);
        var activityLock = mock(com.example.demo.study.service.LearningActivityLock.class);
        when(activityLock.acquire(1L)).thenReturn(user);
        service = new StudyServiceImpl(flashcards, reviews, weakVocabulary,
                new com.example.demo.flashcard.service.DeckAccessPolicy(mock(com.example.demo.flashcard.repository.DeckRepository.class)),
                events, activityLock, new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules());
    }

    @Test void qualityOneShouldUpdateSm2AndRecordWeakDifficulty() { service.processReview(1L, 2L, 1); verify(weakVocabulary).registerStudyDetection(1L, 2L, 1, com.example.demo.weakvocabulary.entity.WeakDetectionReason.STUDY_FORGOT); verify(reviews).save(argThat(review -> review.getRepetitionCount() == 0 && review.getIntervalDays() == 1 && review.getNextReviewDate() != null)); }
    @Test void qualityThreeShouldNotImmediatelyDetectWeakness() { service.processReview(1L, 2L, 3); verify(weakVocabulary).registerStudyDetection(1L, 2L, 3, null); }
    @Test void qualityFourShouldKeepSm2AndNotRecordWeakDifficulty() { service.processReview(1L, 2L, 4); verify(weakVocabulary).registerStudyDetection(1L, 2L, 4, null); verify(reviews).save(argThat(review -> review.getRepetitionCount() == 1 && review.getIntervalDays() == 1)); }
    @Test void qualityFiveShouldNotRecordWeakDifficulty() { service.processReview(1L, 2L, 5); verify(weakVocabulary).registerStudyDetection(1L, 2L, 5, null); }
}
