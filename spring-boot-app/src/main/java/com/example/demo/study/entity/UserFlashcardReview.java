package com.example.demo.study.entity;

import com.example.demo.user.entity.User;
import com.example.demo.flashcard.entity.Flashcard;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
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
}
