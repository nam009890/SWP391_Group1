package com.example.demo.user.controller;
import com.example.demo.common.security.*;
import com.example.demo.user.dto.ProfileDtos.*;
import com.example.demo.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
@RestController @RequestMapping("/api/profile/me") @RequiredArgsConstructor
public class UserController {
    private final ProfileService profiles;
    @GetMapping public Profile me(@CurrentUser UserPrincipal principal) { return profiles.get(principal.getId()); }
    @PutMapping public Profile update(@CurrentUser UserPrincipal principal, @RequestBody Update body) {
        return profiles.update(principal.getId(), body);
    }
    @PutMapping("/password") public ResponseEntity<Void> password(@CurrentUser UserPrincipal principal, @RequestBody Password body) {
        profiles.password(principal.getId(), body);
        return ResponseEntity.noContent().build();
    }
}
