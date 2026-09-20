package com.example.demo.study.controller;

import com.example.demo.common.security.CurrentUser;
import com.example.demo.common.security.UserPrincipal;
import com.example.demo.flashcard.dto.FlashcardResponse;
import com.example.demo.study.dto.ReviewDto;
import com.example.demo.study.dto.ReviewResponse;
import com.example.demo.study.service.StudyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;

    @GetMapping("/decks/{deckId}/due")
    public ResponseEntity<List<FlashcardResponse>> getFlashcardsToStudy(
            @PathVariable Long deckId,
            @CurrentUser UserPrincipal userPrincipal) {
        List<FlashcardResponse> dueCards = studyService.getFlashcardsToStudy(deckId, userPrincipal.getId());
        return ResponseEntity.ok(dueCards);
    }

    @PostMapping("/flashcards/{flashcardId}/review")
    public ResponseEntity<ReviewResponse> reviewFlashcard(
            @PathVariable Long flashcardId,
            @RequestBody ReviewDto reviewDto,
            @CurrentUser UserPrincipal userPrincipal) {
        
        ReviewResponse updatedReview = studyService.processReview(
                userPrincipal.getId(), 
                flashcardId, 
                reviewDto.getQuality()
        );
        return ResponseEntity.ok(updatedReview);
    }
}
