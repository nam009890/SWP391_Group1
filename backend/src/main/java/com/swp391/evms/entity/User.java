package com.swp391.evms.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    @Column(name = "password_hash") private String passwordHash;
    @Column(name = "full_name") private String fullName;
    @Column(name = "avatar_url") private String avatarUrl;
    @Column(name = "account_status") private String accountStatus;
    @Column(name = "email_verified") private Boolean emailVerified;
    @Column(name = "last_login_at") private OffsetDateTime lastLoginAt;
    @Column(name = "created_at") private OffsetDateTime createdAt;
    @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
