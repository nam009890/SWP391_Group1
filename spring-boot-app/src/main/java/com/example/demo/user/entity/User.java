package com.example.demo.user.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
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
}
