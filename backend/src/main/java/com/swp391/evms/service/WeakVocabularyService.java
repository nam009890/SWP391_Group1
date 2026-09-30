package com.swp391.evms.service;

import com.swp391.evms.dto.request.UpdateWeakVocabularyRequest;
import com.swp391.evms.dto.request.WeakVocabularyFilter;
import com.swp391.evms.dto.response.WeakVocabularyPageResponse;
import com.swp391.evms.dto.response.WeakVocabularyResponse;
import com.swp391.evms.entity.*;
import com.swp391.evms.exception.ResourceNotFoundException;
import com.swp391.evms.repository.*;
import java.util.*;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
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
        return findWeak(userId, new WeakVocabularyFilter(null, null, null, null, null, null, null, null, null));
    }

    @Transactional(readOnly = true)
    public WeakVocabularyPageResponse getWeakVocabularyPage(Long userId, WeakVocabularyFilter filter, int page, int size) {
        requireUser(userId);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(50, Math.max(1, size));
        List<WeakVocabularyResponse> all = findWeak(userId, filter).stream().map(this::map).toList();
        int from = Math.min(safePage * safeSize, all.size());
        int to = Math.min(from + safeSize, all.size());
        int pages = (int) Math.ceil(all.size() / (double) safeSize);
        return new WeakVocabularyPageResponse(all.subList(from, to), safePage, safeSize, all.size(), pages,
                safePage == 0, pages == 0 || safePage >= pages - 1);
    }

    private List<UserVocabulary> findWeak(Long userId, WeakVocabularyFilter filter) {
        WeakVocabularyFilter active = filter == null
                ? new WeakVocabularyFilter(null, null, null, null, null, null, null, null, null)
                : filter;
        List<UserVocabulary> result = userVocabularyRepository.findAll(specification(userId, active));
        return result.stream().sorted(comparator(active.sort())).toList();
    }

    private Specification<UserVocabulary> specification(Long userId, WeakVocabularyFilter filter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("user").get("id"), userId));
            predicates.add(builder.isFalse(builder.coalesce(root.get("weakDeleted"), false)));
            predicates.add(builder.or(
                    builder.equal(root.get("learningStatus"), LearningStatus.WEAK),
                    builder.isTrue(builder.coalesce(root.get("manualWeak"), false))));

            if (hasText(filter.keyword())) {
                String pattern = "%" + filter.keyword().trim().toLowerCase(Locale.ROOT) + "%";
                Subquery<Long> sense = query.subquery(Long.class);
                Root<VocabularySense> senseRoot = sense.from(VocabularySense.class);
                sense.select(senseRoot.get("id")).where(
                        builder.equal(senseRoot.get("vocabulary"), root.get("vocabulary")),
                        builder.like(builder.lower(senseRoot.get("meaningVi")), pattern));
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("vocabulary").get("word")), pattern),
                        builder.exists(sense)));
            }
            if (hasText(filter.cefrLevel())) {
                predicates.add(builder.equal(root.get("vocabulary").get("cefrLevel"), filter.cefrLevel().trim()));
            }
            if (hasText(filter.partOfSpeech())) {
                Subquery<Long> sense = query.subquery(Long.class);
                Root<VocabularySense> senseRoot = sense.from(VocabularySense.class);
                sense.select(senseRoot.get("id")).where(
                        builder.equal(senseRoot.get("vocabulary"), root.get("vocabulary")),
                        builder.equal(builder.lower(senseRoot.get("partOfSpeech")),
                                filter.partOfSpeech().trim().toLowerCase(Locale.ROOT)));
                predicates.add(builder.exists(sense));
            }
            addRange(predicates, builder, root.get("masteryScore"), filter.masteryMin(), filter.masteryMax());
            if (filter.manualWeak() != null) {
                predicates.add(builder.equal(builder.coalesce(root.get("manualWeak"), false), filter.manualWeak()));
            }
            if (filter.accuracyMin() != null || filter.accuracyMax() != null) {
                Expression<Integer> total = root.get("totalAttempts");
                Expression<Integer> correct = root.get("correctCount");
                Expression<Number> accuracy = builder.quot(builder.prod(builder.toDouble(correct), 100D),
                        builder.toDouble(builder.nullif(total, 0)));
                predicates.add(builder.greaterThan(total, 0));
                if (filter.accuracyMin() != null) predicates.add(builder.ge(accuracy, filter.accuracyMin().doubleValue()));
                if (filter.accuracyMax() != null) predicates.add(builder.le(accuracy, filter.accuracyMax().doubleValue()));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static void addRange(List<Predicate> predicates, CriteriaBuilder builder, Path<Integer> path,
            Integer min, Integer max) {
        if (min != null) predicates.add(builder.ge(path, Math.max(0, min)));
        if (max != null) predicates.add(builder.le(path, Math.min(100, max)));
    }

    private static Comparator<UserVocabulary> comparator(String sort) {
        Comparator<UserVocabulary> weakest = Comparator
                .comparing(UserVocabulary::getMasteryScore, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(UserVocabulary::getConsecutiveWrong, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(UserVocabulary::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
        String value = sort == null ? "WEAKEST_FIRST" : sort;
        return switch (value) {
            case "MASTERY_DESC" -> Comparator.comparing(UserVocabulary::getMasteryScore,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "ACCURACY_ASC" -> Comparator.comparingDouble(WeakVocabularyService::accuracy);
            case "ACCURACY_DESC" -> Comparator.comparingDouble(WeakVocabularyService::accuracy).reversed();
            case "UPDATED_DESC" -> Comparator.comparing(UserVocabulary::getUpdatedAt,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "WORD_ASC" -> Comparator.comparing(uv -> uv.getVocabulary().getWord(),
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "WORD_DESC" -> Comparator.comparing((UserVocabulary uv) -> uv.getVocabulary().getWord(),
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)).reversed();
            case "MASTERY_ASC" -> Comparator.comparing(UserVocabulary::getMasteryScore,
                    Comparator.nullsLast(Integer::compareTo));
            default -> weakest;
        };
    }

    private static double accuracy(UserVocabulary uv) {
        int attempts = value(uv.getTotalAttempts());
        return attempts == 0 ? 0D : value(uv.getCorrectCount()) * 100D / attempts;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
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
