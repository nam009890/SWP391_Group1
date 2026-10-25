package com.example.demo.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class DemoAccountPasswordTest {
    @Test
    void cleanInstallSeedsApprovedLocalDemoAccountsWithMatchingBcryptPasswords() throws Exception {
        var path=java.nio.file.Path.of("..","db","database.sql");
        if(!java.nio.file.Files.exists(path))path=java.nio.file.Path.of("db","database.sql");
        String sql=java.nio.file.Files.readString(path);
        assertTrue(sql.contains("(N'users',4)"));
        org.junit.jupiter.api.Assertions.assertFalse(sql.contains("SET NOEXEC ON"));
        assertTrue(sql.indexOf("COMMIT TRANSACTION") > sql.indexOf("THROW 51116"),
                "Reset must commit only after all schema and seed checks pass");
        var expected = java.util.Map.of(
                "admin@studye.test", "AdminDemo@123",
                "learner1@studye.test", "LearnerDemo@123",
                "learner2@studye.test", "LearnerDemo@123",
                "locked@studye.test", "LockedDemo@123");
        for (var entry : expected.entrySet()) {
            var row = java.util.regex.Pattern.compile("N'" + java.util.regex.Pattern.quote(entry.getKey())
                    + "',N'[^']*',N'([^']+)'([^\\r\\n]*)").matcher(sql);
            assertTrue(row.find(), entry.getKey());
            assertTrue(org.springframework.security.crypto.bcrypt.BCrypt.checkpw(entry.getValue(), row.group(1)), entry.getKey());
            assertTrue(row.group(2).contains(entry.getKey().startsWith("admin@") ? "N'ROLE_ADMIN'" : "N'ROLE_USER'"));
            if (entry.getKey().startsWith("locked@")) assertTrue(row.group(2).contains(",1,1,@Created"));
        }
    }
}
