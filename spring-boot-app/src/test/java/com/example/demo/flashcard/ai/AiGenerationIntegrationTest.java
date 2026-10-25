package com.example.demo.flashcard.ai;

import com.example.demo.flashcard.ai.config.AiProperties;
import com.example.demo.flashcard.ai.entity.AiGenerationSource;
import com.example.demo.flashcard.ai.dto.AiDtos.*;
import com.example.demo.flashcard.ai.exception.AiException;
import com.example.demo.flashcard.ai.provider.OpenAiFlashcardGenerationProvider;
import com.example.demo.flashcard.ai.provider.GeminiFlashcardGenerationProvider;
import com.example.demo.flashcard.ai.repository.AiBatchRepository;
import com.example.demo.flashcard.ai.service.*;
import com.example.demo.flashcard.entity.*;
import com.example.demo.flashcard.repository.*;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.common.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={
        "spring.datasource.url=jdbc:h2:mem:aiv2;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"})
@AutoConfigureMockMvc
class AiGenerationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired DeckRepository decks;
    @Autowired FlashcardRepository cards;
    @Autowired AiBatchRepository batches;
    @Autowired AiProperties settings;
    @Autowired AiFlashcardGenerationService generation;
    @Autowired AiGenerationStore store;
    @Autowired JwtTokenProvider jwt;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Autowired List<com.example.demo.flashcard.ai.provider.FlashcardGenerationProvider> registeredProviders;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
    @MockitoBean OpenAiFlashcardGenerationProvider openai;
    @MockitoBean GeminiFlashcardGenerationProvider gemini;
    User owner, other;
    Deck deck, another;
    String token;
    AtomicInteger calls;

    @BeforeEach
    void setup() {
        settings.setProvider("demo-library");
        settings.setEnabled(true);
        settings.setMaxCards(20);
        settings.setDailyUserLimit(10);
        settings.setDailyGlobalLimit(100);
        settings.setMaxConcurrentPerUser(1);
        owner=users.save(User.builder().email("ai-owner@test.local").name("Owner").build());
        other=users.save(User.builder().email("ai-other@test.local").name("Other").build());
        deck=decks.save(Deck.builder().name("My Deck").owner(owner).visibility(DeckVisibility.PRIVATE).build());
        another=decks.save(Deck.builder().name("Other deck").owner(other).build());
        token="Bearer " + jwt.generateToken(owner.getEmail());
        calls=new AtomicInteger();
        when(openai.source()).thenReturn("OPENAI");
        when(gemini.source()).thenReturn("GEMINI");
        when(gemini.generate(any(),anyList())).thenReturn(new ProviderResult(fakeCards(),120L,220L,1));
        when(openai.generate(any(),anyList())).thenAnswer(invocation -> {
            calls.incrementAndGet();
            assertFalse(TransactionSynchronizationManager.isActualTransactionActive(),"External provider must run outside transaction");
            return new ProviderResult(fakeCards(),100L,200L,1);
        });
    }

    @AfterEach
    void cleanup() {
        batches.deleteAll();
        cards.deleteAll();
        decks.deleteAll();
        users.deleteAll();
    }

    List<Card> fakeCards() {
        return List.of(new Card("passport","hộ chiếu",null,"Keep your passport safe."),
                new Card("luggage","hành lý",null,"My luggage is heavy."),
                new Card("journey","chuyến đi",null,"The journey was short."),
                new Card("hotel","khách sạn",null,"The hotel is near the beach."),
                new Card("airport","sân bay",null,"The airport is busy today."));
    }
    PreviewRequest request(String key) { return new PreviewRequest("Travel","B1",5,"MIXED","",key); }
    Preview preview() { return generation.preview(owner.getId(),deck.getId(),request(UUID.randomUUID().toString())); }
    CommitRequest select(Preview preview, int count) { return new CommitRequest(preview.generationId(),preview.cards().subList(0,count)); }
    ResultActions httpPreview(Long deckId, PreviewRequest request, String bearer) throws Exception {
        return mvc.perform(post("/api/decks/"+deckId+"/ai/preview").header("Authorization",bearer)
                .contentType("application/json").content(json.writeValueAsString(request)));
    }
    ResultActions httpCommit(Long deckId, CommitRequest request, String bearer) throws Exception {
        return mvc.perform(post("/api/decks/"+deckId+"/ai/commit").header("Authorization",bearer)
                .contentType("application/json").content(json.writeValueAsString(request)));
    }

    @Test
    void previewIsStagedAndCommitSavesSelectedEditedCardsOnly() throws Exception {
        Preview preview=preview();
        assertEquals(0,cards.count());
        assertEquals("DEMO_LIBRARY",preview.source());
        assertEquals(5,preview.validCount());
        Candidate first=preview.cards().get(0);
        Candidate edited=new Candidate(first.candidateId(),"travel document","giấy tờ du lịch",null,"Keep your travel document safe.");
        var selection=new CommitRequest(preview.generationId(),List.of(edited,preview.cards().get(1)));
        var result=store.commit(owner.getId(),deck.getId(),selection);
        assertEquals(2,result.savedCount());
        assertEquals(2,result.deckCardCount());
        assertEquals(2,cards.count());
        assertTrue(cards.vocabularyInDeck(deck.getId()).contains("travel document"));
        assertEquals("COMMITTED",batches.findById(preview.generationId()).orElseThrow().getStatus());
        mvc.perform(get("/api/decks/"+deck.getId()).header("Authorization",token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.flashcardCount").value(2));
    }

    @Test
    void repeatedCommitReturnsSnapshotAndDifferentSelectionConflicts() {
        Preview preview=preview();
        var request=select(preview,2);
        var first=store.commit(owner.getId(),deck.getId(),request);
        var replay=store.commit(owner.getId(),deck.getId(),request);
        assertEquals(json.valueToTree(first),json.valueToTree(replay));
        assertEquals(2,cards.count());
        assertEquals("GENERATION_ALREADY_COMMITTED",assertThrows(AiException.class,
                () -> store.commit(owner.getId(),deck.getId(),select(preview,1))).getCode());
    }

    @Test
    void duplicateAgainstDeckAndWithinSelectionIsRejectedAtomically() {
        Preview preview=preview();
        Candidate first=preview.cards().get(0);
        cards.save(Flashcard.builder().deck(deck).vocabulary(first.vocabulary().toUpperCase(Locale.ROOT)).meaning("từ cũ").build());
        assertEquals("DUPLICATE_FLASHCARD",assertThrows(AiException.class,
                () -> store.commit(owner.getId(),deck.getId(),select(preview,2))).getCode());
        assertEquals(1,cards.count());
        cards.deleteAll();
        var second=preview.cards().get(1);
        Candidate duplicate=new Candidate(second.candidateId(),"  "+first.vocabulary().toUpperCase(Locale.ROOT)+"  ",first.meaning(),null,first.exampleSentence());
        assertThrows(AiException.class,() -> store.commit(owner.getId(),deck.getId(),new CommitRequest(preview.generationId(),List.of(first,duplicate))));
        assertEquals(0,cards.count());
    }

    @Test
    void editedPreviewMustPassValidationAndBelongToBatch() {
        Preview preview=preview();
        Candidate first=preview.cards().get(0);
        Candidate invalid=new Candidate(first.candidateId(),first.vocabulary(),"",null,first.exampleSentence());
        assertThrows(IllegalArgumentException.class,() -> store.commit(owner.getId(),deck.getId(),new CommitRequest(preview.generationId(),List.of(preview.cards().get(1),invalid))));
        assertEquals(0,cards.count());
        Candidate forged=new Candidate(UUID.randomUUID().toString(),first.vocabulary(),first.meaning(),null,first.exampleSentence());
        assertThrows(IllegalArgumentException.class,() -> store.commit(owner.getId(),deck.getId(),new CommitRequest(preview.generationId(),List.of(forged))));
        assertEquals("READY",batches.findById(preview.generationId()).orElseThrow().getStatus());
    }

    @Test
    void expiredPreviewCannotBeSaved() {
        Preview preview=preview();
        var batch=batches.findById(preview.generationId()).orElseThrow();
        batch.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).minusSeconds(1));
        batches.saveAndFlush(batch);
        assertEquals("GENERATION_EXPIRED",assertThrows(AiException.class,() -> store.commit(owner.getId(),deck.getId(),select(preview,1))).getCode());
        assertEquals(0,cards.count());
    }

    @Test
    void generationRequestReplayCallsProviderOnceAndRejectsChangedPayload() {
        settings.setProvider("openai");
        String id=UUID.randomUUID().toString();
        Preview first=generation.preview(owner.getId(),deck.getId(),request(id));
        Preview replay=generation.preview(owner.getId(),deck.getId(),request(id));
        assertEquals(json.valueToTree(first),json.valueToTree(replay));
        assertEquals(1,calls.get());
        assertEquals(1,batches.count());
        assertEquals("OPENAI",first.source());
        assertEquals(100L,batches.findById(first.generationId()).orElseThrow().getInputTokens());
        assertThrows(AiException.class,() -> generation.preview(owner.getId(),deck.getId(),new PreviewRequest("Business English","B1",5,"MIXED","",id)));
        assertEquals(1,calls.get());
    }

    @Test
    void failedProviderDoesNotFallbackOrRetrySameApplicationRequest() {
        settings.setProvider("openai");
        doAnswer(invocation -> { calls.incrementAndGet(); throw new AiException(503,"AI_PROVIDER_UNAVAILABLE"); }).when(openai).generate(any(),anyList());
        var request=request(UUID.randomUUID().toString());
        assertThrows(AiException.class,() -> generation.preview(owner.getId(),deck.getId(),request));
        assertThrows(AiException.class,() -> generation.preview(owner.getId(),deck.getId(),request));
        assertEquals(1,calls.get());
        assertEquals(0,cards.count());
        assertEquals("FAILED",batches.findAll().get(0).getStatus());
    }

    @Test
    void validationRemovesDuplicatesInvalidCardsAndReportsRealCount() {
        settings.setProvider("openai");
        cards.save(Flashcard.builder().deck(deck).vocabulary("Passport").meaning("hộ chiếu").build());
        when(openai.generate(any(),anyList())).thenReturn(new ProviderResult(List.of(fakeCards().get(0),fakeCards().get(1),
                new Card(" LUGGAGE ","hành lý",null,"My luggage is heavy."),
                new Card("<script>","từ sai",null,"Invalid example."),fakeCards().get(2)),null,null,1));
        Preview preview=preview();
        assertEquals(5,preview.generatedCount());
        assertEquals(2,preview.validCount());
        assertEquals(2,preview.duplicatesExcluded());
        assertEquals(1,preview.invalidExcluded());
        assertEquals(1,cards.count());
    }

    @Test
    void noValidCardsRecordsUsageButPersistsNoFlashcard() {
        settings.setProvider("openai");
        when(openai.generate(any(),anyList())).thenReturn(new ProviderResult(List.of(new Card("bad","",null,"")),10L,50L,1));
        assertEquals("NO_VALID_CARDS",assertThrows(AiException.class,this::preview).getCode());
        assertEquals(10L,batches.findAll().get(0).getInputTokens());
        assertEquals(0,cards.count());
    }

    @ParameterizedTest
    @ValueSource(strings={"user","global"})
    void dailyQuotaIsPersistedInDatabase(String kind) {
        if (kind.equals("user")) settings.setDailyUserLimit(1); else settings.setDailyGlobalLimit(1);
        preview();
        assertEquals(kind.equals("user")?"APPLICATION_DAILY_LIMIT":"APPLICATION_GLOBAL_LIMIT",assertThrows(AiException.class,this::preview).getCode());
        assertEquals(1,batches.count());
    }

    @ParameterizedTest
    @ValueSource(ints={-1,1,21,100})
    void invalidCountNeverInvokesProvider(int count) throws Exception {
        settings.setProvider("openai");
        httpPreview(deck.getId(),new PreviewRequest("Travel","B1",count,"MIXED","",UUID.randomUUID().toString()),token)
                .andExpect(status().isBadRequest());
        assertEquals(0,calls.get());
        assertEquals(0,batches.count());
    }

    @Test
    void configuredMaximumIsEnforced() throws Exception {
        settings.setMaxCards(5);
        httpPreview(deck.getId(),new PreviewRequest("Travel","B1",10,"MIXED","",UUID.randomUUID().toString()),token)
                .andExpect(status().isBadRequest());
    }

    @Test
    void providerDetailsAreNeverReturnedToLearner() throws Exception {
        settings.setProvider("openai");
        doThrow(new IllegalStateException("PRIVATE_PROVIDER_DETAIL"))
                .when(openai).generate(any(),anyList());
        httpPreview(deck.getId(),request(UUID.randomUUID().toString()),token)
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("AI_GENERATION_FAILED"))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("PRIVATE_PROVIDER_DETAIL"))));
        assertEquals(0,cards.count());
    }

    @Test
    void lockedAccountCannotSaveStagedPreview() throws Exception {
        Preview preview=preview();
        owner.setLocked(true);
        owner.setTokenVersion(owner.getTokenVersion()+1);
        users.saveAndFlush(owner);
        httpCommit(deck.getId(),select(preview,1),token).andExpect(status().isUnauthorized());
        assertEquals(0,cards.count());
    }

    @Test
    void commitAndBatchStatusRollBackTogether() {
        Preview preview=preview();
        var transaction=new org.springframework.transaction.support.TransactionTemplate(transactions);
        assertThrows(IllegalStateException.class,() -> transaction.execute(status -> {
            store.commit(owner.getId(),deck.getId(),select(preview,2));
            throw new IllegalStateException("Simulated failure before commit");
        }));
        assertEquals(0,cards.count());
        assertEquals("READY",batches.findById(preview.generationId()).orElseThrow().getStatus());
    }

    @ParameterizedTest
    @ValueSource(strings={"disabled","invalid-provider"})
    void disabledOrInvalidProviderDoesNotDispatch(String source) {
        settings.setProvider(source);
        assertEquals("AI_NOT_CONFIGURED",assertThrows(AiException.class,this::preview).getCode());
        assertEquals(0,calls.get());
        assertEquals(0,batches.count());
    }

    @Test
    void stalePendingRequestIsNeverSentAgainAfterLeaseExpires() {
        settings.setProvider("openai");
        String key=UUID.randomUUID().toString();
        Preview original=generation.preview(owner.getId(),deck.getId(),request(key));
        var batch=batches.findById(original.generationId()).orElseThrow();
        batch.setStatus("PENDING");
        batch.setLeaseUntil(LocalDateTime.now(ZoneOffset.UTC).minusMinutes(1));
        batches.saveAndFlush(batch);
        assertEquals("AI_GENERATION_FAILED",assertThrows(AiException.class,
                () -> generation.preview(owner.getId(),deck.getId(),request(key))).getCode());
        assertEquals(1,calls.get());
        preview();
        assertEquals(2,calls.get());
    }

    @Test
    void unauthorizedAndLockedUsersNeverInvokeProviders() throws Exception {
        settings.setProvider("openai");
        mvc.perform(post("/api/decks/"+deck.getId()+"/ai/preview").contentType("application/json").content(json.writeValueAsString(request(UUID.randomUUID().toString()))))
                .andExpect(status().isUnauthorized());
        httpPreview(deck.getId(),request(UUID.randomUUID().toString()),"Bearer "+jwt.generateToken(other.getEmail()))
                .andExpect(status().isForbidden());
        owner.setLocked(true);
        users.saveAndFlush(owner);
        httpPreview(deck.getId(),request(UUID.randomUUID().toString()),token).andExpect(status().isUnauthorized());
        assertEquals(0,calls.get());
        assertEquals(0,batches.count());
    }

    @Test
    void anotherUserOrDeckCannotCommitSomeoneElsesPreview() throws Exception {
        Preview preview=preview();
        httpCommit(deck.getId(),select(preview,1),"Bearer "+jwt.generateToken(other.getEmail())).andExpect(status().isForbidden());
        httpCommit(another.getId(),select(preview,1),"Bearer "+jwt.generateToken(other.getEmail())).andExpect(status().isNotFound());
        deck.setDeleted(true);
        decks.saveAndFlush(deck);
        httpCommit(deck.getId(),select(preview,1),token).andExpect(status().isForbidden());
        assertEquals(0,cards.count());
    }

    @Test
    void legacyEndpointRequiresPreviewAndManualAddStillWorksWithoutDuplicates() throws Exception {
        mvc.perform(post("/api/decks/"+deck.getId()+"/generate-ai").header("Authorization",token).contentType("application/json").content("{\"prompt\":\"Travel\"}"))
                .andExpect(status().isGone()).andExpect(jsonPath("$.code").value("AI_PREVIEW_REQUIRED"));
        for (int i=0;i<2;i++) {
            mvc.perform(post("/api/decks/"+deck.getId()+"/flashcards").header("Authorization",token).contentType("application/json")
                    .content("{\"vocabulary\":\"Manual word\",\"meaning\":\"từ thủ công\"}"))
                    .andExpect(status().is(i==0 ? 200 : 409));
        }
        assertEquals(1,cards.count());
    }

    @ParameterizedTest
    @ValueSource(booleans={true,false})
    void concurrentCommitsAreAtomicAndDoNotDuplicate(boolean sameBatch) throws Exception {
        Preview first=preview();
        Preview second=sameBatch ? first : preview();
        ExecutorService executor=Executors.newFixedThreadPool(2);
        CountDownLatch start=new CountDownLatch(1);
        try {
            var a=executor.submit(() -> {
                start.await();
                try { return store.commit(owner.getId(),deck.getId(),select(first,2)); }
                catch (AiException e) { assertEquals("DUPLICATE_FLASHCARD",e.getCode()); return null; }
            });
            var b=executor.submit(() -> {
                start.await();
                try { return store.commit(owner.getId(),deck.getId(),select(second,2)); }
                catch (AiException e) { assertEquals("DUPLICATE_FLASHCARD",e.getCode()); return null; }
            });
            start.countDown();
            var resultA=a.get(15,TimeUnit.SECONDS);
            var resultB=b.get(15,TimeUnit.SECONDS);
            assertEquals(2,cards.count());
            assertTrue(resultA != null || resultB != null);
            if (sameBatch) assertEquals(json.valueToTree(resultA),json.valueToTree(resultB));
        } finally { executor.shutdownNow(); }
    }

    @Test
    void concurrentQuotaRequestsCannotExceedGlobalLimit() throws Exception {
        settings.setDailyGlobalLimit(1);
        ExecutorService executor=Executors.newFixedThreadPool(2);
        CountDownLatch start=new CountDownLatch(1);
        try {
            Callable<Boolean> a=() -> {
                start.await();
                try { generation.preview(owner.getId(),deck.getId(),request(UUID.randomUUID().toString())); return true; }
                catch (AiException e) { assertEquals("APPLICATION_GLOBAL_LIMIT",e.getCode()); return false; }
            };
            Callable<Boolean> b=() -> {
                start.await();
                try { generation.preview(other.getId(),another.getId(),request(UUID.randomUUID().toString())); return true; }
                catch (AiException e) { assertEquals("APPLICATION_GLOBAL_LIMIT",e.getCode()); return false; }
            };
            var first=executor.submit(a);var second=executor.submit(b);
            start.countDown();
            assertNotEquals(first.get(15,TimeUnit.SECONDS),second.get(15,TimeUnit.SECONDS));
            assertEquals(1,batches.count());
        } finally { executor.shutdownNow(); }
    }

    @Test
    void sameInFlightRequestCannotDispatchAnotherProviderCall() throws Exception {
        settings.setProvider("openai");
        CountDownLatch entered=new CountDownLatch(1);
        CountDownLatch finish=new CountDownLatch(1);
        doAnswer(invocation -> {
            calls.incrementAndGet();entered.countDown();
            if (!finish.await(10,TimeUnit.SECONDS)) throw new IllegalStateException("test timeout");
            return new ProviderResult(fakeCards(),null,null,1);
        }).when(openai).generate(any(),anyList());
        ExecutorService executor=Executors.newSingleThreadExecutor();
        var request=request(UUID.randomUUID().toString());
        try {
            var first=executor.submit(() -> generation.preview(owner.getId(),deck.getId(),request));
            assertTrue(entered.await(10,TimeUnit.SECONDS));
            assertEquals("GENERATION_IN_PROGRESS",assertThrows(AiException.class,() -> generation.preview(owner.getId(),deck.getId(),request)).getCode());
            assertEquals("APPLICATION_CONCURRENT_LIMIT",assertThrows(AiException.class,this::preview).getCode());
            finish.countDown();first.get(15,TimeUnit.SECONDS);
            assertEquals(1,calls.get());
        } finally { finish.countDown();executor.shutdownNow(); }
    }
    @Test
    void geminiStagesValidNonDuplicateCardsAndCommitsSelectedOnly() {
        settings.setProvider("gemini");
        cards.save(Flashcard.builder().deck(deck).vocabulary("passport").meaning("hộ chiếu").build());
        var generated=new ArrayList<>(fakeCards());
        generated.add(fakeCards().get(1));
        generated.add(new Card("not_English_123","từ không hợp lệ",null,"Invalid vocabulary example."));
        when(gemini.generate(any(),anyList())).thenReturn(new ProviderResult(generated,120L,220L,1));
        var req=request(UUID.randomUUID().toString());
        var preview=generation.preview(owner.getId(),deck.getId(),req);
        assertEquals("GEMINI",preview.source());assertEquals(1,cards.count());
        assertEquals(4,preview.validCount());assertEquals(2,preview.duplicatesExcluded());assertEquals(1,preview.invalidExcluded());
        assertEquals("GEMINI",batches.findById(preview.generationId()).orElseThrow().getSource());
        assertEquals(preview,generation.preview(owner.getId(),deck.getId(),req));
        var committed=store.commit(owner.getId(),deck.getId(),select(preview,2));
        assertEquals(2,committed.savedCount());assertEquals(3,cards.count());
        verify(gemini,times(1)).generate(any(),anyList());verify(openai,never()).generate(any(),anyList());
    }

    @Test
    void failedGeminiNeverFallsBackButExplicitOfflineUsesNewRequestAndSameQuota() throws Exception {
        settings.setProvider("gemini");
        when(gemini.generate(any(),anyList())).thenThrow(new AiException(429,"GEMINI_INSUFFICIENT_QUOTA"));
        var req=request(UUID.randomUUID().toString());
        assertEquals("GEMINI_INSUFFICIENT_QUOTA",assertThrows(AiException.class,()->generation.preview(owner.getId(),deck.getId(),req)).getCode());
        assertEquals(0,cards.count());assertEquals("FAILED",batches.findAll().get(0).getStatus());
        assertEquals("GENERATION_REQUEST_CONFLICT",assertThrows(AiException.class,()->generation.offlinePreview(owner.getId(),deck.getId(),req)).getCode());
        mvc.perform(post("/api/decks/"+deck.getId()+"/ai/preview/offline").header("Authorization",token)
                .contentType("application/json").content(json.writeValueAsString(request(UUID.randomUUID().toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.source").value("DEMO_LIBRARY"));
        assertEquals(2,batches.count());assertEquals(0,cards.count());verify(openai,never()).generate(any(),anyList());
        settings.setDailyUserLimit(2);
        assertEquals("APPLICATION_DAILY_LIMIT",assertThrows(AiException.class,()->generation.offlinePreview(owner.getId(),deck.getId(),request(UUID.randomUUID().toString()))).getCode());
    }

    @Test
    void offlineRoutePreservesOwnershipAndDisabledPolicy() throws Exception {
        mvc.perform(post("/api/decks/"+another.getId()+"/ai/preview/offline").header("Authorization",token)
                .contentType("application/json").content(json.writeValueAsString(request(UUID.randomUUID().toString())))).andExpect(status().isForbidden());
        settings.setEnabled(false);
        assertEquals("AI_NOT_CONFIGURED",assertThrows(AiException.class,()->generation.offlinePreview(owner.getId(),deck.getId(),request(UUID.randomUUID().toString()))).getCode());
        assertEquals(0,batches.count());verify(gemini,never()).generate(any(),anyList());
    }

    @Test
    void preGeminiBatchFingerprintRemainsReplayableForSameSource() throws Exception {
        settings.setProvider("openai");
        var req=request(UUID.randomUUID().toString());
        var first=generation.preview(owner.getId(),deck.getId(),req);
        var batch=batches.findById(first.generationId()).orElseThrow();
        String oldPayload=json.writeValueAsString(List.of(deck.getId(),new Spec("Travel","B1",5,"MIXED","")));
        batch.setRequestFingerprint(HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                .digest(oldPayload.getBytes(java.nio.charset.StandardCharsets.UTF_8))));
        batches.save(batch);
        assertEquals(first,generation.preview(owner.getId(),deck.getId(),req));
        assertEquals(1,calls.get());
        settings.setProvider("gemini");
        assertEquals("GENERATION_REQUEST_CONFLICT",assertThrows(AiException.class,()->generation.preview(owner.getId(),deck.getId(),req)).getCode());
        verify(gemini,never()).generate(any(),anyList());
    }

    @ParameterizedTest
    @EnumSource(AiGenerationSource.class)
    void actualSqlSourceStatusChecksAllowHttpPreviewEditCommitForEveryProvider(AiGenerationSource source) throws Exception {
        // Hibernate-generated String columns alone cannot expose a stale deployed CHECK.
        // Install the CHECK clauses extracted from the real clean-install SQL into the H2 test schema.
        String ddl=AiSchemaConstraintIntegrationTest.read("database.sql");
        for(String check:List.of("CK_ai_source","CK_ai_status"))
            jdbc.execute("ALTER TABLE ai_generation_batches ADD CONSTRAINT "+check+" CHECK("+AiSchemaConstraintIntegrationTest.expression(ddl,check)+")");
        try {
            settings.setProvider(source.name());
            var request=request(UUID.randomUUID().toString());
            String payload=httpPreview(deck.getId(),request,token).andExpect(status().isOk())
                    .andExpect(jsonPath("$.source").value(source.name())).andReturn().getResponse().getContentAsString();
            var preview=json.readValue(payload,Preview.class);
            assertEquals(0,cards.count());
            var staged=batches.findById(preview.generationId()).orElseThrow();
            assertEquals(source.name(),staged.getSource());assertEquals("READY",staged.getStatus());
            var original=preview.cards().get(0);
            var edited=new Candidate(original.candidateId(),"travel document","giấy tờ du lịch",null,"Keep your travel document safe.");
            var selection=new CommitRequest(preview.generationId(),List.of(edited,preview.cards().get(1)));
            httpCommit(deck.getId(),selection,token).andExpect(status().isOk()).andExpect(jsonPath("$.savedCount").value(2));
            assertEquals(2,cards.count());assertTrue(cards.findAll().stream().anyMatch(c->c.getVocabulary().equals("travel document")));
            assertEquals("COMMITTED",batches.findById(preview.generationId()).orElseThrow().getStatus());
            httpCommit(deck.getId(),selection,token).andExpect(status().isOk());assertEquals(2,cards.count());
            httpPreview(deck.getId(),request,token).andExpect(status().isOk()).andExpect(jsonPath("$.generationId").value(preview.generationId()));
            if(source==AiGenerationSource.GEMINI)verify(openai,never()).generate(any(),anyList());
            if(source==AiGenerationSource.OPENAI)verify(gemini,never()).generate(any(),anyList());
            if(source==AiGenerationSource.DEMO_LIBRARY){verify(openai,never()).generate(any(),anyList());verify(gemini,never()).generate(any(),anyList());}
        } finally {
            jdbc.execute("ALTER TABLE ai_generation_batches DROP CONSTRAINT CK_ai_source");
            jdbc.execute("ALTER TABLE ai_generation_batches DROP CONSTRAINT CK_ai_status");
        }
    }

    @Test
    void providerRegistryAndConfigurationExactlyMatchThePersistedSourceEnum() {
        var expected=Arrays.stream(AiGenerationSource.values()).map(Enum::name).collect(java.util.stream.Collectors.toSet());
        var actual=registeredProviders.stream().map(com.example.demo.flashcard.ai.provider.FlashcardGenerationProvider::source)
                .collect(java.util.stream.Collectors.toSet());
        assertEquals(expected,actual);
        for(var source:AiGenerationSource.values()){settings.setProvider(source.name());assertEquals(source.name(),settings.source());}
        settings.setProvider("DISABLED");assertEquals("DISABLED",settings.source());
        assertFalse(expected.contains("DISABLED"));
    }
}
