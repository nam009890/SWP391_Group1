package com.example.demo.auth;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

class DemoAccountPasswordTest {
    private static final String DEMO_PASSWORD_HASH =
            "$2a$10$5jJSpWMyRZqmeEn9exHWCOtupH0dBCPoOPqqTK/RyvZFqCA2RRhuy";

    @Test
    void seededDemoPasswordMatchesDocumentedPassword() {
        assertTrue(new BCryptPasswordEncoder().matches("password", DEMO_PASSWORD_HASH));
    }
}
