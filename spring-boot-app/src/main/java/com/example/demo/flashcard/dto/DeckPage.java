package com.example.demo.flashcard.dto;

import org.springframework.data.domain.Page;
import java.util.List;

public record DeckPage(List<DeckResponse> content, int number, int size, long totalElements,
                       int totalPages, boolean first, boolean last) {
    public static DeckPage from(Page<DeckResponse> page) {
        return new DeckPage(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages(), page.isFirst(), page.isLast());
    }
}
