package com.example.demo.flashcard.ai.service;

import com.example.demo.flashcard.ai.dto.AiDtos.Spec;
import com.fasterxml.jackson.databind.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.core.io.ClassPathResource;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
@RequiredArgsConstructor
public class AiPromptBuilder {
    public static final String VERSION = "FLASHCARD_GENERATION_V2";
    private final ObjectMapper json;

    public String system() {
        try (var input = new ClassPathResource("ai/flashcard-system-v2.txt").getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Missing system prompt", e);
        }
    }

    public Map<String,Object> input(Spec spec, List<String> excluded) {
        Map<String,Object> input = new LinkedHashMap<>();
        input.put("topic", spec.topic());
        input.put("level", spec.level());
        input.put("count", spec.count());
        input.put("type", spec.type());
        input.put("context", spec.context());
        input.put("meaningLanguage", "vi");
        List<String> bounded = new ArrayList<>();
        int characters = 0;
        for (String word : excluded.stream().filter(Objects::nonNull).sorted().toList()) {
            if (bounded.size() >= 100 || characters + word.length() > 10000) break;
            if (word.length() <= 255) {
                bounded.add(word);
                characters += word.length();
            }
        }
        input.put("excludedVocabulary", bounded);
        return input;
    }

    public Map<String,Object> schema() {
        Map<String,Object> fields = new LinkedHashMap<>();
        fields.put("vocabulary", Map.of("type","string"));
        fields.put("meaning", Map.of("type","string"));
        fields.put("phonetic", Map.of("type",List.of("string","null")));
        fields.put("exampleSentence", Map.of("type","string"));
        var card = Map.of("type","object","properties",fields,"required",List.copyOf(fields.keySet()),"additionalProperties",false);
        return Map.of("type","object","properties",Map.of("cards",Map.of("type","array","items",card)),
                "required",List.of("cards"),"additionalProperties",false);
    }

    public Map<String,Object> request(String model, int outputBudget, Spec spec, List<String> excluded) {
        return Map.of("model",model,"store",false,"max_output_tokens",outputBudget,
                "input",List.of(Map.of("role","system","content",system()),
                        Map.of("role","user","content",write(input(spec, excluded)))),
                "text",Map.of("format",Map.of("type","json_schema","name","flashcard_generation_v2",
                        "strict",true,"schema",schema())));
    }

    public Map<String,Object> geminiRequest(int outputBudget, Spec spec, List<String> excluded) {
        return Map.of("systemInstruction",Map.of("parts",List.of(Map.of("text",system()))),
                "contents",List.of(Map.of("role","user","parts",List.of(Map.of("text",write(input(spec,excluded)))))),
                "generationConfig",Map.of("maxOutputTokens",outputBudget,
                        "responseFormat",Map.of("text",Map.of("mimeType","APPLICATION_JSON","schema",schema()))));
    }

    private String write(Object value) {
        try { return json.writeValueAsString(value); }
        catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalStateException(e); }
    }
}
