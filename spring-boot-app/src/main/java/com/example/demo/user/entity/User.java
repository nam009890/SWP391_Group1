package com.example.demo.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String name;
    private String avatarUrl;
    private String password;

    // GOOGLE or LOCAL
    private String provider;
    
    // Google sub ID
    private String providerId;

    @Builder.Default
    private String role = "ROLE_USER";

    @Builder.Default
    @Column(nullable = false, columnDefinition = "bit default 0")
    private boolean locked = false;
    private java.time.LocalDateTime lockedAt;
    @Column(length = 500, columnDefinition = "NVARCHAR(500)")
    private String lockedReason;
    private Long lockedBy;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private java.time.LocalDateTime lastLoginAt;
    @Column(length = 500, columnDefinition = "NVARCHAR(500)")
    private String bio;
    @Builder.Default
    @Column(nullable = false)
    private long tokenVersion = 0;

    // UUID mới cho mỗi tài khoản, kể cả khi reset DB tái sử dụng email và numeric ID.
    @Builder.Default
    @Column(name = "auth_identity", nullable = false, length = 36, unique = true)
    private String authIdentity = java.util.UUID.randomUUID().toString();

    @Builder.Default
    @Column(name = "demo_account", nullable = false)
    private boolean demoAccount = false;

    @PrePersist
    void created() {
        // Lưu thời gian UTC, không phụ thuộc múi giờ máy chủ.
        createdAt = java.time.LocalDateTime.now(java.time.ZoneOffset.UTC);
        updatedAt = createdAt;
        if (role == null || role.isBlank()) role = "ROLE_USER";
    }

    @PreUpdate
    void updated() {
        updatedAt = java.time.LocalDateTime.now(java.time.ZoneOffset.UTC);
    }
}
