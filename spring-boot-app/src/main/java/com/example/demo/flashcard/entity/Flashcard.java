package com.example.demo.flashcard.entity;

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
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String exampleSentence;
}
