package com.example.demo.flashcard.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class DeckResponse {
    private Long id;
    private String name;
    private String description;

    public DeckResponse() {
    }

    @Builder
    public DeckResponse(Long id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
}
