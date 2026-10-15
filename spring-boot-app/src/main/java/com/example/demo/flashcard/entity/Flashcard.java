package com.example.demo.flashcard.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "flashcards")
public class Flashcard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "deck_id")
    private Deck deck;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String vocabulary;
    @Column(columnDefinition = "NVARCHAR(255)")
    private String meaning;
    @Column(columnDefinition = "NVARCHAR(255)")
    private String phonetic;
    @Column(columnDefinition = "TEXT")
    private String exampleSentence;

    public Flashcard() {
    }

    @Builder
    public Flashcard(Long id, Deck deck, String vocabulary, String meaning, String phonetic, String exampleSentence) {
        this.id = id;
        this.deck = deck;
        this.vocabulary = vocabulary;
        this.meaning = meaning;
        this.phonetic = phonetic;
        this.exampleSentence = exampleSentence;
    }
}
