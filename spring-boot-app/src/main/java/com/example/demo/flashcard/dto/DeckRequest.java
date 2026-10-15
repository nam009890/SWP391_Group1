package com.example.demo.flashcard.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class DeckRequest {
    private String name;
    private String description;

    public DeckRequest() {
    }

    @Builder
    public DeckRequest(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
