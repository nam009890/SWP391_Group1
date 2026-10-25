package com.example.demo.flashcard.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ai")
@Getter
@Setter
public class AiProperties {
    private String provider = "gemini";
    private ProviderSettings openai = new ProviderSettings();
    private ProviderSettings gemini = new ProviderSettings();

    @Getter @Setter
    public static class ProviderSettings {
        private String apiKey = "";
        private String model = "";
    }

    // Keep legacy app.ai.api-key/model for existing OpenAI installations.
    public String openAiKey() { return openai.getApiKey().isBlank() ? apiKey : openai.getApiKey(); }
    public String openAiModel() { return openai.getModel().isBlank() ? model : openai.getModel(); }
    private boolean enabled = true;
    private String apiKey = "";
    private String model = "";
    private int maxCards = 20;
    private int timeoutSeconds = 30;
    private int dailyUserLimit = 10;
    private int dailyGlobalLimit = 100;
    private int maxConcurrentPerUser = 1;
    private int maxOutputTokens = 6000;

    public String source() {
        String selected = provider == null ? "DISABLED" : provider.trim().replace('-', '_').toUpperCase(java.util.Locale.ROOT);
        if (!enabled || "DISABLED".equals(selected)) return "DISABLED";
        try {
            return com.example.demo.flashcard.ai.entity.AiGenerationSource.valueOf(selected).name();
        } catch (IllegalArgumentException e) {
            throw new com.example.demo.flashcard.ai.exception.AiException(503, "AI_NOT_CONFIGURED");
        }
    }

    public int timeout() { return Math.max(1, Math.min(60, timeoutSeconds)); }
    public int outputBudget() { return Math.max(256, Math.min(8000, maxOutputTokens)); }
}
