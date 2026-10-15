package com.example.demo.flashcard.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class FlashcardResponse {
    private Long id;
    private Long deckId;
    private String vocabulary;
    private String meaning;
    private String phonetic;
    private String exampleSentence;

    public FlashcardResponse() {
    }

    @Builder
    public FlashcardResponse(Long id, Long deckId, String vocabulary, String meaning, String phonetic, String exampleSentence) {
        this.id = id;
        this.deckId = deckId;
        this.vocabulary = vocabulary;
        this.meaning = meaning;
        this.phonetic = phonetic;
        this.exampleSentence = exampleSentence;
    }
}
