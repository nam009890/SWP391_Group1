package com.swp391.evms.service;

import com.swp391.evms.dto.response.WeakVocabularyResponse;
import com.swp391.evms.dto.response.WeakVocabularyPageResponse;
import com.swp391.evms.dto.request.UpdateWeakVocabularyRequest;
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
        this.userRepository = userRepository;
        this.userVocabularyRepository = userVocabularyRepository;
        this.senseRepository = senseRepository;
        this.exampleRepository = exampleRepository;
    }

    @Transactional(readOnly = true)
    public List<WeakVocabularyResponse> getWeakVocabularies(Long userId) {
        requireUser(userId);
        return sortedWeak(userId).stream().map(this::map).toList();
    }

    @Transactional(readOnly = true)
    public List<UserVocabulary> sortedWeak(Long userId) {
        return sortedWeak(userId, null);
    }

    public List<UserVocabulary> sortedWeak(Long userId, String keyword) {
        return userVocabularyRepository
                .findVisibleWeakByUserId(userId, keyword == null || keyword.isBlank() ? null : keyword.trim()).stream()
                .sorted(Comparator.comparing(UserVocabulary::getMasteryScore, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(UserVocabulary::getConsecutiveWrong,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(UserVocabulary::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    @Transactional(readOnly = true)
    public WeakVocabularyPageResponse getWeakVocabularyPage(Long userId, String keyword, int page, int size) {
        requireUser(userId);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(50, Math.max(1, size));
        List<WeakVocabularyResponse> all = sortedWeak(userId, keyword).stream().map(this::map).toList();
        int from = Math.min(safePage * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        int pages = (int) Math.ceil(all.size() / (double) safeSize);
        return new WeakVocabularyPageResponse(all.subList(from, to), safePage, safeSize, all.size(), pages,
                safePage == 0, pages == 0 || safePage >= pages - 1);
    }

    @Transactional
    public WeakVocabularyResponse update(Long userId, Long id, UpdateWeakVocabularyRequest request) {
        UserVocabulary uv = owned(userId, id);
        if (request.manualWeak() != null)
            uv.setManualWeak(request.manualWeak());
        uv.setWeakNote(request.weakNote());
        uv.setUpdatedAt(java.time.OffsetDateTime.now());
        return map(uv);
    }

    @Transactional
    public void softDelete(Long userId, Long id) {
        UserVocabulary uv = owned(userId, id);
        uv.setWeakDeleted(true);
        uv.setWeakDeletedAt(java.time.OffsetDateTime.now());
        uv.setUpdatedAt(java.time.OffsetDateTime.now());
    }

    private UserVocabulary owned(Long userId, Long id) {
        requireUser(userId);
        return userVocabularyRepository.findById(id).filter(v -> v.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Weak vocabulary not found: " + id));
    }

    public void requireUser(Long userId) {
        if (!userRepository.existsById(userId))
            throw new ResourceNotFoundException("User not found: " + userId);
    }

    private WeakVocabularyResponse map(UserVocabulary uv) {
        VocabularySense sense = senseRepository.findByVocabularyIdOrderBySenseOrderAsc(uv.getVocabulary().getId())
                .stream().findFirst().orElse(null);
        VocabularyExample example = sense == null ? null
                : exampleRepository.findBySenseIdOrderByExampleOrderAsc(sense.getId())
                        .stream().findFirst().orElse(null);
        int total = value(uv.getTotalAttempts());
        double accuracy = total == 0 ? 0D : Math.round(value(uv.getCorrectCount()) * 10000D / total) / 100D;
        return new WeakVocabularyResponse(uv.getId(), uv.getVocabulary().getId(), uv.getVocabulary().getWord(),
                uv.getVocabulary().getCefrLevel(), sense == null ? null : sense.getPronunciation(),
                sense == null ? null : sense.getPartOfSpeech(), sense == null ? null : sense.getMeaningVi(),
                example == null ? null : example.getExampleText(), value(uv.getMasteryScore()), total,
                value(uv.getCorrectCount()), value(uv.getWrongCount()), value(uv.getConsecutiveWrong()), accuracy,
                Boolean.TRUE.equals(uv.getManualWeak()), weakReason(uv), uv.getWeakNote(), uv.getLastReviewedAt(),
                uv.getNextReviewAt());
    }

    public static String weakReason(UserVocabulary uv) {
        if (Boolean.TRUE.equals(uv.getManualWeak()))
            return "MANUAL_MARK";
        if (value(uv.getConsecutiveWrong()) >= 2)
            return "CONSECUTIVE_WRONG";
        int total = value(uv.getTotalAttempts());
        if (total >= 3 && value(uv.getCorrectCount()) * 1.0 / total < .60)
            return "LOW_ACCURACY";
        return "WEAK_STATUS";
    }

    static int value(Integer value) {
        return value == null ? 0 : value;
    }
}
