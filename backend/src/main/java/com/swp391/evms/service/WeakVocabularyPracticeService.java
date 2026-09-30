package com.swp391.evms.service;

import com.swp391.evms.dto.request.*;
import com.swp391.evms.dto.response.*;
import com.swp391.evms.entity.*;
import com.swp391.evms.exception.*;
import com.swp391.evms.repository.*;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WeakVocabularyPracticeService {
    private final WeakVocabularyService weakService; private final UserVocabularyRepository userVocabularyRepository;
    private final VocabularySenseRepository senseRepository; private final VocabularyExampleRepository exampleRepository;
    private final ReviewSessionRepository sessionRepository; private final ReviewSessionItemRepository itemRepository;
    private final ReviewAttemptRepository attemptRepository;
    private final VocabularyRepository vocabularyRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WeakVocabularyPracticeService(WeakVocabularyService weakService, UserVocabularyRepository userVocabularyRepository,
      VocabularySenseRepository senseRepository, VocabularyExampleRepository exampleRepository, ReviewSessionRepository sessionRepository,
      ReviewSessionItemRepository itemRepository, ReviewAttemptRepository attemptRepository, VocabularyRepository vocabularyRepository) {
        this.weakService=weakService; this.userVocabularyRepository=userVocabularyRepository; this.senseRepository=senseRepository;
        this.exampleRepository=exampleRepository; this.sessionRepository=sessionRepository; this.itemRepository=itemRepository; this.attemptRepository=attemptRepository; this.vocabularyRepository=vocabularyRepository;
    }

    @Transactional
    public StartPracticeResponse startPractice(Long userId, StartPracticeRequest request) {
        weakService.requireUser(userId); if (request == null || request.userVocabularyIds().isEmpty()) throw new InvalidReviewSessionException("Select at least one weak vocabulary.");
        if (new HashSet<>(request.userVocabularyIds()).size() != request.userVocabularyIds().size()) throw new InvalidReviewSessionException("Duplicate vocabulary selections are not allowed.");
        Set<Long> selected=new HashSet<>(request.userVocabularyIds());
        List<QuestionDraft> drafts = weakService.sortedWeak(userId).stream().filter(uv -> selected.contains(uv.getId())).map(uv -> createDraft(uv, request.questionType())).flatMap(Optional::stream).toList();
        if (drafts.size()!=selected.size()) throw new InvalidReviewSessionException("Each selected vocabulary must be visible, weak, and have data suitable for the selected practice type.");
        if (drafts.isEmpty()) throw new NoReviewableVocabularyException();
        OffsetDateTime now = OffsetDateTime.now(); ReviewSession session = new ReviewSession();
        session.setUser(drafts.get(0).userVocabulary().getUser()); session.setStatus(ReviewSessionStatus.IN_PROGRESS); session.setStartedAt(now);
        session.setTotalQuestions(drafts.size()); session.setCorrectAnswers(0); session.setWrongAnswers(0); session = sessionRepository.save(session);
        List<ReviewSessionItem> items = new ArrayList<>();
        for (int i=0; i<drafts.size(); i++) { QuestionDraft draft=drafts.get(i); ReviewSessionItem item=new ReviewSessionItem();
            item.setSession(session); item.setUserVocabulary(draft.userVocabulary()); item.setItemOrder(i+1); item.setQuestionType(request.questionType());
            item.setQuestionContent(draft.question()); item.setCorrectAnswer(draft.answer()); item.setOptionsJson(draft.optionsJson()); item.setStatus(ReviewItemStatus.PENDING); item.setCreatedAt(now); items.add(item); }
        items = itemRepository.saveAll(items);
        return new StartPracticeResponse(session.getId(), items.size(), items.stream().map(this::question).toList());
    }

    @Transactional(readOnly = true)
    public PracticeSessionResponse getSession(Long userId, Long sessionId) {
        ReviewSession session = ownedSession(userId, sessionId); List<ReviewSessionItem> pending = itemRepository
            .findBySessionIdAndStatusOrderByItemOrderAsc(sessionId, ReviewItemStatus.PENDING);
        int answered = value(session.getCorrectAnswers()) + value(session.getWrongAnswers());
        return new PracticeSessionResponse(sessionId, session.getStatus().name(), session.getTotalQuestions(), answered, pending.stream().map(this::question).toList());
    }

    @Transactional
    public SubmitFillBlankAnswerResponse submitAnswer(Long userId, Long sessionId, Long itemId, SubmitFillBlankAnswerRequest request) {
        ReviewSession session = ownedSession(userId, sessionId); ReviewSessionItem item = itemRepository.findByIdAndSessionId(itemId, sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Review item not found: " + itemId));
        if (item.getStatus() == ReviewItemStatus.ANSWERED || attemptRepository.existsBySessionItemId(itemId)) throw new ReviewItemAlreadyAnsweredException();
        boolean correct = normalize(request.answer()).equalsIgnoreCase(normalize(item.getCorrectAnswer())); OffsetDateTime now=OffsetDateTime.now();
        ReviewAttempt attempt = new ReviewAttempt(); attempt.setSession(session); attempt.setSessionItem(item); attempt.setUserVocabulary(item.getUserVocabulary());
        attempt.setQuestionType(QuestionType.FILL_BLANK); attempt.setQuestionContent(item.getQuestionContent()); attempt.setUserAnswer(request.answer().trim());
        attempt.setCorrectAnswer(item.getCorrectAnswer()); attempt.setCorrect(correct); attempt.setAttemptedAt(now); attemptRepository.save(attempt);
        item.setStatus(ReviewItemStatus.ANSWERED); item.setAnsweredAt(now); applyVocabularyResult(item.getUserVocabulary(), correct, now);
        userVocabularyRepository.save(item.getUserVocabulary());
        if (correct) session.setCorrectAnswers(value(session.getCorrectAnswers()) + 1); else session.setWrongAnswers(value(session.getWrongAnswers()) + 1);
        int answered=value(session.getCorrectAnswers())+value(session.getWrongAnswers()); boolean complete=answered >= value(session.getTotalQuestions());
        if (complete) { session.setStatus(ReviewSessionStatus.COMPLETED); session.setCompletedAt(now); } else session.setStatus(ReviewSessionStatus.IN_PROGRESS);
        return new SubmitFillBlankAnswerResponse(sessionId, itemId, correct, request.answer().trim(), item.getCorrectAnswer(),
            item.getUserVocabulary().getMasteryScore(), item.getUserVocabulary().getLearningStatus().name(), item.getUserVocabulary().getTotalAttempts(),
            item.getUserVocabulary().getCorrectCount(), item.getUserVocabulary().getWrongCount(), item.getUserVocabulary().getConsecutiveWrong(), answered,
            session.getTotalQuestions(), complete);
    }

    @Transactional(readOnly = true)
    public PracticeSummaryResponse getSummary(Long userId, Long sessionId) {
        ReviewSession session=ownedSession(userId, sessionId); int total=value(session.getTotalQuestions());
        double accuracy=total == 0 ? 0D : Math.round(value(session.getCorrectAnswers()) * 10000D / total) / 100D;
        return new PracticeSummaryResponse(sessionId, session.getStatus().name(), total, value(session.getCorrectAnswers()), value(session.getWrongAnswers()), accuracy, session.getStartedAt(), session.getCompletedAt());
    }

    private ReviewSession ownedSession(Long userId, Long sessionId) { weakService.requireUser(userId); return sessionRepository.findByIdAndUserId(sessionId, userId)
        .orElseThrow(() -> new InvalidReviewSessionException("Review session not found for this user.")); }
    private Optional<QuestionDraft> createDraft(UserVocabulary uv, QuestionType type) { for (VocabularySense sense : senseRepository.findByVocabularyIdOrderBySenseOrderAsc(uv.getVocabulary().getId())) {
        if ((type == QuestionType.WORD_TO_MEANING || type == QuestionType.MEANING_TO_WORD) && sense.getMeaningVi()!=null && !sense.getMeaningVi().isBlank()) return Optional.of(type==QuestionType.WORD_TO_MEANING ? new QuestionDraft(uv,uv.getVocabulary().getWord(),sense.getMeaningVi(),sense.getMeaningVi(),optionsJson(sense.getMeaningVi(), true)) : new QuestionDraft(uv,sense.getMeaningVi(),uv.getVocabulary().getWord(),sense.getMeaningVi(),null));
        for (VocabularyExample example : exampleRepository.findBySenseIdOrderByExampleOrderAsc(sense.getId())) { Optional<MaskedQuestion> masked=mask(example.getExampleText(), uv.getVocabulary().getWord());
            if (masked.isPresent()) return Optional.of(new QuestionDraft(uv, masked.get().question(), masked.get().answer(), sense.getMeaningVi(), type == QuestionType.MULTIPLE_CHOICE ? optionsJson(masked.get().answer(), false) : null)); } } return Optional.empty(); }
    public static Optional<MaskedQuestion> mask(String sentence, String word) { if (sentence == null || word == null || word.isBlank()) return Optional.empty();
        Pattern p=Pattern.compile("(?iu)(?<![\\p{L}\\p{N}_])" + Pattern.quote(word.trim()) + "(?![\\p{L}\\p{N}_])"); Matcher m=p.matcher(sentence);
        return m.find() ? Optional.of(new MaskedQuestion(sentence.substring(0,m.start()) + "_____" + sentence.substring(m.end()), m.group())) : Optional.empty(); }
    private PracticeQuestionResponse question(ReviewSessionItem item) { String hint=senseRepository.findByVocabularyIdOrderBySenseOrderAsc(item.getUserVocabulary().getVocabulary().getId()).stream()
        .findFirst().map(VocabularySense::getMeaningVi).orElse(null); return new PracticeQuestionResponse(item.getId(), item.getItemOrder(), item.getQuestionType().name(), item.getQuestionContent(), hint, readOptions(item.getOptionsJson())); }
    private List<String> readOptions(String json) { if(json==null||json.isBlank()) return List.of(); try{return objectMapper.readValue(json,new TypeReference<List<String>>(){});}catch(Exception e){throw new InvalidReviewSessionException("Stored question options are invalid.");} }
    private String optionsJson(String answer, boolean meanings) { LinkedHashSet<String> values=new LinkedHashSet<>(); values.add(answer); for(Vocabulary v:vocabularyRepository.findAll()) { if(meanings) { for(VocabularySense s:senseRepository.findByVocabularyIdOrderBySenseOrderAsc(v.getId())) if(s.getMeaningVi()!=null&&!s.getMeaningVi().isBlank()) values.add(s.getMeaningVi()); } else if(v.getWord()!=null&&!v.getWord().isBlank()) values.add(v.getWord()); if(values.size()>=4) break; } List<String> options=new ArrayList<>(values); Collections.shuffle(options); try{return objectMapper.writeValueAsString(options);}catch(Exception e){throw new IllegalStateException("Cannot persist question options",e);} }
    static void applyVocabularyResult(UserVocabulary uv, boolean correct, OffsetDateTime now) { uv.setTotalAttempts(value(uv.getTotalAttempts())+1); uv.setLastReviewedAt(now); uv.setUpdatedAt(now);
        if (correct) { uv.setCorrectCount(value(uv.getCorrectCount())+1); uv.setConsecutiveWrong(0); int score=Math.min(100,value(uv.getMasteryScore())+20); uv.setMasteryScore(score); uv.setLearningStatus(score>=80?LearningStatus.MASTERED:score>=60?LearningStatus.LEARNING:LearningStatus.WEAK); }
        else { uv.setWrongCount(value(uv.getWrongCount())+1); uv.setConsecutiveWrong(value(uv.getConsecutiveWrong())+1); uv.setMasteryScore(Math.max(0,value(uv.getMasteryScore())-20)); uv.setLearningStatus(LearningStatus.WEAK); } }
    private static String normalize(String answer) { return answer.trim().replaceAll("\\s+", " "); }
    private static int value(Integer number) { return number == null ? 0 : number; }
    public record MaskedQuestion(String question, String answer) {} private record QuestionDraft(UserVocabulary userVocabulary, String question, String answer, String hint, String optionsJson) {}
}
