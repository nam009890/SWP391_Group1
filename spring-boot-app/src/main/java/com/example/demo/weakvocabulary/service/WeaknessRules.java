package com.example.demo.weakvocabulary.service;

import com.example.demo.weakvocabulary.entity.UserWeakVocabulary;
import com.example.demo.weakvocabulary.entity.WeakDetectionReason;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

public final class WeaknessRules {
    public static final int RECENT_WINDOW = 3;
    public static final int HARD_THRESHOLD = 2;
    public static final int STUDY_MINIMUM = 5;
    public static final int PRACTICE_MINIMUM = 3;
    public static final int CONSECUTIVE_WRONG_THRESHOLD = 2;
    public static final int ACCURACY_THRESHOLD = 60;
    public static final int MASTERY_STEP = 20;

    private WeaknessRules() {
    }

    public static void validateQuality(int quality) {
        if (quality != 1 && quality != 3 && quality != 4 && quality != 5) {
            throw new IllegalArgumentException("Đánh giá chỉ nhận 1, 3, 4 hoặc 5");
        }
    }

    public static WeakDetectionReason study(int quality, List<Integer> latest, long total, long confident) {
        validateQuality(quality);
        // Ưu tiên quên ngay, rồi khó nhớ lặp lại, cuối cùng tỷ lệ ghi nhớ thấp.
        if (quality == 1) {
            return WeakDetectionReason.STUDY_FORGOT;
        }
        long hard = latest.stream().limit(RECENT_WINDOW).filter(q -> q == 3).count();
        if (hard >= HARD_THRESHOLD) {
            return WeakDetectionReason.STUDY_HARD_REPEAT;
        }
        if (total >= STUDY_MINIMUM && confident * 100.0 / total < ACCURACY_THRESHOLD) {
            return WeakDetectionReason.STUDY_LOW_RECALL;
        }
        return null;
    }

    public static WeakDetectionReason practice(UserWeakVocabulary weak) {
        if (weak.getConsecutiveWrong() >= CONSECUTIVE_WRONG_THRESHOLD) {
            return WeakDetectionReason.PRACTICE_CONSECUTIVE_WRONG;
        }
        if (weak.getTotalAttempts() >= PRACTICE_MINIMUM
                && weak.getCorrectCount() * 100.0 / weak.getTotalAttempts() < ACCURACY_THRESHOLD) {
            return WeakDetectionReason.PRACTICE_LOW_ACCURACY;
        }
        return null;
    }

    public static Double accuracy(long correct, long total) {
        return total == 0 ? null : Math.round(correct * 10000.0 / total) / 100.0;
    }

    public static void detected(UserWeakVocabulary weak, WeakDetectionReason reason) {
        if (reason == null || weak.isWeakDeleted()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        // Legacy AUTO không có ngày đầu đáng tin cậy: không bịa ngày trong quá khứ.
        boolean previouslyAutomatic = weak.isAutoDetected();
        weak.setAutoDetected(true);
        weak.setDetectionReason(reason);
        if (!previouslyAutomatic && weak.getFirstDetectedAt() == null) {
            weak.setFirstDetectedAt(now);
        }
        weak.setLastDetectedAt(now);
    }

    public static WeakDetectionReason reason(UserWeakVocabulary weak) {
        if (weak.getDetectionReason() != null && (!weak.isAutoDetected()
                || weak.getDetectionReason() != WeakDetectionReason.MANUAL_MARK)) {
            return weak.getDetectionReason();
        }
        if (weak.isAutoDetected()) {
            return WeakDetectionReason.LEGACY_AUTO;
        }
        return WeakDetectionReason.MANUAL_MARK;
    }
}
