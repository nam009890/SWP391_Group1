package com.swp391.evms.exception;

public class NoReviewableVocabularyException extends RuntimeException {
    public NoReviewableVocabularyException() { super("No weak vocabulary has a suitable example for fill-in-the-blank practice."); }
}
