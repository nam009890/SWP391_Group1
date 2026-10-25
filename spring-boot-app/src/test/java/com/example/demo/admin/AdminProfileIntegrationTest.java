package com.example.demo.admin;

import com.example.demo.common.security.*;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.admin.repository.AdminUserActionLogRepository;
import com.example.demo.flashcard.entity.*;
import com.example.demo.flashcard.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.user.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:adminprofile;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.datasource.driverClassName=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect", "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"})
@AutoConfigureMockMvc
@Transactional
class AdminProfileIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired AdminUserActionLogRepository logs;
    @Autowired DeckRepository decks;
    @Autowired FlashcardRepository cards;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtTokenProvider jwt;
    @Autowired CustomOAuth2UserService oauth;
    @Autowired OAuthAccountService oauthAccounts;
    @Autowired ObjectMapper json;
    @Autowired com.example.demo.admin.service.AdminUserService adminUsers;
    User admin, learner, otherAdmin, google;
    String adminToken, learnerToken;
    final String password = "Password1234";

    @BeforeEach void setup() {
        admin = create("admin@test.local", "Admin", "ROLE_ADMIN", "LOCAL");
        learner = create("alice@test.local", "Alice", "ROLE_USER", "LOCAL");
        otherAdmin = create("admin2@test.local", "Second Admin", "ROLE_ADMIN", "LOCAL");
        google = create("google@test.local", "Google learner", "ROLE_USER", "GOOGLE");
        adminToken = bearer(admin);
        learnerToken = bearer(learner);
        users.flush();
    }
    User create(String email, String name, String role, String provider) {
        return users.save(User.builder().email(email).name(name).role(role).provider(provider)
                .password("LOCAL".equals(provider) ? encoder.encode(password) : null).build());
    }
    String bearer(User u) { return "Bearer " + jwt.generateToken(u.getEmail()); }
    ResultActions login(String email, String pwd) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType("application/json")
                .content(json.writeValueAsString(Map.of("email", email, "password", pwd))));
    }
    ResultActions lock(User u) throws Exception {
        return mvc.perform(patch("/api/admin/users/" + u.getId() + "/lock").header("Authorization",adminToken)
                .contentType("application/json").content("{\"reason\":\"Vi phạm quy định\"}"));
    }
    ResultActions unlock(User u) throws Exception {
        return mvc.perform(patch("/api/admin/users/" + u.getId() + "/unlock").header("Authorization",adminToken));
    }
    OAuth2User identity(User u, boolean verified) {
        return new DefaultOAuth2User(List.of(new SimpleGrantedAuthority("ROLE_USER")),
                Map.of("email",u.getEmail(),"sub","google-sub-123","email_verified",verified,
                        "name","Overwritten name","picture","https://example.com/google.png"),"sub");
    }
    @Test void localLoginAndWrongPassword() throws Exception {
        login(learner.getEmail(),password).andExpect(status().isOk()).andExpect(jsonPath("$.token").isString());
        assertNotNull(users.findById(learner.getId()).orElseThrow().getLastLoginAt());
        login(learner.getEmail(),"wrong").andExpect(status().isUnauthorized());
        login("missing@test.local",password).andExpect(status().isUnauthorized());
    }
    @Test void lockedLocalRequiresCorrectCredentialsBeforeLockError() throws Exception {
        lock(learner).andExpect(status().isOk());
        login(learner.getEmail(),"wrong").andExpect(status().isUnauthorized());
        login(learner.getEmail(),password).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED")).andExpect(jsonPath("$.token").doesNotExist());
        assertThrows(org.springframework.security.authentication.LockedException.class, () -> jwt.generateToken(learner.getEmail()));
    }
    @ParameterizedTest @ValueSource(strings={"/api/admin/dashboard","/api/admin/users","/api/admin/audit-logs"})
    void adminAuthorization(String url) throws Exception {
        mvc.perform(get(url)).andExpect(status().isUnauthorized());
        mvc.perform(get(url).header("Authorization",learnerToken).header("X-Role","ROLE_ADMIN"))
                .andExpect(status().isForbidden());
        mvc.perform(get(url).header("Authorization",adminToken)).andExpect(status().isOk());
    }
    @Test void userCannotLockOrUnlock() throws Exception {
        for (String action : List.of("lock","unlock")) {
            mvc.perform(patch("/api/admin/users/" + google.getId() + "/" + action).header("Authorization",learnerToken)
                    .contentType("application/json").content("{\"reason\":\"test reason\"}"))
                    .andExpect(status().isForbidden());
        }
        assertEquals(0,logs.count());
    }
    @Test void selfAndAdminsProtected() throws Exception {
        lock(admin).andExpect(status().isForbidden());
        lock(otherAdmin).andExpect(status().isForbidden());
        assertEquals(0,logs.count());
    }
    @Test void lockAndUnlockAuditAndRevocation() throws Exception {
        lock(learner).andExpect(status().isOk()).andExpect(jsonPath("$.account.status").value("LOCKED"));
        assertEquals(admin.getId(),users.findById(learner.getId()).orElseThrow().getLockedBy());
        mvc.perform(get("/api/profile/me").header("Authorization",learnerToken)).andExpect(status().isUnauthorized());
        lock(learner).andExpect(status().isConflict());
        assertEquals(1,logs.count());
        unlock(learner).andExpect(status().isOk()).andExpect(jsonPath("$.lockedReason").isEmpty());
        unlock(learner).andExpect(status().isConflict());
        assertEquals(2,logs.count());
        mvc.perform(get("/api/auth/me").header("Authorization",learnerToken)).andExpect(status().isUnauthorized());
        String fresh = json.readTree(login(learner.getEmail(),password).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("token").asText();
        mvc.perform(get("/api/profile/me").header("Authorization","Bearer " + fresh)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/audit-logs").header("Authorization",adminToken).param("targetUserId",learner.getId().toString()).param("action","LOCK_USER"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].adminId").value(admin.getId()));
    }
    @ParameterizedTest @ValueSource(strings={"/api/decks/my","/api/study/decks/1/due","/api/weak-vocabularies","/api/weak-vocabularies/practice-sessions/1","/api/profile/me","/api/auth/me"})
    void lockedJwtCannotAccessProtectedModules(String url) throws Exception {
        lock(learner).andExpect(status().isOk());
        mvc.perform(get(url).header("Authorization",learnerToken)).andExpect(status().isUnauthorized());
        unlock(learner).andExpect(status().isOk());
        mvc.perform(get(url).header("Authorization",learnerToken)).andExpect(status().isUnauthorized());
    }
    @Test void lockedCannotUseGrammarMutationButGuestsRead() throws Exception {
        mvc.perform(get("/api/grammar/groups")).andExpect(status().isOk());
        mvc.perform(post("/api/grammar/groups").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
        lock(learner).andExpect(status().isOk());
        mvc.perform(post("/api/grammar/groups").header("Authorization",learnerToken).contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }
    @Test void learnerCanStillCreateCommunityGroup() throws Exception {
        mvc.perform(post("/api/grammar/groups").header("Authorization",learnerToken).contentType("application/json")
                .content("{\"title\":\"Community test\",\"id\":\"community-integration\"}"))
                .andExpect(status().isOk());
    }
    @Test void safeProfileAndForgedFieldsIgnored() throws Exception {
        mvc.perform(get("/api/profile/me").header("Authorization",learnerToken)).andExpect(status().isOk())
                .andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.providerId").doesNotExist())
                .andExpect(jsonPath("$.tokenVersion").doesNotExist()).andExpect(jsonPath("$.lockedReason").doesNotExist());
        mvc.perform(put("/api/profile/me").header("Authorization",learnerToken).contentType("application/json")
                .content("{\"name\":\"  New Alice  \",\"avatarUrl\":\"https://example.com/a.png\",\"bio\":\"  Hello  \",\"role\":\"ROLE_ADMIN\",\"locked\":true,\"id\":" + admin.getId() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("New Alice"))
                .andExpect(jsonPath("$.bio").value("Hello")).andExpect(jsonPath("$.role").value("ROLE_USER"));
        assertEquals("Admin",users.findById(admin.getId()).orElseThrow().getName());
        assertFalse(users.findById(learner.getId()).orElseThrow().isLocked());
        mvc.perform(get("/api/auth/me").header("Authorization",learnerToken)).andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").value("https://example.com/a.png"));
    }
    @ParameterizedTest @ValueSource(strings={"{\"name\":\"x\"}","{\"name\":\"Alice\",\"avatarUrl\":\"javascript:alert(1)\"}","{\"name\":\"Alice\",\"avatarUrl\":\"https://\"}"})
    void invalidProfileRejected(String body) throws Exception {
        mvc.perform(put("/api/profile/me").header("Authorization",learnerToken).contentType("application/json").content(body)).andExpect(status().isBadRequest());
    }
    @Test void passwordChangeHashesAndRevokes() throws Exception {
        String newPassword="BetterPassword123";
        mvc.perform(put("/api/profile/me/password").header("Authorization",learnerToken).contentType("application/json")
                .content(json.writeValueAsString(Map.of("currentPassword",password,"newPassword",newPassword,"confirmPassword",newPassword))))
                .andExpect(status().isNoContent());
        User saved=users.findById(learner.getId()).orElseThrow();
        assertNotEquals(newPassword,saved.getPassword());
        assertTrue(encoder.matches(newPassword,saved.getPassword()));
        mvc.perform(get("/api/profile/me").header("Authorization",learnerToken)).andExpect(status().isUnauthorized());
        login(learner.getEmail(),password).andExpect(status().isUnauthorized());
        login(learner.getEmail(),newPassword).andExpect(status().isOk());
    }
    @ParameterizedTest @ValueSource(strings={"{\"currentPassword\":\"wrong\",\"newPassword\":\"BetterPassword123\",\"confirmPassword\":\"BetterPassword123\"}",
            "{\"currentPassword\":\"Password1234\",\"newPassword\":\"BetterPassword123\",\"confirmPassword\":\"mismatch\"}",
            "{\"currentPassword\":\"Password1234\",\"newPassword\":\"Password1234\",\"confirmPassword\":\"Password1234\"}",
            "{\"currentPassword\":\"Password1234\",\"newPassword\":\"weak\",\"confirmPassword\":\"weak\"}"})
    void invalidPasswordChange(String body) throws Exception {
        mvc.perform(put("/api/profile/me/password").header("Authorization",learnerToken).contentType("application/json").content(body)).andExpect(status().isBadRequest());
        assertEquals(0,users.findById(learner.getId()).orElseThrow().getTokenVersion());
    }
    @Test void googlePasswordUnsupported() throws Exception {
        mvc.perform(put("/api/profile/me/password").header("Authorization",bearer(google)).contentType("application/json").content("{}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("GOOGLE_PASSWORD_MANAGED"));
    }
    @Test void oauthRejectsLockedAndUnverifiedAccounts() throws Exception {
        lock(google).andExpect(status().isOk());
        OAuth2AuthenticationException error=assertThrows(OAuth2AuthenticationException.class, () -> oauth.linkVerifiedIdentity(identity(google,true)));
        assertEquals("ACCOUNT_LOCKED",error.getError().getErrorCode());
        assertThrows(OAuth2AuthenticationException.class, () -> oauth.linkVerifiedIdentity(identity(learner,false)));
        assertThrows(org.springframework.security.authentication.LockedException.class,
                () -> oauthAccounts.complete(google.getEmail()));
    }
    @Test void oauthSuccessIssuesVersionedTokenAndUpdatesLogin() {
        oauth.linkVerifiedIdentity(identity(google, true));
        String token = oauthAccounts.complete(google.getEmail());
        assertTrue(jwt.validateToken(token));
        assertEquals(google.getTokenVersion(), jwt.getVersion(token));
        assertNotNull(users.findById(google.getId()).orElseThrow().getLastLoginAt());
    }
    @Test void oauthRejectsAutomaticLocalAdminLinkAndPreservesEditedProfile() {
        admin.setAvatarUrl("https://example.com/manual.png");
        admin.setBio("Manual biography");
        users.saveAndFlush(admin);
        var rejected=assertThrows(OAuth2AuthenticationException.class,()->oauth.linkVerifiedIdentity(identity(admin,true)));
        assertEquals("OAUTH_LINK_REQUIRED",rejected.getError().getErrorCode());
        User saved=users.findById(admin.getId()).orElseThrow();
        assertEquals("ROLE_ADMIN",saved.getRole());
        assertEquals("Admin",saved.getName());
        assertEquals("https://example.com/manual.png",saved.getAvatarUrl());
        assertEquals("Manual biography",saved.getBio());
        assertEquals("LOCAL",saved.getProvider());
    }
    @Test void newGoogleUserNeverElevatedByEmail() {
        User input=User.builder().email("buiquangviet032@gmail.com").build();
        User saved=oauth.linkVerifiedIdentity(identity(input,true));
        assertEquals("ROLE_USER",saved.getRole());
        assertEquals("GOOGLE",saved.getProvider());
    }
    @Test void oauthRejectsDifferentSubject() {
        google.setProviderId("another-subject");
        users.saveAndFlush(google);
        assertThrows(OAuth2AuthenticationException.class, () -> oauth.linkVerifiedIdentity(identity(google,true)));
    }
    @Test void searchFiltersPaginationSortAndSafeDetails() throws Exception {
        mvc.perform(get("/api/admin/users").header("Authorization",adminToken).param("keyword"," ALICE ").param("role","ROLE_USER").param("status","ACTIVE"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].name").value("Alice"));
        mvc.perform(get("/api/admin/users").header("Authorization",adminToken).param("role","ROLE_ADMIN").param("sort","NAME_ASC").param("size","1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.content[0].name").value("Admin"));
        lock(learner).andExpect(status().isOk());
        mvc.perform(get("/api/admin/users").header("Authorization",adminToken).param("status","LOCKED"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/admin/users/" + learner.getId()).header("Authorization",adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.lockedReason").isString())
                .andExpect(jsonPath("$.account.password").doesNotExist()).andExpect(jsonPath("$.account.providerId").doesNotExist());
        mvc.perform(get("/api/admin/users/9999999").header("Authorization",adminToken)).andExpect(status().isNotFound());
    }
    @ParameterizedTest @ValueSource(strings={"page=-1","size=0","size=101","sort=password","role=ADMIN","status=INVALID"})
    void invalidListParameters(String query) throws Exception {
        String[] pair=query.split("=");
        mvc.perform(get("/api/admin/users").header("Authorization",adminToken).param(pair[0],pair[1])).andExpect(status().isBadRequest());
    }
    @Test void missingTargetOrInvalidReasonNoAudit() throws Exception {
        mvc.perform(patch("/api/admin/users/9999999/lock").header("Authorization",adminToken).contentType("application/json").content("{\"reason\":\"test reason\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(patch("/api/admin/users/" + learner.getId() + "/lock").header("Authorization",adminToken).contentType("application/json").content("{\"reason\":\"x\"}"))
                .andExpect(status().isBadRequest());
        assertEquals(0,logs.count());
    }
    @Test void dashboardUsesActiveDeckSemantics() throws Exception {
        Deck visible=decks.save(Deck.builder().name("Public").owner(learner).build());
        decks.save(Deck.builder().name("Private").visibility(DeckVisibility.PRIVATE).owner(learner).build());
        Deck deleted=decks.save(Deck.builder().name("Deleted").deleted(true).build());
        cards.save(Flashcard.builder().deck(visible).vocabulary("hello").build());
        cards.save(Flashcard.builder().deck(deleted).vocabulary("hidden").build());
        lock(google).andExpect(status().isOk());
        mvc.perform(get("/api/admin/dashboard").header("Authorization",adminToken)).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(4)).andExpect(jsonPath("$.activeUsers").value(3))
                .andExpect(jsonPath("$.lockedUsers").value(1)).andExpect(jsonPath("$.totalAdmins").value(2))
                .andExpect(jsonPath("$.totalDecks").value(2)).andExpect(jsonPath("$.publicDecks").value(1))
                .andExpect(jsonPath("$.privateDecks").value(1)).andExpect(jsonPath("$.totalFlashcards").value(1));
    }
    @Test void oldDebugEndpointsNoLongerIssueTokens() throws Exception {
        mvc.perform(get("/api/auth/debug-token")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/fix-user")).andExpect(status().isUnauthorized());
    }
    @Test void registrationUsesLearnerRole() throws Exception {
        mvc.perform(post("/api/auth/register").contentType("application/json").content("{\"email\":\"new@test.local\",\"name\":\"New learner\",\"password\":\"Password1234\",\"role\":\"ROLE_ADMIN\"}"))
                .andExpect(status().isOk());
        assertEquals("ROLE_USER",users.findByEmail("new@test.local").orElseThrow().getRole());
    }

    @Test
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void concurrentLockRequestsCreateOnlyOneAuditRecord() throws Exception {
        var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
        var start = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.Callable<Integer> request = () -> {
            start.await();
            try {
                adminUsers.transition(admin.getId(), learner.getId(), true, "Concurrent test reason");
                return 200;
            } catch (com.example.demo.common.exception.BusinessException e) {
                return e.getStatus();
            }
        };
        try {
            var first = executor.submit(request);
            var second = executor.submit(request);
            start.countDown();
            var results = new ArrayList<>(List.of(first.get(15, java.util.concurrent.TimeUnit.SECONDS),
                    second.get(15, java.util.concurrent.TimeUnit.SECONDS)));
            Collections.sort(results);
            assertEquals(List.of(200, 409), results);
            assertEquals(1, logs.count());
            assertEquals(1, users.findById(learner.getId()).orElseThrow().getTokenVersion());
        } finally {
            executor.shutdownNow();
            // Chỉ dọn fixture trong H2 riêng của test, không kết nối database ứng dụng.
            logs.deleteAll();
            users.deleteAllById(List.of(admin.getId(), learner.getId(), otherAdmin.getId(), google.getId()));
        }
    }
}
