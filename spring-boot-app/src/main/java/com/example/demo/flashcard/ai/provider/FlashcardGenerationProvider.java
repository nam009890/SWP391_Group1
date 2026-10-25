package com.example.demo.flashcard.ai.provider;

import com.example.demo.flashcard.ai.dto.AiDtos.*;
import java.util.List;

public interface FlashcardGenerationProvider {
    String source();
    ProviderResult generate(Spec specification, List<String> excludedVocabulary);
}
