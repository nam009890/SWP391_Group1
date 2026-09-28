package com.swp391.evms.exception;

import java.time.OffsetDateTime;

public record ApiErrorResponse(OffsetDateTime timestamp, int status, String error, String message, String path) {}
