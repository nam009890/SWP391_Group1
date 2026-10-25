package com.example.demo.study;

import com.example.demo.common.security.JwtTokenProvider;
import com.example.demo.flashcard.entity.*;
import com.example.demo.flashcard.repository.*;
import com.example.demo.study.dto.ReviewResponse;
import com.example.demo.study.repository.*;
import com.example.demo.study.service.StudyService;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.weakvocabulary.dto.WeakDtos.*;
import com.example.demo.weakvocabulary.entity.*;
import com.example.demo.weakvocabulary.repository.*;
import com.example.demo.weakvocabulary.service.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.*;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:automaticweak;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect", "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"})
@AutoConfigureMockMvc
@Transactional
class AutomaticWeakDetectionIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JwtTokenProvider jwt;
    @Autowired StudyService study;
    @Autowired WeakVocabularyService weakService;
    @Autowired WeakPracticeService practice;
    @Autowired UserRepository users;
    @Autowired DeckRepository decks;
    @Autowired FlashcardRepository cards;
    @Autowired FlashcardStudyEventRepository events;
    @Autowired UserFlashcardReviewRepository reviews;
    @Autowired UserWeakVocabularyRepository weak;
    @Autowired WeakPracticeAttemptRepository attempts;
    @Autowired WeakPracticeItemRepository items;
    @Autowired WeakPracticeSessionRepository sessions;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
    User learner, other;
    Deck publicDeck, privateDeck;
    Flashcard apple, banana, secret;
    String token;

    @BeforeEach
    void setup() {
        learner = users.save(User.builder().email("auto-learner@test.local").name("Learner").build());
        other = users.save(User.builder().email("auto-other@test.local").name("Other").build());
        publicDeck = decks.save(Deck.builder().name("Public").owner(other).build());
        privateDeck = decks.save(Deck.builder().name("Private").owner(other).visibility(DeckVisibility.PRIVATE).build());
        apple = card(publicDeck, "apple");
        banana = card(publicDeck, "banana");
        secret = card(privateDeck, "secret");
        token = "Bearer " + jwt.generateToken(learner.getEmail());
    }

    private Flashcard card(Deck deck, String word) {
        return cards.save(Flashcard.builder().deck(deck).vocabulary(word).meaning("meaning " + word)
                .exampleSentence("Use " + word + " today.").build());
    }

    private ReviewResponse review(int quality) {
        return study.processReview(learner.getId(), apple.getId(), quality, UUID.randomUUID().toString());
    }

    private UserWeakVocabulary word() {
        return weak.findByUserIdAndFlashcardId(learner.getId(), apple.getId()).orElseThrow();
    }

    private ResultActions httpReview(Long cardId, int quality, String requestId) throws Exception {
        return mvc.perform(post("/api/study/flashcards/" + cardId + "/review")
                .header("Authorization", token).contentType("application/json")
                .content(json.writeValueAsString(Map.of("quality", quality, "requestId", requestId))));
    }

    @ParameterizedTest
    @CsvSource({
            "1,AUTO_ADDED,STUDY_FORGOT,0",
            "3,NOT_DETECTED,NONE,0",
            "3/3,AUTO_ADDED,STUDY_HARD_REPEAT,0",
            "4/3/3,AUTO_ADDED,STUDY_HARD_REPEAT,33.33",
            "3/4/3,AUTO_ADDED,STUDY_HARD_REPEAT,33.33",
            "3/4/4,NOT_DETECTED,NONE,66.67",
            "3/3/4/4,NOT_DETECTED,NONE,50",
            "4/4/3,NOT_DETECTED,NONE,66.67",
            "4,NOT_DETECTED,NONE,100",
            "5,NOT_DETECTED,NONE,100",
            "1/1/1/4/4,ALREADY_WEAK,STUDY_LOW_RECALL,40",
            "1/1/4/4,NOT_DETECTED,NONE,50",
            "1/1/4/4/4,NOT_DETECTED,NONE,60",
            "3/4/3/4/3,ALREADY_WEAK,STUDY_HARD_REPEAT,40",
            "3/3/4/4/1,ALREADY_WEAK,STUDY_FORGOT,40"
    })
    void persistedSequencesFollowThresholdsAndPriority(String sequence, String status, String reason, double accuracy) {
        ReviewResponse response = null;
        String[] ratings = sequence.split("/");
        for (String rating : ratings) response = review(Integer.parseInt(rating));
        assertNotNull(response);
        assertEquals(status, response.getWeakDetection().status().name());
        assertEquals(reason, response.getWeakDetection().reason() == null ? "NONE" : response.getWeakDetection().reason().name());
        assertEquals(accuracy, response.getStudyAccuracy());
        assertEquals(ratings.length, response.getStudyReviewCount());
        assertEquals(ratings.length, events.count());
        assertEquals(1, reviews.count());
        assertTrue(weak.count() <= 1);
    }

    @Test
    void manualWordBecomesBothWithoutResettingProgress() {
        weakService.addManual(learner.getId(), apple.getId());
        UserWeakVocabulary existing = word();
        existing.setWeakNote("Keep my note");
        existing.setMasteryScore(60);
        existing.setTotalAttempts(5);
        existing.setCorrectCount(2);
        existing.setWrongCount(3);
        var created = existing.getCreatedAt();
        weak.saveAndFlush(existing);
        review(1);
        var first = word().getFirstDetectedAt();
        assertNotNull(first);
        review(1);
        assertEquals(1, weak.count());
        assertTrue(word().isManualMarked());
        assertTrue(word().isAutoDetected());
        assertEquals(60, word().getMasteryScore());
        assertEquals(5, word().getTotalAttempts());
        assertEquals(2, word().getCorrectCount());
        assertEquals("Keep my note", word().getWeakNote());
        assertEquals(created, word().getCreatedAt());
        assertEquals(first, word().getFirstDetectedAt());
        assertFalse(word().getLastDetectedAt().isBefore(first));
        var dto = weakService.list(learner.getId(), null, null, "BOTH", null, null, null, null, null, 0, 10).getItems().get(0);
        assertEquals(40d, dto.getAccuracy());
        assertEquals(0d, dto.getStudyAccuracy());
        assertEquals(2, dto.getStudyReviewCount());
        assertEquals(WeakDetectionReason.STUDY_FORGOT, dto.getDetectionReason());
    }

    @Test
    void softDeletionSuppressesDetectionButManualAddRestoresHistory() {
        review(1);
        UserWeakVocabulary existing = word();
        existing.setMasteryScore(40);
        existing.setTotalAttempts(1);
        existing.setCorrectCount(1);
        weak.save(existing);
        weakService.softDelete(learner.getId(), existing.getId());
        ReviewResponse response = review(1);
        assertEquals(ReviewResponse.DetectionStatus.SUPPRESSED, response.getWeakDetection().status());
        assertTrue(word().isWeakDeleted());
        assertEquals(2, events.count());
        assertEquals(0, weakService.list(learner.getId(), null, null, null, null, null, null, null, null, 0, 10).getTotalElements());
        weakService.addManual(learner.getId(), apple.getId());
        assertFalse(word().isWeakDeleted());
        assertEquals(40, word().getMasteryScore());
        assertEquals(1, word().getTotalAttempts());
        assertEquals(ReviewResponse.DetectionStatus.ALREADY_WEAK, review(1).getWeakDetection().status());
    }

    @Test
    void requestReplayReturnsOriginalSchedulingAndMetrics() throws Exception {
        String key = UUID.randomUUID().toString();
        String original = httpReview(apple.getId(), 3, key).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        review(3);
        String replay = httpReview(apple.getId(), 3, key).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(json.readTree(original), json.readTree(replay));
        assertEquals(2, events.count());
        assertEquals(2, reviews.findByUserIdAndFlashcardId(learner.getId(), apple.getId()).orElseThrow().getRepetitionCount());
        httpReview(apple.getId(), 1, key).andExpect(status().isConflict());
        httpReview(banana.getId(), 3, key).andExpect(status().isConflict());
        assertEquals(2, events.count());
    }

    @Test
    void perUserRequestIdsAndPerCardWindowsAreIndependent() {
        String key = UUID.randomUUID().toString();
        study.processReview(learner.getId(), apple.getId(), 3, key);
        study.processReview(other.getId(), apple.getId(), 3, key);
        study.processReview(learner.getId(), banana.getId(), 3, UUID.randomUUID().toString());
        assertEquals(0, weak.count());
        review(3);
        assertEquals(1, weak.count());
        assertEquals(learner.getId(), word().getUser().getId());
        assertTrue(weak.findByUserIdAndFlashcardId(other.getId(), apple.getId()).isEmpty());
        assertEquals(other.getId(), cards.findById(apple.getId()).orElseThrow().getDeck().getOwner().getId());
    }

    @Test
    void noHistoryDoesNotInventStudyAccuracy() {
        reviews.save(com.example.demo.study.entity.UserFlashcardReview.builder()
                .user(learner).flashcard(apple).repetitionCount(8).easeFactor(2.5).intervalDays(12).build());
        var dto = weakService.addManual(learner.getId(), apple.getId());
        assertNull(dto.getStudyAccuracy());
        assertEquals(0, dto.getStudyReviewCount());
        assertEquals(0, dto.getTotalAttempts());
        assertEquals(0d, dto.getAccuracy());
        assertEquals(WeakDetectionReason.MANUAL_MARK, dto.getDetectionReason());
        assertEquals(0, events.count());
        assertEquals(8, reviews.findByUserIdAndFlashcardId(learner.getId(), apple.getId()).orElseThrow().getRepetitionCount());
    }

    @Test
    void successfulRecallKeepsMeaningfulDetectionReason() {
        review(1);
        var first = word().getFirstDetectedAt();
        var last = word().getLastDetectedAt();
        assertEquals(ReviewResponse.DetectionStatus.NOT_DETECTED, review(4).getWeakDetection().status());
        assertEquals(WeakDetectionReason.STUDY_FORGOT, word().getDetectionReason());
        assertEquals(first, word().getFirstDetectedAt());
        assertEquals(last, word().getLastDetectedAt());
        assertEquals(4, word().getLastStudyQuality());
    }

    @Test
    void deckOptionsIncludeOwnedPrivateDeckButExcludeInaccessibleContent() throws Exception {
        weakService.addManual(learner.getId(), apple.getId());
        Deck mine = decks.save(Deck.builder().name("My private deck").owner(learner).visibility(DeckVisibility.PRIVATE).build());
        Flashcard ownCard = card(mine, "owned");
        weakService.addManual(learner.getId(), ownCard.getId());
        mvc.perform(get("/api/weak-vocabularies/decks").header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        publicDeck.setDeleted(true);
        decks.saveAndFlush(publicDeck);
        mvc.perform(get("/api/weak-vocabularies/decks").header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(mine.getId()));
        assertEquals(2, weak.count());
    }

    @Test
    void legacyAutomaticReasonDoesNotPretendToKnowHistory() {
        weak.saveAndFlush(UserWeakVocabulary.builder().user(learner).flashcard(apple).autoDetected(true).manualMarked(true).build());
        var dto = weakService.list(learner.getId(), null, null, "BOTH", null, null, null, null, null, 0, 10).getItems().get(0);
        assertEquals(WeakDetectionReason.LEGACY_AUTO, dto.getDetectionReason());
        assertNull(dto.getStudyAccuracy());
        assertNull(dto.getFirstDetectedAt());
    }

    @ParameterizedTest
    @ValueSource(ints = {-1, 0, 2, 6})
    void invalidRatingsCannotPersistAnything(int quality) throws Exception {
        httpReview(apple.getId(), quality, UUID.randomUUID().toString()).andExpect(status().isBadRequest());
        assertEquals(0, events.count());
        assertEquals(0, reviews.count());
    }

    @Test
    void invalidRequestIdAndForgedUserIdAreHandled() throws Exception {
        httpReview(apple.getId(), 1, "not-a-uuid").andExpect(status().isBadRequest());
        mvc.perform(post("/api/study/flashcards/" + apple.getId() + "/review").header("Authorization", token)
                .contentType("application/json").content("{\"quality\":1,\"userId\":" + other.getId() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(learner.getId()));
        assertEquals(learner.getId(), word().getUser().getId());
    }

    @Test
    void guestsPrivateDecksAndLockedAccountsCannotPersistReviews() throws Exception {
        mvc.perform(post("/api/study/flashcards/" + apple.getId() + "/review")
                .contentType("application/json").content("{\"quality\":1}" )).andExpect(status().isUnauthorized());
        httpReview(secret.getId(), 1, UUID.randomUUID().toString()).andExpect(status().isNotFound());
        learner.setLocked(true);
        users.saveAndFlush(learner);
        httpReview(apple.getId(), 1, UUID.randomUUID().toString()).andExpect(status().isUnauthorized());
        assertEquals(0, events.count());
        assertEquals(0, weak.count());
    }

    @Test
    void visibilityChangesHideWeakContentButPreserveHistory() throws Exception {
        review(1);
        publicDeck.setVisibility(DeckVisibility.PRIVATE);
        decks.saveAndFlush(publicDeck);
        mvc.perform(get("/api/weak-vocabularies").header("Authorization", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        httpReview(apple.getId(), 1, UUID.randomUUID().toString()).andExpect(status().isNotFound());
        assertEquals(1, events.count());
        assertEquals(1, weak.count());
    }

    private SessionResponse startPractice() {
        PracticeStartRequest request = new PracticeStartRequest();
        request.setQuestionType(WeakQuestionType.MEANING_TO_WORD);
        request.setWeakVocabularyIds(List.of(word().getId()));
        return practice.start(learner.getId(), request);
    }

    private AnswerResponse practiceAnswer(SessionResponse session, String answer) {
        AnswerRequest request = new AnswerRequest();
        request.setAnswer(answer);
        return practice.answer(learner.getId(), session.getSessionId(), session.getQuestions().get(0).getItemId(), request);
    }

    @Test
    void practiceReinforcesBothWithoutResettingStudyOrDeletingWord() {
        weakService.addManual(learner.getId(), apple.getId());
        practiceAnswer(startPractice(), "wrong");
        assertFalse(word().isAutoDetected());
        practiceAnswer(startPractice(), "wrong");
        assertTrue(word().isAutoDetected());
        assertTrue(word().isManualMarked());
        assertEquals(WeakDetectionReason.PRACTICE_CONSECUTIVE_WRONG, word().getDetectionReason());
        assertEquals(2, word().getConsecutiveWrong());
        practiceAnswer(startPractice(), "apple");
        assertEquals(WeakDetectionReason.PRACTICE_LOW_ACCURACY, word().getDetectionReason());
        assertEquals(0, word().getConsecutiveWrong());
        assertEquals(20, word().getMasteryScore());
        assertEquals(3, word().getTotalAttempts());
        assertEquals(1, word().getCorrectCount());
        assertEquals(2, word().getWrongCount());
        assertEquals(3, attempts.count());
        assertEquals(0, events.count());
        assertFalse(word().isWeakDeleted());
        var dto = weakService.list(learner.getId(), null, null, "BOTH", null, null, null, null, null, 0, 10).getItems().get(0);
        assertEquals(33.33, dto.getAccuracy());
        assertNull(dto.getStudyAccuracy());
    }

    @Test
    void lowPracticeAccuracyCanUpgradeManualWordWithoutConsecutiveMistakes() {
        weakService.addManual(learner.getId(), apple.getId());
        practiceAnswer(startPractice(), "wrong");
        practiceAnswer(startPractice(), "apple");
        assertFalse(word().isAutoDetected());
        practiceAnswer(startPractice(), "wrong");
        assertEquals(1, word().getConsecutiveWrong());
        assertEquals(WeakDetectionReason.PRACTICE_LOW_ACCURACY, word().getDetectionReason());
        assertTrue(word().isManualMarked());
        assertTrue(word().isAutoDetected());
        assertEquals(3, attempts.count());
    }

    @Test
    void masteryClampsAndPracticeAccuracyIsTwoOutOfFive() {
        weakService.addManual(learner.getId(), apple.getId());
        for (String answer : List.of("wrong", "apple", "wrong", "apple", "wrong")) {
            practiceAnswer(startPractice(), answer);
        }
        assertEquals(0, word().getMasteryScore());
        assertEquals(5, word().getTotalAttempts());
        var dto = weakService.list(learner.getId(), null, null, "ALL", null, null, null, null, null, 0, 10).getItems().get(0);
        assertEquals(40d, dto.getAccuracy());
        for (int i = 0; i < 7; i++) practiceAnswer(startPractice(), "apple");
        assertEquals(100, word().getMasteryScore());
        review(4);
        review(5);
        assertEquals(100, word().getMasteryScore());
        assertEquals(12, word().getTotalAttempts());
        assertFalse(word().isWeakDeleted());
    }

    @Test
    void duplicateAnswersDeletedWordsAndOtherLearnersAreRejected() {
        weakService.addManual(learner.getId(), apple.getId());
        SessionResponse first = startPractice();
        practiceAnswer(first, "apple");
        assertThrows(Exception.class, () -> practiceAnswer(first, "apple"));
        assertEquals(1, attempts.count());
        assertEquals(1, word().getTotalAttempts());
        SessionResponse second = startPractice();
        weakService.softDelete(learner.getId(), word().getId());
        assertThrows(Exception.class, () -> practiceAnswer(second, "apple"));
        assertEquals(1, attempts.count());
        assertThrows(Exception.class, () -> practice.session(other.getId(), first.getSessionId()));
        assertEquals(1, word().getCorrectCount());
        assertThrows(Exception.class, () -> weakService.softDelete(other.getId(), word().getId()));
    }

    @Test
    void legacyRequestsWithoutIdRemainSupportedAsIndependentReviews() throws Exception {
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/study/flashcards/" + apple.getId() + "/review").header("Authorization", token)
                    .contentType("application/json").content("{\"quality\":3}"))
                    .andExpect(status().isOk());
        }
        assertEquals(2, events.count());
        assertTrue(word().isAutoDetected());
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void concurrentReviewsDeduplicateOrPreserveDistinctActions(boolean sameKey) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        String key = UUID.randomUUID().toString();
        try {
            Callable<ReviewResponse> firstAction = () -> {
                start.await();
                return study.processReview(learner.getId(), apple.getId(), 1, key);
            };
            Callable<ReviewResponse> secondAction = () -> {
                start.await();
                return study.processReview(learner.getId(), apple.getId(), 1, sameKey ? key : UUID.randomUUID().toString());
            };
            var first = executor.submit(firstAction);
            var second = executor.submit(secondAction);
            start.countDown();
            var a = first.get(15, TimeUnit.SECONDS);
            var b = second.get(15, TimeUnit.SECONDS);
            assertEquals(sameKey ? 1 : 2, events.count());
            assertEquals(1, reviews.count());
            assertEquals(1, weak.count());
            assertEquals(sameKey ? 1.96 : 1.42,
                    reviews.findByUserIdAndFlashcardId(learner.getId(), apple.getId()).orElseThrow().getEaseFactor(), 0.00001);
            if (sameKey) assertEquals(json.valueToTree(a), json.valueToTree(b));
        } finally {
            executor.shutdownNow();
            cleanupCommittedFixtures();
        }
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void differentConcurrentPracticeItemsDoNotLoseWeakStatistics() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            weakService.addManual(learner.getId(), apple.getId());
            SessionResponse a = startPractice();
            SessionResponse b = startPractice();
            var first = executor.submit(() -> {
                start.await();
                return practiceAnswer(a, "apple");
            });
            var second = executor.submit(() -> {
                start.await();
                return practiceAnswer(b, "apple");
            });
            start.countDown();
            assertTrue(first.get(15, TimeUnit.SECONDS).isCorrect());
            assertTrue(second.get(15, TimeUnit.SECONDS).isCorrect());
            assertEquals(2, attempts.count());
            assertEquals(2, word().getTotalAttempts());
            assertEquals(2, word().getCorrectCount());
            assertEquals(40, word().getMasteryScore());
        } finally {
            executor.shutdownNow();
            cleanupCommittedFixtures();
        }
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void failedTransactionRollsBackSchedulingHistoryAndDetectionTogether() {
        try {
            var transaction = new org.springframework.transaction.support.TransactionTemplate(transactions);
            assertThrows(IllegalStateException.class, () -> transaction.execute(status -> {
                study.processReview(learner.getId(), apple.getId(), 1, UUID.randomUUID().toString());
                throw new IllegalStateException("Simulate failure before commit");
            }));
            assertEquals(0, reviews.count());
            assertEquals(0, events.count());
            assertEquals(0, weak.count());
        } finally {
            cleanupCommittedFixtures();
        }
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void concurrentPracticeAnswersProduceOnlyOneAttempt() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            weakService.addManual(learner.getId(), apple.getId());
            SessionResponse session = startPractice();
            Callable<Boolean> action = () -> {
                start.await();
                try {
                    practiceAnswer(session, "apple");
                    return true;
                } catch (com.example.demo.weakvocabulary.exception.InvalidWeakPracticeException e) {
                    return false;
                }
            };
            var first = executor.submit(action);
            var second = executor.submit(action);
            start.countDown();
            boolean a = first.get(15, TimeUnit.SECONDS);
            boolean b = second.get(15, TimeUnit.SECONDS);
            assertNotEquals(a, b);
            assertEquals(1, attempts.count());
            assertEquals(1, word().getTotalAttempts());
            assertEquals(20, word().getMasteryScore());
        } finally {
            executor.shutdownNow();
            cleanupCommittedFixtures();
        }
    }

    private void cleanupCommittedFixtures() {
        // Chỉ fixture đã commit trong H2 riêng của lớp test; không xóa dữ liệu ứng dụng.
        attempts.deleteAll();
        items.deleteAll();
        sessions.deleteAll();
        weak.deleteAll();
        events.deleteAll();
        reviews.deleteAll();
        cards.deleteAll();
        decks.deleteAll();
        users.deleteAll();
    }
}
