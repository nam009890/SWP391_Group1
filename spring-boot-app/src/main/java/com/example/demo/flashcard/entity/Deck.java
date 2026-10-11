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
@Table(name = "decks")
public class Deck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String name;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private com.example.demo.user.entity.User user;

    @Column(name = "is_public", nullable = false, columnDefinition = "bit default 0")
    @Builder.Default
    private boolean isPublic = false;

    @OneToMany(mappedBy = "deck", cascade = CascadeType.REMOVE)
    private java.util.List<Flashcard> flashcards;
}
