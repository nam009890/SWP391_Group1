package com.example.demo.weakvocabulary.service;

import com.example.demo.weakvocabulary.dto.WeakDtos.*;

public interface WeakPracticeService {
    SessionResponse start(Long userId, PracticeStartRequest request);

    SessionResponse session(Long userId, Long id);

    AnswerResponse answer(Long userId, Long sessionId, Long itemId, AnswerRequest request);

    SummaryResponse summary(Long userId, Long id);
}
