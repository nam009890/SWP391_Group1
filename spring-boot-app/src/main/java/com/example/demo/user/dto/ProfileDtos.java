package com.example.demo.user.dto;
import com.example.demo.user.entity.User;
import java.time.LocalDateTime;
public final class ProfileDtos {
    private ProfileDtos() {}
    public record Update(String name, String avatarUrl, String bio) {}
    public record Password(String currentPassword, String newPassword, String confirmPassword) {}
    public record Profile(Long id, String name, String email, String avatarUrl, String bio,
            String provider, String role, LocalDateTime createdAt) {
        public static Profile from(User u) {
            return new Profile(u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl(), u.getBio(),
                    u.getProvider(), u.getRole() == null ? "ROLE_USER" : u.getRole(), u.getCreatedAt());
        }
    }
}
