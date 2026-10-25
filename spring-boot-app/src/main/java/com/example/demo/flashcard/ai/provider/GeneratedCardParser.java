package com.example.demo.flashcard.ai.provider;
import com.example.demo.flashcard.ai.dto.AiDtos.Card;
import com.example.demo.flashcard.ai.exception.AiException;
import com.fasterxml.jackson.databind.*;
import java.util.*;
/** One strict JSON contract for all live providers. Semantic validation stays in AiGenerationStore. */
final class GeneratedCardParser {
    private GeneratedCardParser() {}
    static List<Card> parse(ObjectMapper json, String text) throws java.io.IOException {
            JsonNode tree = json.reader().with(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                    .with(com.fasterxml.jackson.core.JsonParser.Feature.STRICT_DUPLICATE_DETECTION).readTree(text);
            if (tree == null || !tree.isObject() || tree.size() != 1 || !tree.path("cards").isArray() || tree.path("cards").size() > 20) {
                throw new AiException(502,"AI_INVALID_RESPONSE");
            }
            List<Card> cards = new ArrayList<>();
            for (JsonNode card : tree.path("cards")) {
                if (!card.isObject() || card.size() != 4 || !card.has("phonetic")
                        || !card.path("vocabulary").isTextual() || !card.path("meaning").isTextual()
                        || !card.path("exampleSentence").isTextual()
                        || !(card.get("phonetic").isNull() || card.get("phonetic").isTextual())) {
                    throw new AiException(502,"AI_INVALID_RESPONSE");
                }
                cards.add(new Card(card.get("vocabulary").textValue(),card.get("meaning").textValue(),
                        card.get("phonetic").textValue(),card.get("exampleSentence").textValue()));
            }

        return cards;
    }
}
