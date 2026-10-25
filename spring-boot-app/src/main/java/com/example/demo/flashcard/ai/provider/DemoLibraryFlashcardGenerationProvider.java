package com.example.demo.flashcard.ai.provider;

import com.example.demo.flashcard.ai.dto.AiDtos.*;
import com.example.demo.flashcard.ai.exception.AiException;
import com.example.demo.flashcard.ai.validation.AiFlashcardValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DemoLibraryFlashcardGenerationProvider implements FlashcardGenerationProvider {
    private final ObjectMapper json;
    private final AiFlashcardValidator validator;
    @Override public String source() { return com.example.demo.flashcard.ai.entity.AiGenerationSource.DEMO_LIBRARY.name(); }

    @Override
    public ProviderResult generate(Spec spec, List<String> excluded) {
        String topic = validator.normalize(spec.topic());
        String category;
        if (Set.of("travel","du lịch","travelling").contains(topic)) category = "travel";
        else if (Set.of("business english","business","tiếng anh kinh doanh").contains(topic)) category = "business";
        else throw new AiException(422,"DEMO_TOPIC_UNSUPPORTED");
        if (!"B1".equals(spec.level())) throw new AiException(422,"DEMO_TOPIC_UNSUPPORTED");
        Set<String> used = new HashSet<>();
        excluded.forEach(word -> used.add(validator.normalize(word)));
        try (var input = new ClassPathResource("ai/demo-library.json").getInputStream()) {
            List<Card> library = new ArrayList<>();
            for (var node : json.readTree(input).path(category)) library.add(json.treeToValue(node,Card.class));
            if ("MIXED".equals(spec.type())) {
                List<Card> words = library.stream().filter(card -> !card.vocabulary().contains(" ")).toList();
                List<Card> phrases = library.stream().filter(card -> card.vocabulary().contains(" ")).toList();
                library = new ArrayList<>();
                for (int i = 0; i < Math.max(words.size(),phrases.size()); i++) {
                    if (i < words.size()) library.add(words.get(i));
                    if (i < phrases.size()) library.add(phrases.get(i));
                }
            }
            List<Card> result = new ArrayList<>();
            for (Card card : library) {
                boolean phrase = card.vocabulary().contains(" ");
                if (("WORD".equals(spec.type()) && phrase) || ("PHRASE".equals(spec.type()) && !phrase)) continue;
                if (used.add(validator.normalize(card.vocabulary()))) result.add(card);
                if (result.size() == spec.count()) break;
            }
            // Dữ liệu tuyển chọn cố định, không giả là kết quả OpenAI mới sinh.
            return new ProviderResult(List.copyOf(result),null,null,0);
        } catch (java.io.IOException e) {
            throw new AiException(503,"AI_GENERATION_FAILED");
        }
    }
}
