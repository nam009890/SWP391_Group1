package com.example.demo.flashcard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeckDto {
    private Long id;
    private String name;
    private String description;
    private Long flashcardCount;
}
