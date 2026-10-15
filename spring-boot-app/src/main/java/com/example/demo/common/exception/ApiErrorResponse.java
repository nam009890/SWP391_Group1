package com.example.demo.common.exception;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApiErrorResponse {
    private int status;
    private String error;
    private String message;
    private LocalDateTime timestamp;

    public ApiErrorResponse() {
    }

    @Builder
    public ApiErrorResponse(int status, String error, String message, LocalDateTime timestamp) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = timestamp;
    }
}

