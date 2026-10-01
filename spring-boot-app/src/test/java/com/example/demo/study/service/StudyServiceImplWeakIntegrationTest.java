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
        Flashcard flashcard = Flashcard.builder().id(2L).build();
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(flashcards.findById(2L)).thenReturn(Optional.of(flashcard));
        when(reviews.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        service = new StudyServiceImpl(flashcards, reviews, users, weakVocabulary);
    }

    @Test void qualityOneShouldUpdateSm2AndRecordWeakDifficulty() { service.processReview(1L, 2L, 1); verify(weakVocabulary).recordStudyDifficulty(1L, 2L, 1); verify(reviews).save(argThat(review -> review.getRepetitionCount() == 0 && review.getIntervalDays() == 1 && review.getNextReviewDate() != null)); }
    @Test void qualityThreeShouldRecordWeakDifficulty() { service.processReview(1L, 2L, 3); verify(weakVocabulary).recordStudyDifficulty(1L, 2L, 3); }
    @Test void qualityFourShouldKeepSm2AndNotRecordWeakDifficulty() { service.processReview(1L, 2L, 4); verify(weakVocabulary, never()).recordStudyDifficulty(anyLong(), anyLong(), anyInt()); verify(reviews).save(argThat(review -> review.getRepetitionCount() == 1 && review.getIntervalDays() == 1)); }
    @Test void qualityFiveShouldNotRecordWeakDifficulty() { service.processReview(1L, 2L, 5); verify(weakVocabulary, never()).recordStudyDifficulty(anyLong(), anyLong(), anyInt()); }
}
