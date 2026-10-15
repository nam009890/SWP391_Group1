package com.example.demo.flashcard.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class FlashcardRequest {
    private String vocabulary;
    private String meaning;
    private String phonetic;
    private String exampleSentence;

    public FlashcardRequest() {
    }

    @Builder
    public FlashcardRequest(String vocabulary, String meaning, String phonetic, String exampleSentence) {
        this.vocabulary = vocabulary;
        this.meaning = meaning;
        this.phonetic = phonetic;
        this.exampleSentence = exampleSentence;
    }
}
