package com.example.demo.weakvocabulary.entity;
import com.example.demo.flashcard.entity.Flashcard; import com.example.demo.user.entity.User; import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name="user_weak_vocabularies", uniqueConstraints=@UniqueConstraint(columnNames={"user_id","flashcard_id"}))
public class UserWeakVocabulary {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
 @ManyToOne(optional=false) @JoinColumn(name="flashcard_id") private Flashcard flashcard;
 @Builder.Default private boolean manualMarked=false; @Builder.Default private boolean autoDetected=false;
 @Builder.Default private int masteryScore=0; @Builder.Default private int totalAttempts=0; @Builder.Default private int correctCount=0; @Builder.Default private int wrongCount=0; @Builder.Default private int consecutiveWrong=0;
 private Integer lastStudyQuality; @Column(columnDefinition="NVARCHAR(MAX)") private String weakNote; @Builder.Default private boolean weakDeleted=false; private LocalDateTime weakDeletedAt; private LocalDateTime lastPracticedAt; @Builder.Default private LocalDateTime createdAt=LocalDateTime.now(); @Builder.Default private LocalDateTime updatedAt=LocalDateTime.now();
 @PreUpdate void touch(){updatedAt=LocalDateTime.now();}
}
