package com.example.demo.weakvocabulary.service;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.user.entity.User;
import com.example.demo.weakvocabulary.dto.WeakDtos.AnswerRequest;
import com.example.demo.weakvocabulary.dto.WeakDtos.PracticeStartRequest;
import com.example.demo.weakvocabulary.entity.*;
import com.example.demo.weakvocabulary.exception.InvalidWeakPracticeException;
import com.example.demo.weakvocabulary.repository.*;
import com.example.demo.weakvocabulary.service.impl.WeakPracticeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WeakPracticeServiceImplTest {
    private UserWeakVocabularyRepository weakRepo;
    private WeakPracticeSessionRepository sessions;
    private WeakPracticeItemRepository items;
    private WeakPracticeAttemptRepository attempts;
    private WeakPracticeService service;
    private User user;
    private UserWeakVocabulary weak;
    private WeakPracticeSession session;
    private WeakPracticeItem item;

    @BeforeEach
    void setUp() {
        weakRepo = mock(UserWeakVocabularyRepository.class); sessions = mock(WeakPracticeSessionRepository.class);
        items = mock(WeakPracticeItemRepository.class); attempts = mock(WeakPracticeAttemptRepository.class);
        FlashcardRepository cards = mock(FlashcardRepository.class);
        user = User.builder().id(1L).build();
        Flashcard card = Flashcard.builder().id(2L).vocabulary("maintain").meaning("duy trì").exampleSentence("It is difficult to maintain habits.").build();
        weak = UserWeakVocabulary.builder().id(3L).user(user).flashcard(card).masteryScore(80).build();
        session = WeakPracticeSession.builder().id(4L).user(user).questionType(WeakQuestionType.MEANING_TO_WORD).totalQuestions(1).build();
        item = WeakPracticeItem.builder().id(5L).session(session).userWeakVocabulary(weak).questionType(WeakQuestionType.MEANING_TO_WORD).questionContent("duy trì").correctAnswer("maintain").build();
        when(sessions.findByIdAndUserId(4L, 1L)).thenReturn(Optional.of(session));
        when(items.findByIdAndSessionId(5L, 4L)).thenReturn(Optional.of(item));
        when(weakRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        service = new WeakPracticeServiceImpl(weakRepo, sessions, items, attempts, cards);
    }

    private AnswerRequest answer(String value) { AnswerRequest request = new AnswerRequest(); request.setAnswer(value); return request; }

    @Test void meaningToWordAcceptsCaseAndWhitespace() { assertTrue(service.answer(1L, 4L, 5L, answer("  MAINTAIN  ")).isCorrect()); }
    @Test void wrongAnswerUpdatesWrongStatisticsWithoutDeletingWeak() { service.answer(1L, 4L, 5L, answer("wrong")); assertEquals(1, weak.getWrongCount()); assertEquals(1, weak.getConsecutiveWrong()); assertFalse(weak.isWeakDeleted()); }
    @Test void correctAnswerClampsMasteryAndCompletesSession() { service.answer(1L, 4L, 5L, answer("maintain")); assertEquals(100, weak.getMasteryScore()); assertEquals(WeakPracticeStatus.COMPLETED, session.getStatus()); assertNotNull(session.getCompletedAt()); }
    @Test void secondAnswerIsRejectedAndDoesNotCreateAnotherAttempt() { service.answer(1L, 4L, 5L, answer("maintain")); assertThrows(InvalidWeakPracticeException.class, () -> service.answer(1L, 4L, 5L, answer("maintain"))); verify(attempts, times(1)).save(any()); }
    @Test void summaryCalculatesAccuracy() { session.setTotalQuestions(5); session.setCorrectAnswers(4); session.setWrongAnswers(1); assertEquals(80d, service.summary(1L, 4L).getAccuracy()); }
    @Test void zeroQuestionSummaryDoesNotDivideByZero() { session.setTotalQuestions(0); assertEquals(0d, service.summary(1L, 4L).getAccuracy()); }
    @Test void practiceSessionOwnershipIsEnforced() { assertThrows(Exception.class, () -> service.session(2L, 4L)); }
    @Test void duplicateSelectedIdsAreRejected() { PracticeStartRequest request = new PracticeStartRequest(); request.setQuestionType(WeakQuestionType.FILL_BLANK); request.setWeakVocabularyIds(List.of(3L, 3L)); assertThrows(InvalidWeakPracticeException.class, () -> service.start(1L, request)); }
    @Test void emptySelectionIsRejected() { PracticeStartRequest request = new PracticeStartRequest(); request.setQuestionType(WeakQuestionType.FILL_BLANK); request.setWeakVocabularyIds(List.of()); assertThrows(InvalidWeakPracticeException.class, () -> service.start(1L, request)); }
    @Test void missingPracticeItemIsRejected() { when(items.findByIdAndSessionId(5L, 4L)).thenReturn(Optional.empty()); assertThrows(Exception.class, () -> service.answer(1L, 4L, 5L, answer("maintain"))); }
    @Test void questionResponseDoesNotExposeCorrectAnswer() { when(items.findBySessionIdOrderByItemOrder(4L)).thenReturn(List.of(item)); String response = service.session(1L, 4L).getQuestions().get(0).toString(); assertFalse(response.contains("maintain")); }

    private PracticeStartRequest startRequest(WeakQuestionType type) { PracticeStartRequest request = new PracticeStartRequest(); request.setQuestionType(type); request.setWeakVocabularyIds(List.of(3L)); return request; }
    private void arrangeStart(WeakQuestionType type) { session.setQuestionType(type); when(weakRepo.findAllById(List.of(3L))).thenReturn(List.of(weak)); when(sessions.save(any())).thenReturn(session); when(items.findBySessionIdOrderByItemOrder(4L)).thenReturn(List.of()); }
    @Test void fillBlankMasksTargetWord() { arrangeStart(WeakQuestionType.FILL_BLANK); service.start(1L, startRequest(WeakQuestionType.FILL_BLANK)); ArgumentCaptor<WeakPracticeItem> captor = ArgumentCaptor.forClass(WeakPracticeItem.class); verify(items).save(captor.capture()); assertEquals("It is difficult to _____ habits.", captor.getValue().getQuestionContent()); }
    @Test void fillBlankMasksWholeWordsOnly() { weak.getFlashcard().setVocabulary("art"); weak.getFlashcard().setExampleSentence("The artist created art yesterday."); arrangeStart(WeakQuestionType.FILL_BLANK); service.start(1L, startRequest(WeakQuestionType.FILL_BLANK)); ArgumentCaptor<WeakPracticeItem> captor = ArgumentCaptor.forClass(WeakPracticeItem.class); verify(items).save(captor.capture()); assertEquals("The artist created _____ yesterday.", captor.getValue().getQuestionContent()); }
    @Test void invalidFillBlankExampleIsRejected() { weak.getFlashcard().setExampleSentence("No target here."); arrangeStart(WeakQuestionType.FILL_BLANK); assertThrows(InvalidWeakPracticeException.class, () -> service.start(1L, startRequest(WeakQuestionType.FILL_BLANK))); }
}
