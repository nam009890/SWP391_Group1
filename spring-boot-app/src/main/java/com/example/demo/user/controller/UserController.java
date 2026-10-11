package com.example.demo.user.controller;


import com.example.demo.common.security.UserPrincipal;
import com.example.demo.common.security.CurrentUser;
import com.example.demo.user.dto.UserProfileDto;
import com.example.demo.user.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final FollowService followService;
    private final com.example.demo.user.repository.UserRepository userRepository;

    @PostMapping("/{userId}/follow")
    public ResponseEntity<Void> followUser(@CurrentUser UserPrincipal userPrincipal, @PathVariable Long userId) {
        followService.followUser(userPrincipal.getId(), userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<Void> unfollowUser(@CurrentUser UserPrincipal userPrincipal, @PathVariable Long userId) {
        followService.unfollowUser(userPrincipal.getId(), userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<List<UserProfileDto>> getFollowers(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.getFollowers(userId));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<List<UserProfileDto>> getFollowing(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.getFollowing(userId));
    }

    @GetMapping("/{userId}/is-following")
    public ResponseEntity<Boolean> isFollowing(@CurrentUser UserPrincipal userPrincipal, @PathVariable Long userId) {
        return ResponseEntity.ok(followService.isFollowing(userPrincipal.getId(), userId));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileDto> getUserProfile(@PathVariable Long userId) {
        com.example.demo.user.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserProfileDto dto = UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .build();
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileDto> updateProfile(@CurrentUser UserPrincipal userPrincipal, @RequestBody UserProfileDto request) {
        com.example.demo.user.entity.User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
            userRepository.save(user);
        }

        UserProfileDto dto = UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .build();
        return ResponseEntity.ok(dto);
    }
}
