package com.example.demo.flashcard.dto;

import com.example.demo.flashcard.entity.DeckVisibility;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeckResponse {
    private Long id;
    private String name;
    private String description;
    private DeckVisibility visibility;
    private Long ownerId;
    private String ownerName;
    private long flashcardCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @JsonProperty("isOwner")
    private boolean isOwner;
}
