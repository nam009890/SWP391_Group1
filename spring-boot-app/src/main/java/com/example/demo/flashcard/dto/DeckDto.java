package com.example.demo.flashcard.dto;

import lombok.Data;

@Data
public class DeckDto {
    private Long id;
    private String name;
    private String description;
    private Long flashcardCount;

    public DeckDto() {
    }

    public DeckDto(Long id, String name, String description, Long flashcardCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.flashcardCount = flashcardCount;
    }
}
