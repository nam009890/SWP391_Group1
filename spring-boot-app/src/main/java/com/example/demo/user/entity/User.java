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

    private String role; // e.g. ROLE_USER, ROLE_ADMIN
}
