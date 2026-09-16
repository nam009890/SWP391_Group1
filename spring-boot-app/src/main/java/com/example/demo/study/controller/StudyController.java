package com.example.demo.study.controller;

import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.study.dto.ReviewDto;
import com.example.demo.study.entity.UserFlashcardReview;
import com.example.demo.study.service.StudyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@RestController
@RequestMapping("/api/study")
public class StudyController {

    @Autowired
    private StudyService studyService;

    @Autowired
    private com.example.demo.user.repository.UserRepository userRepository;

    // Get User ID from SecurityContext
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("User is not authenticated");
        }
        
        org.springframework.security.core.userdetails.UserDetails userDetails = 
                (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal();
                
        return userRepository.findByEmail(userDetails.getUsername())
                .map(com.example.demo.user.entity.User::getId)
                .orElseThrow(() -> new RuntimeException("User not found in database"));
    }

    @GetMapping("/decks/{deckId}/due")
    public ResponseEntity<List<Flashcard>> getFlashcardsToStudy(@PathVariable Long deckId) {
        List<Flashcard> dueCards = studyService.getFlashcardsToStudy(deckId, getCurrentUserId());
        return ResponseEntity.ok(dueCards);
    }

    @PostMapping("/flashcards/{flashcardId}/review")
    public ResponseEntity<UserFlashcardReview> reviewFlashcard(
            @PathVariable Long flashcardId,
            @RequestBody ReviewDto reviewDto) {
        
        try {
            UserFlashcardReview updatedReview = studyService.processReview(
                    getCurrentUserId(), 
                    flashcardId, 
                    reviewDto.getQuality()
            );
            return ResponseEntity.ok(updatedReview);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
