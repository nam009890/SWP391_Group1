package com.example.demo.flashcard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardResponse {
    private Long id;
    private Long deckId;
    private String vocabulary;
    private String meaning;
    private String phonetic;
    private String exampleSentence;
}
