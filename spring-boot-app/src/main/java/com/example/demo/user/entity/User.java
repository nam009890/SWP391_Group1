package com.example.demo.user.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
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

    private String role; // e.g. ROLE_USER, ROLE_ADMIN

    public User() {
    }

    @Builder
    public User(Long id, String email, String name, String avatarUrl, String password, String provider, String providerId, String role) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.password = password;
        this.provider = provider;
        this.providerId = providerId;
        this.role = role;
    }
}
