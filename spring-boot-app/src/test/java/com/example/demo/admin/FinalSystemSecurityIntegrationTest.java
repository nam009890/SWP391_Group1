package com.example.demo.admin;

import com.example.demo.demo.DemoDataInitializer;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.common.security.JwtTokenProvider;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.DefaultApplicationArguments;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:finalqa;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false","app.demo.seed-enabled=true"})
@AutoConfigureMockMvc @ActiveProfiles("demo")
class FinalSystemSecurityIntegrationTest {
    private static final String PASSWORD="Qa9"+UUID.randomUUID();
    @DynamicPropertySource static void secrets(DynamicPropertyRegistry r) {
        for(String key:List.of("DEMO_ADMIN_PASSWORD","DEMO_LEARNER_PASSWORD","DEMO_LOCKED_PASSWORD"))r.add(key,()->PASSWORD);
    }
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired DemoDataInitializer seed;
    @Autowired JwtTokenProvider jwt;
    String bearer(String email){return "Bearer "+jwt.generateToken(email);}
    @Test void provisionedRolesAndLockedAccountAreCorrectAndRepeatIsSafe() {
        assertEquals(4,users.count());
        var admin=users.findByEmail("admin@studye.test").orElseThrow();assertEquals("ROLE_ADMIN",admin.getRole());
        assertTrue(users.findByEmail("locked@studye.test").orElseThrow().isLocked());
        String hash=admin.getPassword();seed.run(new DefaultApplicationArguments());
        assertEquals(hash,users.findById(admin.getId()).orElseThrow().getPassword());assertEquals(4,users.count());
    }
    @Test void demoAdminCanAuthenticateAndLearnerCannotAccessAdmin() throws Exception {
        String body=new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(Map.of("email","admin@studye.test","password",PASSWORD));
        mvc.perform(post("/api/auth/login").contentType("application/json").content(body)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/dashboard").header("Authorization",bearer("learner1@studye.test"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/login").contentType("application/json").content(body.replace("admin@studye.test","locked@studye.test")))
            .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
    }
    @Test void logoutRevokesTheIssuedTokenOnServer() throws Exception {
        String token=bearer("learner1@studye.test");
        mvc.perform(post("/api/auth/logout").header("Authorization",token)).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").header("Authorization",token)).andExpect(status().isUnauthorized());
    }
    @Test void accountRecreatedWithSameEmailAndVersionCannotReuseOldJwt() throws Exception {
        var u=users.saveAndFlush(User.builder().email("reset-scenario@studye.test").name("Before").provider("LOCAL").build());
        String token=bearer(u.getEmail()),identity=u.getAuthIdentity();
        users.delete(u);users.flush();
        var recreated=users.saveAndFlush(User.builder().email(u.getEmail()).name("After").provider("LOCAL").build());
        assertNotEquals(identity,recreated.getAuthIdentity());
        mvc.perform(get("/api/auth/me").header("Authorization",token)).andExpect(status().isUnauthorized());
        users.delete(recreated);
    }
    @Test void expiredMalformedAndDeletedUserTokensAreRejected() throws Exception {
        var user=users.saveAndFlush(User.builder().email("expired@studye.test").name("Expiry QA").provider("LOCAL").build());
        java.security.Key key=org.springframework.test.util.ReflectionTestUtils.invokeMethod(jwt,"getSigningKey");
        String expired=io.jsonwebtoken.Jwts.builder().setSubject(user.getEmail()).claim("ver",0).claim("aid",user.getAuthIdentity())
            .setExpiration(new Date(System.currentTimeMillis()-1000)).signWith(key,io.jsonwebtoken.SignatureAlgorithm.HS512).compact();
        mvc.perform(get("/api/auth/me").header("Authorization","Bearer "+expired)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization","Bearer malformed.jwt")).andExpect(status().isUnauthorized());
        String old=bearer(user.getEmail());users.delete(user);users.flush();
        mvc.perform(get("/api/auth/me").header("Authorization",old)).andExpect(status().isUnauthorized());
    }
    @Test void provisionerRefusesToTakeOverAnExistingOrdinaryAccount() {
        var user=users.findByEmail("learner2@studye.test").orElseThrow();
        String hash=user.getPassword();user.setDemoAccount(false);users.saveAndFlush(user);
        try {assertThrows(IllegalStateException.class,()->seed.run(new DefaultApplicationArguments()));
            assertEquals(hash,users.findById(user.getId()).orElseThrow().getPassword());}
        finally {user.setDemoAccount(true);users.saveAndFlush(user);}
    }
    @Test void provisionerCompletesOnlyAnExplicitDemoStubWithoutChangingLearningOwnership() {
        var stub=users.findByEmail("learner1@studye.test").orElseThrow();
        Long id=stub.getId();String identity=stub.getAuthIdentity();
        stub.setPassword(null);users.saveAndFlush(stub);
        seed.run(new DefaultApplicationArguments());
        var provisioned=users.findById(id).orElseThrow();
        assertTrue(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().matches(PASSWORD,provisioned.getPassword()));
        assertEquals(identity,provisioned.getAuthIdentity());assertEquals("ROLE_USER",provisioned.getRole());
    }
}
