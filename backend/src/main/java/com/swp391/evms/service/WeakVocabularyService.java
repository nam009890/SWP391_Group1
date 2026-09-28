package com.swp391.evms.service;

import com.swp391.evms.dto.response.WeakVocabularyResponse;
import com.swp391.evms.entity.*;
import com.swp391.evms.exception.ResourceNotFoundException;
import com.swp391.evms.repository.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WeakVocabularyService {
    private final UserRepository userRepository;
    private final UserVocabularyRepository userVocabularyRepository;
    private final VocabularySenseRepository senseRepository;
    private final VocabularyExampleRepository exampleRepository;

    public WeakVocabularyService(UserRepository userRepository, UserVocabularyRepository userVocabularyRepository,
            VocabularySenseRepository senseRepository, VocabularyExampleRepository exampleRepository) {
        this.userRepository = userRepository; this.userVocabularyRepository = userVocabularyRepository;
        this.senseRepository = senseRepository; this.exampleRepository = exampleRepository;
    }

    @Transactional(readOnly = true)
    public List<WeakVocabularyResponse> getWeakVocabularies(Long userId) {
        requireUser(userId);
        return sortedWeak(userId).stream().map(this::map).toList();
    }

    @Transactional(readOnly = true)
    public List<UserVocabulary> sortedWeak(Long userId) {
        return userVocabularyRepository.findWeakByUserId(userId).stream()
            .sorted(Comparator.comparing(UserVocabulary::getMasteryScore, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(UserVocabulary::getConsecutiveWrong, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(UserVocabulary::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();
    }

    public void requireUser(Long userId) {
        if (!userRepository.existsById(userId)) throw new ResourceNotFoundException("User not found: " + userId);
    }

    private WeakVocabularyResponse map(UserVocabulary uv) {
        VocabularySense sense = senseRepository.findByVocabularyIdOrderBySenseOrderAsc(uv.getVocabulary().getId())
            .stream().findFirst().orElse(null);
        VocabularyExample example = sense == null ? null : exampleRepository.findBySenseIdOrderByExampleOrderAsc(sense.getId())
            .stream().findFirst().orElse(null);
        int total = value(uv.getTotalAttempts());
        double accuracy = total == 0 ? 0D : Math.round(value(uv.getCorrectCount()) * 10000D / total) / 100D;
        return new WeakVocabularyResponse(uv.getId(), uv.getVocabulary().getId(), uv.getVocabulary().getWord(),
            uv.getVocabulary().getCefrLevel(), sense == null ? null : sense.getPronunciation(),
            sense == null ? null : sense.getPartOfSpeech(), sense == null ? null : sense.getMeaningVi(),
            example == null ? null : example.getExampleText(), value(uv.getMasteryScore()), total,
            value(uv.getCorrectCount()), value(uv.getWrongCount()), value(uv.getConsecutiveWrong()), accuracy,
            Boolean.TRUE.equals(uv.getManualWeak()), weakReason(uv), uv.getLastReviewedAt(), uv.getNextReviewAt());
    }

    public static String weakReason(UserVocabulary uv) {
        if (Boolean.TRUE.equals(uv.getManualWeak())) return "MANUAL_MARK";
        if (value(uv.getConsecutiveWrong()) >= 2) return "CONSECUTIVE_WRONG";
        int total = value(uv.getTotalAttempts());
        if (total >= 3 && value(uv.getCorrectCount()) * 1.0 / total < .60) return "LOW_ACCURACY";
        return "WEAK_STATUS";
    }
    static int value(Integer value) { return value == null ? 0 : value; }
}
