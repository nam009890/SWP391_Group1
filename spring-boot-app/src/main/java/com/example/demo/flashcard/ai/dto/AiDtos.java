package com.example.demo.flashcard.ai.dto;

import com.example.demo.flashcard.dto.FlashcardResponse;
import java.time.LocalDateTime;
import java.util.List;

public final class AiDtos {
    private AiDtos() {}
    public record Card(String vocabulary, String meaning, String phonetic, String exampleSentence) {}
    public record PreviewRequest(String topic, String level, Integer count, String type, String context, String requestId) {}
    public record Spec(String topic, String level, int count, String type, String context) {}
    public record Candidate(String candidateId, String vocabulary, String meaning, String phonetic, String exampleSentence) {
        public Card card() { return new Card(vocabulary, meaning, phonetic, exampleSentence); }
    }
    public record CommitRequest(String generationId, List<Candidate> selectedCards) {}
    public record Preview(String generationId, String source, int requestedCount, int generatedCount,
            int validCount, int duplicatesExcluded, int invalidExcluded, String promptVersion,
            LocalDateTime expiresAt, String message, List<Candidate> cards) {}
    public record CommitResult(String generationId, int savedCount, long deckCardCount, List<FlashcardResponse> cards) {}
    public record ProviderResult(List<Card> cards, Long inputTokens, Long outputTokens, int attempts) {}
    public record Options(String source, boolean enabled, int maxCards, List<String> demoTopics,
            List<String> levels, List<Integer> counts) {}
}
