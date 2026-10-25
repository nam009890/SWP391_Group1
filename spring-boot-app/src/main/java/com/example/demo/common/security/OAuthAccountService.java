package com.example.demo.common.security;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.LockedException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
@Service @RequiredArgsConstructor
public class OAuthAccountService {
    private final UserRepository users;
    private final EntityManager entityManager;
    private final JwtTokenProvider tokens;
    @Transactional
    public String complete(String email) {
        Long id = users.findByEmail(email).orElseThrow().getId();
        var user = users.findForUpdate(id).orElseThrow();
        // Khóa và đọc lại trước khi lưu lastLoginAt, tránh merge ghi đè thao tác khóa đồng thời.
        entityManager.refresh(user, LockModeType.PESSIMISTIC_WRITE);
        if (user.isLocked()) throw new LockedException("ACCOUNT_LOCKED");
        user.setLastLoginAt(LocalDateTime.now(ZoneOffset.UTC));
        users.saveAndFlush(user);
        return tokens.generateToken(email);
    }
}
