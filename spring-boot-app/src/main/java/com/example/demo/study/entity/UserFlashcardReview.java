package com.example.demo.study.entity;

import com.example.demo.user.entity.User;
import com.example.demo.flashcard.entity.Flashcard;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "user_flashcard_reviews")
public class UserFlashcardReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "flashcard_id")
    private Flashcard flashcard;

    private LocalDateTime nextReviewDate;
    private int repetitionCount;
    private double easeFactor; // For spaced repetition algorithms like SM-2
    private int intervalDays; // Number of days before the next review

    public UserFlashcardReview() {
    }

    @Builder
    public UserFlashcardReview(Long id, User user, Flashcard flashcard, LocalDateTime nextReviewDate, int repetitionCount, double easeFactor, int intervalDays) {
        this.id = id;
        this.user = user;
        this.flashcard = flashcard;
        this.nextReviewDate = nextReviewDate;
        this.repetitionCount = repetitionCount;
        this.easeFactor = easeFactor;
        this.intervalDays = intervalDays;
    }
}
