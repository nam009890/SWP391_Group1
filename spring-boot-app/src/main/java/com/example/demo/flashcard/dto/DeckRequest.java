package com.example.demo.flashcard.dto;

import com.example.demo.flashcard.entity.DeckVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeckRequest {
    private String name;
    private String description;
    private DeckVisibility visibility;
}
