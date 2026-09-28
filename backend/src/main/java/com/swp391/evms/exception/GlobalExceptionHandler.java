package com.swp391.evms.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.OffsetDateTime;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiErrorResponse> notFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }
    @ExceptionHandler(NoReviewableVocabularyException.class)
    ResponseEntity<ApiErrorResponse> unprocessable(NoReviewableVocabularyException ex, HttpServletRequest request) {
        return response(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), request);
    }
    @ExceptionHandler(ReviewItemAlreadyAnsweredException.class)
    ResponseEntity<ApiErrorResponse> conflict(ReviewItemAlreadyAnsweredException ex, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, ex.getMessage(), request);
    }
    @ExceptionHandler({InvalidReviewSessionException.class, MethodArgumentNotValidException.class, ConstraintViolationException.class})
    ResponseEntity<ApiErrorResponse> badRequest(Exception ex, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }
    private ResponseEntity<ApiErrorResponse> response(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(OffsetDateTime.now(), status.value(),
            status.getReasonPhrase(), message, request.getRequestURI()));
    }
}
