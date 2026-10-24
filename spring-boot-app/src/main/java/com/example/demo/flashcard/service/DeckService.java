package com.example.demo.flashcard.service;

import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckRequest;
import com.example.demo.flashcard.dto.DeckResponse;
import com.example.demo.flashcard.entity.DeckVisibility;
import java.util.List;
import org.springframework.data.domain.Page;

public interface DeckService {
    List<DeckDto> getAllDecksWithCount();
    DeckResponse createDeck(DeckRequest request);
    DeckResponse getDeckById(Long id);
    Page<DeckResponse> list(boolean mine, String keyword,
            DeckVisibility visibility, String sort, int page, int size);
    DeckResponse getPublic(Long id);
    DeckResponse update(Long id, DeckRequest request);
    DeckResponse visibility(Long id, DeckVisibility visibility);
    void delete(Long id);
}
