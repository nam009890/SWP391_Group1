package com.example.demo.weakvocabulary.dto;

import com.example.demo.weakvocabulary.entity.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

public final class WeakDtos {
    private WeakDtos() {
    }

    @Getter
    @Setter
    public static class PatchRequest {
        private String weakNote;
        private Boolean manualMarked;
    }

    @Getter
    @Setter
    public static class PracticeStartRequest {
        private WeakQuestionType questionType;
        private List<Long> weakVocabularyIds;
    }

    @Getter
    @Setter
    public static class AnswerRequest {
        private String answer;
    }

    @Getter
    public static class WeakResponse {
        private Long weakVocabularyId, flashcardId, deckId;
        private String deckName, vocabulary, meaning, phonetic, exampleSentence, weakReason, weakNote;
        private boolean manualMarked, autoDetected;
        private int masteryScore, totalAttempts, correctCount, wrongCount, consecutiveWrong;
        private double accuracy;
        private Integer lastStudyQuality;
        private LocalDateTime lastPracticedAt, createdAt, updatedAt;

        public WeakResponse() {
        }

        @Builder
        public WeakResponse(Long weakVocabularyId, Long flashcardId, Long deckId,
                            String deckName, String vocabulary, String meaning, String phonetic, String exampleSentence, String weakReason, String weakNote,
                            boolean manualMarked, boolean autoDetected,
                            int masteryScore, int totalAttempts, int correctCount, int wrongCount, int consecutiveWrong,
                            double accuracy, Integer lastStudyQuality,
                            LocalDateTime lastPracticedAt, LocalDateTime createdAt, LocalDateTime updatedAt) {
            this.weakVocabularyId = weakVocabularyId;
            this.flashcardId = flashcardId;
            this.deckId = deckId;
            this.deckName = deckName;
            this.vocabulary = vocabulary;
            this.meaning = meaning;
            this.phonetic = phonetic;
            this.exampleSentence = exampleSentence;
            this.weakReason = weakReason;
            this.weakNote = weakNote;
            this.manualMarked = manualMarked;
            this.autoDetected = autoDetected;
            this.masteryScore = masteryScore;
            this.totalAttempts = totalAttempts;
            this.correctCount = correctCount;
            this.wrongCount = wrongCount;
            this.consecutiveWrong = consecutiveWrong;
            this.accuracy = accuracy;
            this.lastStudyQuality = lastStudyQuality;
            this.lastPracticedAt = lastPracticedAt;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }

    @Getter
    public static class PageResponse {
        private List<WeakResponse> items;
        private int page, size, totalPages;
        private long totalElements;
        private boolean first, last;

        public PageResponse() {
        }

        @Builder
        public PageResponse(List<WeakResponse> items, int page, int size, int totalPages, long totalElements, boolean first, boolean last) {
            this.items = items;
            this.page = page;
            this.size = size;
            this.totalPages = totalPages;
            this.totalElements = totalElements;
            this.first = first;
            this.last = last;
        }
    }

    @Getter
    public static class QuestionResponse {
        private Long itemId;
        private int itemOrder;
        private WeakQuestionType questionType;
        private String question;
        private List<String> options;

        public QuestionResponse() {
        }

        @Builder
        public QuestionResponse(Long itemId, int itemOrder, WeakQuestionType questionType, String question, List<String> options) {
            this.itemId = itemId;
            this.itemOrder = itemOrder;
            this.questionType = questionType;
            this.question = question;
            this.options = options;
        }
    }

    @Getter
    public static class SessionResponse {
        private Long sessionId;
        private WeakQuestionType questionType;
        private WeakPracticeStatus status;
        private int totalQuestions, correctAnswers, wrongAnswers;
        private List<QuestionResponse> questions;

        public SessionResponse() {
        }

        @Builder
        public SessionResponse(Long sessionId, WeakQuestionType questionType, WeakPracticeStatus status,
                               int totalQuestions, int correctAnswers, int wrongAnswers,
                               List<QuestionResponse> questions) {
            this.sessionId = sessionId;
            this.questionType = questionType;
            this.status = status;
            this.totalQuestions = totalQuestions;
            this.correctAnswers = correctAnswers;
            this.wrongAnswers = wrongAnswers;
            this.questions = questions;
        }
    }

    @Getter
    public static class AnswerResponse {
        private boolean correct;
        private String correctAnswer;
        private int correctAnswers, wrongAnswers;
        private boolean completed;

        public AnswerResponse() {
        }

        @Builder
        public AnswerResponse(boolean correct, String correctAnswer, int correctAnswers, int wrongAnswers, boolean completed) {
            this.correct = correct;
            this.correctAnswer = correctAnswer;
            this.correctAnswers = correctAnswers;
            this.wrongAnswers = wrongAnswers;
            this.completed = completed;
        }
    }

    @Getter
    public static class SummaryResponse {
        private Long sessionId;
        private WeakPracticeStatus status;
        private int totalQuestions, correctAnswers, wrongAnswers;
        private double accuracy;
        private LocalDateTime startedAt, completedAt;

        public SummaryResponse() {
        }

        @Builder
        public SummaryResponse(Long sessionId, WeakPracticeStatus status, int totalQuestions, int correctAnswers, int wrongAnswers, double accuracy, LocalDateTime startedAt, LocalDateTime completedAt) {
            this.sessionId = sessionId;
            this.status = status;
            this.totalQuestions = totalQuestions;
            this.correctAnswers = correctAnswers;
            this.wrongAnswers = wrongAnswers;
            this.accuracy = accuracy;
            this.startedAt = startedAt;
            this.completedAt = completedAt;
        }
    }
}
