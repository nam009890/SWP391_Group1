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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    @Test
    void qualityOneMarksAutoDetected() {
        UserWeakVocabulary item = UserWeakVocabulary.builder().user(user).flashcard(flashcard).build();
        when(weakRepository.findByUserIdAndFlashcardId(1L, 2L)).thenReturn(Optional.of(item));
        service.recordStudyDifficulty(1L, 2L, 1);
        assertTrue(item.isAutoDetected());
        assertTrue(item.getLastStudyQuality() == 1);
    }

    @Test
    void qualityThreeMarksAutoDetected() {
        UserWeakVocabulary item = UserWeakVocabulary.builder().user(user).flashcard(flashcard).build();
        when(weakRepository.findByUserIdAndFlashcardId(1L, 2L)).thenReturn(Optional.of(item));
        service.recordStudyDifficulty(1L, 2L, 3);
        assertTrue(item.isAutoDetected());
    }

    @Test
    void qualityFourDoesNotCreateWeakVocabulary() {
        service.recordStudyDifficulty(1L, 2L, 4);
        verify(weakRepository, never()).findByUserIdAndFlashcardId(any(), any());
    }

    @Test
    void qualityFiveDoesNotRemoveExistingWeakVocabulary() {
        UserWeakVocabulary item = UserWeakVocabulary.builder().user(user).flashcard(flashcard).build();
        when(weakRepository.findByUserIdAndFlashcardId(1L, 2L)).thenReturn(Optional.of(item));
        service.recordStudyDifficulty(1L, 2L, 5);
        assertFalse(item.isWeakDeleted());
        verify(weakRepository, never()).save(any());
    }

    @Test
    void manualAddShouldBeIdempotent() {
        UserWeakVocabulary existing = UserWeakVocabulary.builder().user(user).flashcard(flashcard).totalAttempts(4).build();
        when(weakRepository.findByUserIdAndFlashcardId(1L, 2L)).thenReturn(Optional.empty(), Optional.of(existing));
        service.addManual(1L, 2L);
        service.addManual(1L, 2L);
        verify(weakRepository, times(2)).save(any(UserWeakVocabulary.class));
        assertEquals(4, existing.getTotalAttempts());
        assertTrue(existing.isManualMarked());
    }

    @Test
    void deleteShouldSoftDeleteWithoutHardDelete() {
        UserWeakVocabulary item = UserWeakVocabulary.builder().id(3L).user(user).flashcard(flashcard).build();
        when(weakRepository.findById(3L)).thenReturn(Optional.of(item));
        service.softDelete(1L, 3L);
        assertTrue(item.isWeakDeleted());
        assertNotNull(item.getWeakDeletedAt());
        verify(weakRepository, never()).delete(any(UserWeakVocabulary.class));
    }

    @Test
    void patchShouldRejectDifferentOwner() {
        User other = User.builder().id(9L).build();
        UserWeakVocabulary item = UserWeakVocabulary.builder().id(3L).user(user).flashcard(flashcard).weakNote("original").build();
        when(weakRepository.findById(3L)).thenReturn(Optional.of(item));
        var request = new com.example.demo.weakvocabulary.dto.WeakDtos.PatchRequest(); request.setWeakNote("changed");
        assertThrows(com.example.demo.common.exception.ResourceNotFoundException.class, () -> service.patch(other.getId(), 3L, request));
        assertEquals("original", item.getWeakNote());
    }

    @Test
    void deleteShouldRejectDifferentOwner() {
        UserWeakVocabulary item = UserWeakVocabulary.builder().id(3L).user(user).flashcard(flashcard).build();
        when(weakRepository.findById(3L)).thenReturn(Optional.of(item));
        assertThrows(com.example.demo.common.exception.ResourceNotFoundException.class, () -> service.softDelete(9L, 3L));
        assertFalse(item.isWeakDeleted());
    }
}
