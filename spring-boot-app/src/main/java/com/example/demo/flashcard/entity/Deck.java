package com.example.demo.flashcard.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "decks")
public class Deck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;

    public Deck() {
    }

    @Builder
    public Deck(Long id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
}
