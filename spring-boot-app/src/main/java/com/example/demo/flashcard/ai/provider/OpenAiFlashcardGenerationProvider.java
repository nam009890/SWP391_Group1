package com.example.demo.flashcard.ai.provider;

import com.example.demo.flashcard.ai.config.AiProperties;
import com.example.demo.flashcard.ai.dto.AiDtos.*;
import com.example.demo.flashcard.ai.exception.AiException;
import com.example.demo.flashcard.ai.service.AiPromptBuilder;
import com.fasterxml.jackson.databind.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import java.util.*;

@Component
@lombok.extern.slf4j.Slf4j
public class OpenAiFlashcardGenerationProvider implements FlashcardGenerationProvider {
    private final RestClient http;
    private final AiProperties settings;
    private final AiPromptBuilder prompt;
    private final ObjectMapper json;

    public OpenAiFlashcardGenerationProvider(@org.springframework.context.annotation.Lazy @Qualifier("openAiRestClient") RestClient http,
            AiProperties settings, AiPromptBuilder prompt, ObjectMapper json) {
        this.http = http;
        this.settings = settings;
        this.prompt = prompt;
        this.json = json;
    }

    @Override public String source() { return com.example.demo.flashcard.ai.entity.AiGenerationSource.OPENAI.name(); }

    @Override
    public ProviderResult generate(Spec spec, List<String> excluded) {
        if (settings.openAiKey().isBlank() || settings.openAiModel().isBlank()) throw new AiException(503,"AI_NOT_CONFIGURED");
        for (int attempt = 1; attempt <= 2; attempt++) {
            final int current = attempt;
            try {
                Wire result = http.post().uri("https://api.openai.com/v1/responses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .headers(headers -> headers.setBearerAuth(settings.openAiKey()))
                        .body(prompt.request(settings.openAiModel(), settings.outputBudget(), spec, excluded))
                        .exchange((request, response) -> {
                            byte[] body = response.getBody().readNBytes(262145);
                            if (body.length > 262144) throw new AiException(502,"AI_INVALID_RESPONSE");
                            return new Wire(response.getStatusCode().value(), body, response.getHeaders().getFirst("Retry-After"));
                        });
                if (result.status() >= 200 && result.status() < 300) return parse(result.body(), current);
                if (result.status() == 401 || result.status() == 403) {
                    log.warn("AI provider=OPENAI httpStatus={} attempt={} diagnostic=OPENAI_AUTH_ERROR",result.status(),current);
                    throw new AiException(503,"AI_NOT_CONFIGURED");
                }
                boolean quota = quota(result.body());
                log.warn("AI provider=OPENAI httpStatus={} attempt={} diagnostic={}", result.status(),current,quota ? "OPENAI_INSUFFICIENT_QUOTA" : result.status()==429 ? "OPENAI_RATE_LIMIT" : "OPENAI_HTTP_ERROR");
                if (quota) throw new AiException(429,"OPENAI_INSUFFICIENT_QUOTA");
                boolean transientFailure = result.status() == 429 || result.status() >= 500;
                long delay = retryDelay(result.retryAfter());
                if (transientFailure && current == 1 && delay <= 2000) {
                    // Chỉ thử lại một lần khi server đã trả lỗi rõ; không retry timeout có thể đã bị tính phí.
                    Thread.sleep(delay);
                    continue;
                }
                if (result.status() == 429) throw new AiException(429,"OPENAI_RATE_LIMIT");
                if (result.status() >= 500) throw new AiException(503,"AI_PROVIDER_UNAVAILABLE");
                throw new AiException(502,"AI_GENERATION_FAILED");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AiException(503,"AI_PROVIDER_UNAVAILABLE");
            } catch (AiException e) {
                if(e.getProviderAttempts()==null) e.usage(null,null,current);
                throw e;
            } catch (RestClientException e) {
                log.warn("AI provider=OPENAI diagnostic=NETWORK_OR_TIMEOUT attempt={}",current);
                // Không đưa provider exception, header hoặc API key vào log/response.
                throw new AiException(503,"AI_PROVIDER_UNAVAILABLE");
            }
        }
        throw new AiException(503,"AI_PROVIDER_UNAVAILABLE");
    }

    public ProviderResult parse(byte[] body, int attempts) {
        Long inputTokens = null;
        Long outputTokens = null;
        try {
            JsonNode envelope = json.reader().with(DeserializationFeature.FAIL_ON_TRAILING_TOKENS).readTree(body);
            if (envelope == null || !envelope.isObject()) throw new AiException(502,"AI_INVALID_RESPONSE");
            inputTokens = token(envelope.path("usage").path("input_tokens"));
            outputTokens = token(envelope.path("usage").path("output_tokens"));
            if (!"completed".equals(envelope.path("status").asText())) throw new AiException(502,"AI_INVALID_RESPONSE");
            String text = null;
            for (JsonNode item : envelope.path("output")) {
                for (JsonNode content : item.path("content")) {
                    if ("refusal".equals(content.path("type").asText())) throw new AiException(502,"AI_GENERATION_FAILED");
                    if ("output_text".equals(content.path("type").asText())) {
                        if (text != null) throw new AiException(502,"AI_INVALID_RESPONSE");
                        text = content.path("text").textValue();
                    }
                }
            }
            if (text == null || text.isBlank()) throw new AiException(502,"AI_INVALID_RESPONSE");
            List<Card> cards = GeneratedCardParser.parse(json,text);
            var usage = envelope.path("usage");
            return new ProviderResult(cards, inputTokens, outputTokens, attempts);
        } catch (AiException e) {
            throw e.usage(inputTokens,outputTokens,attempts);
        } catch (java.io.IOException | IllegalArgumentException e) {
            throw new AiException(502,"AI_INVALID_RESPONSE").usage(inputTokens,outputTokens,attempts);
        }
    }

    private Long token(JsonNode value) { return value.isIntegralNumber() && value.canConvertToLong() && value.longValue() >= 0 ? value.longValue() : null; }
    private boolean quota(byte[] body) {
        try {
            var tree=json.readTree(body);
            if(tree==null) return false;
            var error=tree.path("error");
            String code=error.path("code").asText(error.path("type").asText());
            return Set.of("insufficient_quota","billing_hard_limit_reached","billing_not_active").contains(code);
        } catch (java.io.IOException e) { return false; }
    }
    private long retryDelay(String value) {
        if (value == null) return 250;
        try { return Math.max(0, Math.multiplyExact(Long.parseLong(value),1000)); }
        catch (NumberFormatException | ArithmeticException e) { return 3000; }
    }
    private record Wire(int status, byte[] body, String retryAfter) {}
}
