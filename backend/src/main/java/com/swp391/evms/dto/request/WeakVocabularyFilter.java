package com.swp391.evms.dto.request;

/** Filter values accepted by the weak-vocabulary list endpoint. */
public record WeakVocabularyFilter(
        String keyword,
        String cefrLevel,
        String partOfSpeech,
        Integer masteryMin,
        Integer masteryMax,
        Integer accuracyMin,
        Integer accuracyMax,
        Boolean manualWeak,
        String sort) {
}
