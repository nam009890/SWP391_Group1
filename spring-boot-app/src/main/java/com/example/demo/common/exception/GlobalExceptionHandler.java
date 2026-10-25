package com.example.demo.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import com.example.demo.weakvocabulary.exception.InvalidWeakPracticeException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorResponse> business(BusinessException e) {
        return ResponseEntity.status(e.getStatus()).body(ApiErrorResponse.builder().status(e.getStatus())
                .error(HttpStatus.valueOf(e.getStatus()).getReasonPhrase()).code(e.getCode())
                .message(e.getMessage()).timestamp(LocalDateTime.now(java.time.ZoneOffset.UTC)).build());
    }
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> denied(Exception e) {
        return ResponseEntity.status(403).body(ApiErrorResponse.builder().status(403).error("Forbidden")
                .code("ACCESS_DENIED").message("Bạn không có quyền thực hiện thao tác này").build());
    }
    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> authenticationFailure(Exception e) {
        return ResponseEntity.status(401).body(ApiErrorResponse.builder().status(401).error("Unauthorized")
                .code("INVALID_CREDENTIALS").message("Sai email hoặc mật khẩu, hoặc phiên đăng nhập đã hết hạn").timestamp(LocalDateTime.now(java.time.ZoneOffset.UTC)).build());
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(ResourceNotFoundException e) {
        ApiErrorResponse response = ApiErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase()).code("NOT_FOUND")
                .message(e.getMessage())
                .timestamp(LocalDateTime.now(java.time.ZoneOffset.UTC))
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler({InvalidWeakPracticeException.class, IllegalArgumentException.class,
            org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiErrorResponse> handleBadRequest(Exception e) {
        ApiErrorResponse response = ApiErrorResponse.builder().status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase()).code("INVALID_REQUEST").message(e instanceof IllegalArgumentException || e instanceof InvalidWeakPracticeException ? e.getMessage() : "Invalid request value").timestamp(LocalDateTime.now(java.time.ZoneOffset.UTC)).build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(ResponseStatusException e) {
        HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
        ApiErrorResponse response = ApiErrorResponse.builder()
                .status(status.value())
                .error(status.getReasonPhrase()).code("REQUEST_FAILED")
                .message(e.getReason())
                .timestamp(LocalDateTime.now(java.time.ZoneOffset.UTC))
                .build();
        return new ResponseEntity<>(response, status);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleException(Exception e) {
        // Không đưa exception text (có thể chứa SQL/credential) vào response hoặc log.
        ApiErrorResponse response = ApiErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase()).code("REQUEST_FAILED")
                .message("An unexpected error occurred")
                .timestamp(LocalDateTime.now(java.time.ZoneOffset.UTC))
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
