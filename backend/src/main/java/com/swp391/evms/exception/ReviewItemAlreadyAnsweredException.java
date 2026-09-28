package com.swp391.evms.exception;

public class ReviewItemAlreadyAnsweredException extends RuntimeException {
    public ReviewItemAlreadyAnsweredException() { super("This review item has already been answered."); }
}
