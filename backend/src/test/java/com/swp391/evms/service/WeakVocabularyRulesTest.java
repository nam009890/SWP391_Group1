package com.swp391.evms.service;

import static org.junit.jupiter.api.Assertions.*;
import com.swp391.evms.entity.*;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;

class WeakVocabularyRulesTest {
    @Test void manualWeakHasPriority() { assertEquals("MANUAL_MARK", WeakVocabularyService.weakReason(vocabulary(true, 0, 0, 0))); }
    @Test void consecutiveWrongIsWeakReason() { assertEquals("CONSECUTIVE_WRONG", WeakVocabularyService.weakReason(vocabulary(false, 2, 1, 5))); }
    @Test void lowAccuracyIsWeakReason() { assertEquals("LOW_ACCURACY", WeakVocabularyService.weakReason(vocabulary(false, 0, 1, 3))); }
    @Test void masksFirstExactWord() { var result=WeakVocabularyPracticeService.mask("It is difficult to maintain good habits.", "maintain"); assertTrue(result.isPresent()); assertEquals("It is difficult to _____ good habits.", result.get().question()); assertEquals("maintain", result.get().answer()); }
    @Test void doesNotMatchSubstring() { assertTrue(WeakVocabularyPracticeService.mask("Education matters.", "cat").isEmpty()); }
    @Test void correctAnswerRaisesMasteryButKeepsWeakMembership() { UserVocabulary uv=vocabulary(false, 4, 2, 5); uv.setMasteryScore(90); uv.setCorrectCount(3); uv.setWeakDeleted(false); WeakVocabularyPracticeService.applyVocabularyResult(uv, true, OffsetDateTime.now()); assertEquals(100, uv.getMasteryScore()); assertEquals(6, uv.getTotalAttempts()); assertEquals(4, uv.getCorrectCount()); assertEquals(0, uv.getConsecutiveWrong()); assertEquals(LearningStatus.WEAK, uv.getLearningStatus()); assertFalse(uv.getWeakDeleted()); }
    @Test void wrongAnswerLowersMasteryAndSetsWeak() { UserVocabulary uv=vocabulary(false, 1, 0, 0); uv.setMasteryScore(10); WeakVocabularyPracticeService.applyVocabularyResult(uv, false, OffsetDateTime.now()); assertEquals(0, uv.getMasteryScore()); assertEquals(1, uv.getTotalAttempts()); assertEquals(1, uv.getWrongCount()); assertEquals(2, uv.getConsecutiveWrong()); assertEquals(LearningStatus.WEAK, uv.getLearningStatus()); }
    private UserVocabulary vocabulary(boolean manual, int streak, int correct, int total) { UserVocabulary uv=new UserVocabulary(); uv.setManualWeak(manual); uv.setConsecutiveWrong(streak); uv.setCorrectCount(correct); uv.setTotalAttempts(total); uv.setWrongCount(Math.max(0, total-correct)); uv.setMasteryScore(0); uv.setLearningStatus(LearningStatus.WEAK); return uv; }
}
