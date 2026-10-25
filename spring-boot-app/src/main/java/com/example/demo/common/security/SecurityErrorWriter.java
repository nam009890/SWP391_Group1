package com.example.demo.common.security;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
public final class SecurityErrorWriter {
    private static final ObjectMapper JSON = new ObjectMapper();
    private SecurityErrorWriter() {}
    public static void write(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        JSON.writeValue(response.getWriter(), Map.of("status",status,"error",status == 401 ? "Unauthorized" : "Forbidden",
                "code",code,"message",message,"timestamp",LocalDateTime.now(ZoneOffset.UTC).toString()));
    }
}
