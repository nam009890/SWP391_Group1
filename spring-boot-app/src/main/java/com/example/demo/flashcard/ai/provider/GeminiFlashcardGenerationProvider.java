package com.example.demo.flashcard.ai.provider;

import com.example.demo.flashcard.ai.config.AiProperties;
import com.example.demo.flashcard.ai.dto.AiDtos.*;
import com.example.demo.flashcard.ai.exception.AiException;
import com.example.demo.flashcard.ai.service.AiPromptBuilder;
import com.fasterxml.jackson.databind.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import java.util.*;

@Component
@lombok.extern.slf4j.Slf4j
public class GeminiFlashcardGenerationProvider implements FlashcardGenerationProvider {
    private final RestClient http;
    private final AiProperties settings;
    private final AiPromptBuilder prompt;
    private final ObjectMapper json;

    public GeminiFlashcardGenerationProvider(@Lazy @Qualifier("geminiRestClient") RestClient http,
            AiProperties settings, AiPromptBuilder prompt, ObjectMapper json) {
        this.http=http; this.settings=settings; this.prompt=prompt; this.json=json;
    }
    @Override public String source() { return com.example.demo.flashcard.ai.entity.AiGenerationSource.GEMINI.name(); }

    @Override public ProviderResult generate(Spec spec, List<String> excluded) {
        String model=settings.getGemini().getModel();
        if (settings.getGemini().getApiKey().isBlank() || !model.matches("[A-Za-z0-9][A-Za-z0-9._-]{0,99}"))
            throw new AiException(503,"AI_NOT_CONFIGURED");
        for (int attempt=1;attempt<=2;attempt++) {
            try {
                Wire wire=http.post().uri("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("x-goog-api-key",settings.getGemini().getApiKey())
                        .body(prompt.geminiRequest(settings.outputBudget(),spec,excluded))
                        .exchange((request,response)->{
                            byte[] body=response.getBody().readNBytes(262145);
                            if(body.length>262144) throw new AiException(502,"AI_INVALID_RESPONSE");
                            return new Wire(response.getStatusCode().value(),body,response.getHeaders().getFirst("Retry-After"));
                        });
                if(wire.status()>=200 && wire.status()<300) return parse(wire.body(),attempt);
                String code=errorCode(wire.status(),wire.body());
                log.warn("AI provider=GEMINI httpStatus={} attempt={} diagnostic={}",wire.status(),attempt,code);
                long delay=retryDelay(wire.retryAfter(),wire.body());
                if(attempt==1 && (wire.status()==429 || wire.status()>=500)
                        && !code.equals("GEMINI_INSUFFICIENT_QUOTA") && delay<=2000) {
                    Thread.sleep(delay);
                    continue;
                }
                throw new AiException(wire.status()==429?429:wire.status()>=500?503:code.equals("GEMINI_AUTH_ERROR")?503:502,code);
            } catch(InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AiException(503,"AI_PROVIDER_UNAVAILABLE").usage(null,null,attempt);
            } catch(RestClientException e) {
                boolean timeout=false;
                for(Throwable cause=e;cause!=null;cause=cause.getCause())
                    if(cause instanceof java.net.SocketTimeoutException || cause instanceof java.net.http.HttpTimeoutException) timeout=true;
                String code=timeout?"AI_TIMEOUT":"AI_PROVIDER_UNAVAILABLE";
                log.warn("AI provider=GEMINI attempt={} diagnostic={}",attempt,code);
                // Never log exception messages, request headers/URL, key, prompt or provider error body.
                throw new AiException(503,code).usage(null,null,attempt);
            } catch(AiException e) {
                if(e.getProviderAttempts()==null) e.usage(null,null,attempt);
                throw e;
            }
        }
        throw new AiException(503,"AI_PROVIDER_UNAVAILABLE");
    }

    public ProviderResult parse(byte[] body,int attempts) {
        Long input=null,output=null;
        try {
            JsonNode envelope=json.reader().with(DeserializationFeature.FAIL_ON_TRAILING_TOKENS).readTree(body);
            if(envelope==null || !envelope.isObject()) throw new AiException(502,"AI_INVALID_RESPONSE");
            var usage=envelope.path("usageMetadata");
            input=token(usage.path("promptTokenCount"));
            output=token(usage.path("candidatesTokenCount"));
            Long thoughts=token(usage.path("thoughtsTokenCount"));
            if(output!=null && thoughts!=null) output=Math.addExact(output,thoughts);
            var candidates=envelope.path("candidates");
            if(envelope.path("promptFeedback").has("blockReason") || !candidates.isArray() || candidates.size()!=1
                    || !"STOP".equals(candidates.get(0).path("finishReason").asText()))
                throw new AiException(502,"AI_INVALID_RESPONSE");
            StringBuilder text=new StringBuilder();
            for(var part:candidates.get(0).path("content").path("parts")) {
                if(part.path("thought").asBoolean()) continue;
                if(!part.path("text").isTextual()) throw new AiException(502,"AI_INVALID_RESPONSE");
                text.append(part.path("text").textValue());
            }
            if(text.isEmpty()) throw new AiException(502,"AI_INVALID_RESPONSE");
            return new ProviderResult(GeneratedCardParser.parse(json,text.toString()),input,output,attempts);
        } catch(AiException e) { throw e.usage(input,output,attempts); }
        catch(java.io.IOException | IllegalArgumentException | ArithmeticException e) {
            throw new AiException(502,"AI_INVALID_RESPONSE").usage(input,output,attempts);
        }
    }

    private Long token(JsonNode value) { return value.isIntegralNumber() && value.canConvertToLong() && value.longValue()>=0?value.longValue():null; }
    private String errorCode(int status,byte[] body) {
        if(status==401 || status==403) return "GEMINI_AUTH_ERROR";
        try {
            var tree=json.readTree(body);
            var error=tree==null?json.createObjectNode():tree.path("error");
            for(var detail:error.path("details")) {
                String reason=detail.path("reason").asText();
                if(Set.of("API_KEY_INVALID","API_KEY_EXPIRED","API_KEY_SERVICE_BLOCKED").contains(reason)) return "GEMINI_AUTH_ERROR";
                if(Set.of("BILLING_DISABLED","BILLING_NOT_ACTIVE").contains(reason)) return "GEMINI_INSUFFICIENT_QUOTA";
                for(var violation:detail.path("violations")) {
                    String id=violation.path("quotaId").asText().toLowerCase(Locale.ROOT);
                    if(id.contains("perday") || id.contains("per_day") || id.contains("daily")
                            || "0".equals(violation.path("quotaValue").asText())) return "GEMINI_INSUFFICIENT_QUOTA";
                }
            }
        } catch(java.io.IOException ignored) { /* Unknown 429 stays rate-limit; do not infer billing from free text. */ }
        return status==429?"GEMINI_RATE_LIMIT":status>=500?"AI_PROVIDER_UNAVAILABLE":"AI_GENERATION_FAILED";
    }
    private long retryDelay(String header,byte[] body) {
        try {
            if(header!=null) return Math.max(0,Math.multiplyExact(Long.parseLong(header),1000));
            var tree=json.readTree(body);
            if(tree==null) return 250;
            for(var detail:tree.path("error").path("details")) {
                String delay=detail.path("retryDelay").asText();
                if(delay.matches("[0-9]+(?:\\.[0-9]+)?s")) return (long)Math.min(3000,Double.parseDouble(delay.substring(0,delay.length()-1))*1000);
            }
        } catch(java.io.IOException | NumberFormatException | ArithmeticException e) { return 3000; }
        return 250;
    }
    private record Wire(int status,byte[] body,String retryAfter) {}
}
