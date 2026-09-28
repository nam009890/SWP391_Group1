package com.swp391.evms.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.swp391.evms.dto.request.SubmitFillBlankAnswerRequest;
import com.swp391.evms.entity.*;
import com.swp391.evms.exception.ReviewItemAlreadyAnsweredException;
import com.swp391.evms.repository.*;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class WeakVocabularyPracticeServiceTest {
    @Test void rejectsPreviouslyAnsweredItem() {
        Fixture f=new Fixture(); f.item.setStatus(ReviewItemStatus.ANSWERED); when(f.sessionRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(f.session));
        when(f.itemRepository.findByIdAndSessionId(9L, 7L)).thenReturn(Optional.of(f.item));
        assertThrows(ReviewItemAlreadyAnsweredException.class, () -> f.service.submitAnswer(1L, 7L, 9L, new SubmitFillBlankAnswerRequest("answer")));
    }
    @Test void completesSessionAfterLastAnswer() {
        Fixture f=new Fixture(); f.session.setTotalQuestions(1); when(f.sessionRepository.findByIdAndUserId(7L, 1L)).thenReturn(Optional.of(f.session));
        when(f.itemRepository.findByIdAndSessionId(9L, 7L)).thenReturn(Optional.of(f.item)); when(f.attemptRepository.existsBySessionItemId(9L)).thenReturn(false);
        var response=f.service.submitAnswer(1L, 7L, 9L, new SubmitFillBlankAnswerRequest("answer"));
        assertTrue(response.sessionCompleted()); assertEquals(ReviewSessionStatus.COMPLETED, f.session.getStatus()); assertNotNull(f.session.getCompletedAt());
    }
    private static class Fixture {
        final WeakVocabularyService weak=mock(WeakVocabularyService.class); final UserVocabularyRepository uvRepository=mock(UserVocabularyRepository.class);
        final VocabularySenseRepository senseRepository=mock(VocabularySenseRepository.class); final VocabularyExampleRepository exampleRepository=mock(VocabularyExampleRepository.class);
        final ReviewSessionRepository sessionRepository=mock(ReviewSessionRepository.class); final ReviewSessionItemRepository itemRepository=mock(ReviewSessionItemRepository.class); final ReviewAttemptRepository attemptRepository=mock(ReviewAttemptRepository.class);
        final WeakVocabularyPracticeService service=new WeakVocabularyPracticeService(weak, uvRepository, senseRepository, exampleRepository, sessionRepository, itemRepository, attemptRepository);
        final ReviewSession session=new ReviewSession(); final ReviewSessionItem item=new ReviewSessionItem();
        Fixture() { session.setCorrectAnswers(0); session.setWrongAnswers(0); session.setStatus(ReviewSessionStatus.IN_PROGRESS); UserVocabulary uv=new UserVocabulary(); uv.setMasteryScore(0); uv.setTotalAttempts(0); uv.setCorrectCount(0); uv.setWrongCount(0); uv.setConsecutiveWrong(0); uv.setLearningStatus(LearningStatus.WEAK); item.setSession(session); item.setUserVocabulary(uv); item.setCorrectAnswer("answer"); item.setQuestionContent("_____ test"); item.setStatus(ReviewItemStatus.PENDING); }
    }
}
