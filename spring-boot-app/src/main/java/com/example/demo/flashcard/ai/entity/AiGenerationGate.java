package com.example.demo.flashcard.ai.entity;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "ai_generation_gate")
@Getter
@Setter
@NoArgsConstructor
public class AiGenerationGate {
    @Id private Long id;
}
