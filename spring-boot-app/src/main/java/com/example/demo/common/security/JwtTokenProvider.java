package com.example.demo.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {
    @org.springframework.beans.factory.annotation.Autowired
    private com.example.demo.user.repository.UserRepository users;
    
    // Cấu hình JWT_SECRET ổn định khi triển khai; dev tạo khóa ngẫu nhiên mỗi lần chạy.
    @org.springframework.beans.factory.annotation.Value("${app.jwt.secret:${JWT_SECRET:}}")
    private String jwtSecret;
    private final Key developmentKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
    private final long jwtExpirationMs = 86400000; // 1 day
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.core.env.Environment environment;

    @jakarta.annotation.PostConstruct
    void validateConfiguration() {
        boolean production=java.util.Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> profile.equals("prod") || profile.equals("production"));
        if(production && (jwtSecret==null || jwtSecret.isBlank()))
            throw new IllegalStateException("Production requires an explicit JWT signing secret.");
        if(jwtSecret!=null && !jwtSecret.isBlank() && jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length<64)
            throw new IllegalStateException("JWT signing secret must contain at least 64 bytes.");
    }

    private Key getSigningKey() {
        return jwtSecret == null || jwtSecret.isBlank() ? developmentKey
                : Keys.hmacShaKeyFor(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public String generateToken(String email) {
        com.example.demo.user.entity.User user = users.findByEmail(email).orElseThrow();
        if (user.isLocked()) throw new org.springframework.security.authentication.LockedException("ACCOUNT_LOCKED");
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(email)
                .claim("ver", user.getTokenVersion())
                .claim("aid", user.getAuthIdentity())
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public long getVersion(String token) {
        Number version = (Number) Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                .parseClaimsJws(token).getBody().get("ver");
        // JWT cũ không có phiên bản phải đăng nhập lại sau khi nâng cấp.
        return version == null ? -1 : version.longValue();
    }

    public String getAuthIdentity(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                .parseClaimsJws(token).getBody().get("aid", String.class);
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception ex) {
            // Không ghi JWT hoặc dữ liệu nhạy cảm vào log.
        }
        return false;
    }

    // One signature/expiry verification per authenticated request; no cross-request auth cache.
    public VerifiedIdentity verifyIdentity(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                .parseClaimsJws(token).getBody();
        Number version = (Number) claims.get("ver");
        return new VerifiedIdentity(claims.getSubject(), version == null ? -1 : version.longValue(),
                claims.get("aid", String.class));
    }

    public record VerifiedIdentity(String email, long version, String authIdentity) {}
}
