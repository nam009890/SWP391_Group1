package com.example.demo.weakvocabulary.service;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.weakvocabulary.entity.UserWeakVocabulary;
import com.example.demo.weakvocabulary.repository.UserWeakVocabularyRepository;
import com.example.demo.weakvocabulary.service.impl.WeakVocabularyServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WeakVocabularyServiceImplTest {
    private UserWeakVocabularyRepository weakRepository;
    private WeakVocabularyService service;
    private User user;
    private Flashcard flashcard;

    @BeforeEach
    void setUp() {
        weakRepository = mock(UserWeakVocabularyRepository.class);
        UserRepository users = mock(UserRepository.class);
        FlashcardRepository flashcards = mock(FlashcardRepository.class);
        user = User.builder().id(1L).build();
        flashcard = Flashcard.builder().id(2L).build();
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(flashcards.findById(2L)).thenReturn(Optional.of(flashcard));
        when(weakRepository.save(any(UserWeakVocabulary.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new WeakVocabularyServiceImpl(weakRepository, users, flashcards);
    }

    @Test
    void manualAddCreatesActiveWeakVocabulary() {
        when(weakRepository.findByUserIdAndFlashcardId(1L, 2L)).thenReturn(Optional.empty());

        service.addManual(1L, 2L);

        verify(weakRepository).save(argThat(item -> item.isManualMarked() && !item.isWeakDeleted()));
    }

    @Test
    void manualAddRestoresSoftDeletedVocabulary() {
        UserWeakVocabulary item = UserWeakVocabulary.builder().user(user).flashcard(flashcard).weakDeleted(true).build();
        when(weakRepository.findByUserIdAndFlashcardId(1L, 2L)).thenReturn(Optional.of(item));

        service.addManual(1L, 2L);

        assertFalse(item.isWeakDeleted());
        assertTrue(item.isManualMarked());
    }

    @Test
    void studyDoesNotRestoreUserDeletedVocabulary() {
        UserWeakVocabulary item = UserWeakVocabulary.builder().user(user).flashcard(flashcard).weakDeleted(true).build();
        when(weakRepository.findByUserIdAndFlashcardId(1L, 2L)).thenReturn(Optional.of(item));

        service.recordStudyDifficulty(1L, 2L, 1);

        assertTrue(item.isWeakDeleted());
        verify(weakRepository, never()).save(any());
    }
}
