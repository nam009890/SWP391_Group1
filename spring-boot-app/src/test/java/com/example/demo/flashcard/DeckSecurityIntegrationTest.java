package com.example.demo.flashcard;

import com.example.demo.common.security.JwtTokenProvider;
import com.example.demo.flashcard.entity.*;
import com.example.demo.flashcard.repository.*;
import com.example.demo.study.repository.UserFlashcardReviewRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.weakvocabulary.repository.UserWeakVocabularyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:decks;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect", "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"})
@AutoConfigureMockMvc
@Transactional
class DeckSecurityIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired DeckRepository decks;
    @Autowired FlashcardRepository cards;
    @Autowired UserRepository users;
    @Autowired UserFlashcardReviewRepository reviews;
    @Autowired UserWeakVocabularyRepository weak;
    @Autowired JwtTokenProvider jwt;
    @Autowired ObjectMapper json;
    User a, b;
    Deck published, privateDeck, legacy;
    Flashcard publicCard, privateCard;
    String tokenA, tokenB;

    @BeforeEach void setup() {
        a = users.save(User.builder().email("a@test.local").name("Alice").build());
        b = users.save(User.builder().email("b@test.local").name("Bob").build());
        tokenA = "Bearer " + jwt.generateToken(a.getEmail()); tokenB = "Bearer " + jwt.generateToken(b.getEmail());
        published = decks.save(Deck.builder().name("Alpha public").description("Travel words").owner(a).build());
        privateDeck = decks.save(Deck.builder().name("Secret private").owner(a).visibility(DeckVisibility.PRIVATE).build());
        legacy = decks.save(Deck.builder().name("Legacy community").build());
        publicCard = cards.save(Flashcard.builder().deck(published).vocabulary("travel").meaning("di chuyển").exampleSentence("We travel today.").build());
        privateCard = cards.save(Flashcard.builder().deck(privateDeck).vocabulary("secret").meaning("hidden").build());
        decks.flush();
    }

    @Test void guestListsOnlyPublicDecks() throws Exception {
        mvc.perform(get("/api/decks/public")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
    }
    @Test void guestReadsPublicDeckAndCardsWithoutCreatingProgress() throws Exception {
        mvc.perform(get("/api/decks/public/" + published.getId())).andExpect(status().isOk()).andExpect(jsonPath("$.isOwner").value(false)).andExpect(jsonPath("$.ownerName").value("Alice")).andExpect(jsonPath("$.password").doesNotExist());
        mvc.perform(get("/api/decks/public/" + published.getId() + "/flashcards")).andExpect(status().isOk()).andExpect(jsonPath("$[0].vocabulary").value("travel"));
        assertEquals(0, reviews.count()); assertEquals(0, weak.count());
    }
    @Test void privateDeckIsHiddenFromGuestAndNonOwnerOnAllReadPaths() throws Exception {
        for (String suffix : new String[]{"", "/flashcards"}) {
            mvc.perform(get("/api/decks/public/" + privateDeck.getId() + suffix)).andExpect(status().isNotFound());
            mvc.perform(get("/api/decks/" + privateDeck.getId() + suffix).header("Authorization", tokenB)).andExpect(status().isNotFound());
        }
        mvc.perform(get("/api/study/decks/" + privateDeck.getId() + "/due").header("Authorization", tokenB)).andExpect(status().isNotFound());
    }
    @Test void guestCannotWriteOrAccessPersonalData() throws Exception {
        for (String path : new String[]{"/api/decks", "/api/decks/" + published.getId() + "/flashcards", "/api/study/flashcards/" + publicCard.getId() + "/review", "/api/weak-vocabularies/flashcards/" + publicCard.getId()})
            mvc.perform(post(path).contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/decks/my")).andExpect(status().isUnauthorized());
    }
    @Test void createsPrivateDeckWithJwtOwnerIgnoringSpoofedOwner() throws Exception {
        var result = mvc.perform(post("/api/decks").header("Authorization", tokenB).contentType("application/json").content("{\"name\":\" My Deck \",\"ownerId\":" + a.getId() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.ownerId").value(b.getId())).andExpect(jsonPath("$.visibility").value("PRIVATE")).andReturn();
        Long id = json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        assertEquals(b.getId(), decks.findById(id).orElseThrow().getOwner().getId());
    }
    @Test void rejectsBlankDeckNameAndInvalidVisibility() throws Exception {
        mvc.perform(post("/api/decks").header("Authorization", tokenA).contentType("application/json").content("{\"name\":\"  \"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/decks").header("Authorization", tokenA).contentType("application/json").content("{\"name\":\"x\",\"visibility\":\"INVALID\"}")).andExpect(status().isBadRequest());
    }
    @Test void myDecksExcludeOtherOwnersAndLegacy() throws Exception {
        mvc.perform(get("/api/decks/my").header("Authorization", tokenA)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/decks/my").header("Authorization", tokenB)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }
    @Test void ownerCanEditAndOtherLearnerCannotEditOrGenerateAi() throws Exception {
        mvc.perform(put("/api/decks/" + published.getId()).header("Authorization", tokenA).contentType("application/json").content("{\"name\":\"Updated\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Updated"));
        mvc.perform(put("/api/decks/" + published.getId()).header("Authorization", tokenB).contentType("application/json").content("{\"name\":\"Stolen\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/decks/" + published.getId() + "/generate-ai").header("Authorization", tokenB).contentType("application/json").content("{\"prompt\":\"words\"}")).andExpect(status().isForbidden());
    }
    @Test void onlyOwnerCanAddFlashcards() throws Exception {
        String path = "/api/decks/" + published.getId() + "/flashcards";
        String body = "{\"vocabulary\":\"hello\",\"meaning\":\"xin chao\"}";
        mvc.perform(post(path).header("Authorization", tokenB).contentType("application/json").content(body)).andExpect(status().isForbidden());
        mvc.perform(post(path).header("Authorization", tokenA).contentType("application/json").content(body)).andExpect(status().isOk());
    }
    @Test void publishAndUnpublishTakeEffectImmediately() throws Exception {
        String path = "/api/decks/" + privateDeck.getId() + "/visibility";
        mvc.perform(patch(path).header("Authorization", tokenA).contentType("application/json").content("{\"visibility\":\"PUBLIC\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/decks/public/" + privateDeck.getId())).andExpect(status().isOk());
        mvc.perform(patch(path).header("Authorization", tokenA).contentType("application/json").content("{\"visibility\":\"PRIVATE\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/decks/public/" + privateDeck.getId())).andExpect(status().isNotFound());
        mvc.perform(get("/api/decks/" + privateDeck.getId()).header("Authorization", tokenA)).andExpect(status().isOk());
    }
    @Test void legacyDeckIsPublicAndReadOnly() throws Exception {
        mvc.perform(get("/api/decks/public/" + legacy.getId())).andExpect(status().isOk()).andExpect(jsonPath("$.ownerName").value("Community"));
        mvc.perform(put("/api/decks/" + legacy.getId()).header("Authorization", tokenA).contentType("application/json").content("{\"name\":\"Claim\"}")).andExpect(status().isForbidden());
    }
    @Test void searchSortingPaginationAndCounts() throws Exception {
        mvc.perform(get("/api/decks/public").param("keyword", " TRAVEL ")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].name").value("Alpha public"));
        mvc.perform(get("/api/decks/public").param("sort", "NAME_DESC").param("size", "1")).andExpect(status().isOk()).andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.content[0].name").value("Legacy community"));
        mvc.perform(get("/api/decks/public").param("sort", "MOST_FLASHCARDS")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].flashcardCount").value(1));
    }
    @Test void learnerStudiesAndRecordsOnlyTheirOwnProgress() throws Exception {
        mvc.perform(get("/api/study/decks/" + published.getId() + "/due").header("Authorization", tokenB)).andExpect(status().isOk());
        mvc.perform(post("/api/study/flashcards/" + publicCard.getId() + "/review").header("Authorization", tokenB).contentType("application/json").content("{\"quality\":1}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(b.getId()));
        assertTrue(reviews.findByUserIdAndFlashcardId(a.getId(), publicCard.getId()).isEmpty());
        assertTrue(weak.findByUserIdAndFlashcardId(b.getId(), publicCard.getId()).orElseThrow().isAutoDetected());
    }
    @Test void learnerCanMarkPublicCardButCannotMarkPrivateCard() throws Exception {
        mvc.perform(post("/api/weak-vocabularies/flashcards/" + publicCard.getId()).header("Authorization", tokenB)).andExpect(status().isCreated());
        mvc.perform(post("/api/weak-vocabularies/flashcards/" + privateCard.getId()).header("Authorization", tokenB)).andExpect(status().isNotFound());
        mvc.perform(post("/api/study/flashcards/" + privateCard.getId() + "/review").header("Authorization", tokenB).contentType("application/json").content("{\"quality\":1}")).andExpect(status().isNotFound());
    }
    @Test void unpublishingHidesPreviouslySavedWeakContentAndPractice() throws Exception {
        var result = mvc.perform(post("/api/weak-vocabularies/flashcards/" + publicCard.getId()).header("Authorization", tokenB)).andReturn();
        long weakId = json.readTree(result.getResponse().getContentAsString()).get("weakVocabularyId").asLong();
        var session = mvc.perform(post("/api/weak-vocabularies/practice-sessions").header("Authorization", tokenB).contentType("application/json").content("{\"questionType\":\"MEANING_TO_WORD\",\"weakVocabularyIds\":[" + weakId + "]}")).andExpect(status().isOk()).andReturn();
        long sid = json.readTree(session.getResponse().getContentAsString()).get("sessionId").asLong();
        published.setVisibility(DeckVisibility.PRIVATE); decks.saveAndFlush(published);
        mvc.perform(get("/api/weak-vocabularies").header("Authorization", tokenB)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/weak-vocabularies/practice-sessions/" + sid).header("Authorization", tokenB)).andExpect(status().isNotFound());
    }
    @Test void softDeletePreservesCardsAndLearningHistory() throws Exception {
        mvc.perform(post("/api/study/flashcards/" + publicCard.getId() + "/review").header("Authorization", tokenB).contentType("application/json").content("{\"quality\":4}")).andExpect(status().isOk());
        mvc.perform(delete("/api/decks/" + published.getId()).header("Authorization", tokenA)).andExpect(status().isNoContent());
        mvc.perform(get("/api/decks/public/" + published.getId())).andExpect(status().isNotFound());
        assertTrue(cards.existsById(publicCard.getId())); assertEquals(1, reviews.count());
    }

    @Test void sessionEndpointValidatesJwtAndDoesNotReturnSecrets() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer invalid")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", tokenB)).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(b.getId())).andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test void nonOwnerCannotChangeVisibilityOrDeleteAndSessionRemainsValid() throws Exception {
        mvc.perform(patch("/api/decks/" + published.getId() + "/visibility").header("Authorization", tokenB)
                .contentType("application/json").content("{\"visibility\":\"PRIVATE\"}")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/decks/" + published.getId()).header("Authorization", tokenB)).andExpect(status().isForbidden());
        mvc.perform(get("/api/auth/me").header("Authorization", tokenB)).andExpect(status().isOk());
    }

    @Test void personalWeakDataCannotBeModifiedByAnotherUser() throws Exception {
        var result = mvc.perform(post("/api/weak-vocabularies/flashcards/" + publicCard.getId()).header("Authorization", tokenB))
                .andExpect(status().isCreated()).andReturn();
        long id = json.readTree(result.getResponse().getContentAsString()).get("weakVocabularyId").asLong();
        mvc.perform(patch("/api/weak-vocabularies/" + id).header("Authorization", tokenA).contentType("application/json")
                .content("{\"weakNote\":\"stolen\"}")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/weak-vocabularies/" + id).header("Authorization", tokenA)).andExpect(status().isNotFound());
    }

    @Test void privateVocabularyCannotLeakAsPracticeDistractor() throws Exception {
        var result = mvc.perform(post("/api/weak-vocabularies/flashcards/" + publicCard.getId()).header("Authorization", tokenB)).andReturn();
        long id = json.readTree(result.getResponse().getContentAsString()).get("weakVocabularyId").asLong();
        mvc.perform(post("/api/weak-vocabularies/practice-sessions").header("Authorization", tokenB).contentType("application/json")
                .content("{\"questionType\":\"WORD_TO_MEANING\",\"weakVocabularyIds\":[" + id + "]}"))
                .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("hidden"))));
    }
}
