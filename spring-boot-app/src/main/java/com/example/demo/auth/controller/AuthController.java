package com.example.demo.auth.controller;
import com.example.demo.auth.dto.*;
import com.example.demo.common.security.*;
import com.example.demo.common.exception.*;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.user.dto.ProfileDtos.Profile;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider tokens;
    private final jakarta.persistence.EntityManager entityManager;
    @PostMapping("/logout") @Transactional
    public ResponseEntity<Void> logout(@CurrentUser UserPrincipal principal) {
        User user=users.findForUpdate(principal.getId()).orElseThrow();
        entityManager.refresh(user,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        user.setTokenVersion(user.getTokenVersion()+1);
        users.saveAndFlush(user);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/me") public Profile me(@CurrentUser UserPrincipal principal) {
        return Profile.from(users.findById(principal.getId()).orElseThrow());
    }
    @PostMapping("/login") @Transactional
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest body) {
        User u = users.findByEmail(body.getEmail() == null ? "" : body.getEmail().trim()).orElse(null);
        if (u != null) {
            u = users.findForUpdate(u.getId()).orElseThrow();
            entityManager.refresh(u, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        }
        // Chỉ thông báo khóa sau khi đã xác minh mật khẩu, tránh dò trạng thái tài khoản.
        String hash = u == null || u.getPassword() == null ? "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" : u.getPassword();
        boolean matches = encoder.matches(body.getPassword() == null ? "" : body.getPassword(), hash);
        if (u == null || !"LOCAL".equals(u.getProvider()) || !matches) throw new BadCredentialsException("Invalid credentials");
        if (u.isLocked()) throw new BusinessException(403,"ACCOUNT_LOCKED","Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        u.setLastLoginAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        users.saveAndFlush(u);
        return ResponseEntity.ok(new AuthResponse(tokens.generateToken(u.getEmail()),u.getName(),u.getEmail()));
    }
    @PostMapping("/register") @Transactional
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest body) {
        String email = body.getEmail() == null ? "" : body.getEmail().trim();
        String name = body.getName() == null ? "" : body.getName().trim();
        if (email.length() > 255 || !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+") || name.length() < 2 || name.length() > 100) {
            throw new IllegalArgumentException("Email hoặc tên không hợp lệ");
        }
        com.example.demo.user.service.ProfileService.validatePassword(body.getPassword());
        if (users.findByEmail(email).isPresent()) throw new BusinessException(409,"EMAIL_EXISTS","Email đã được sử dụng");
        User u = users.saveAndFlush(User.builder().email(email).name(name).password(encoder.encode(body.getPassword()))
                .provider("LOCAL").role("ROLE_USER").build());
        return ResponseEntity.ok(new AuthResponse(tokens.generateToken(email),u.getName(),u.getEmail()));
    }
}
