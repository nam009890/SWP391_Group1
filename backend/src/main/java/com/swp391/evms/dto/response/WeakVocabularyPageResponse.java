package com.swp391.evms.dto.response;

import java.util.List;
public record WeakVocabularyPageResponse(List<WeakVocabularyResponse> items, int page, int size, long totalElements, int totalPages, boolean first, boolean last) {}
