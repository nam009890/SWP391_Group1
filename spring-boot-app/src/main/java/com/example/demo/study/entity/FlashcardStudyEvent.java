package com.example.demo.study.entity;

import com.example.demo.user.entity.User;
import com.example.demo.flashcard.entity.Flashcard;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "flashcard_study_events", uniqueConstraints = @UniqueConstraint(
        name = "UQ_study_event_user_request", columnNames = {"user_id", "request_id"}),
        indexes = @Index(name = "IX_study_event_history", columnList = "user_id,flashcard_id,id"))
public class FlashcardStudyEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;
    @Column(nullable = false)
    private int quality;
    @Column(nullable = false)
    private boolean confidentRecall;
    @Column(name = "request_id", nullable = false, length = 36)
    private String requestId;
    @Column(nullable = false)
    private LocalDateTime reviewedAt;
    // Snapshot trả lại đúng kết quả của request đầu, kể cả khi SM-2 đã thay đổi sau đó.
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String responseJson;
}
