package com.example.demo.admin.dto;
import com.example.demo.user.entity.User;
import com.example.demo.admin.entity.AdminUserActionLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
public final class AdminDtos {
    private AdminDtos() {}
    public record LockRequest(String reason) {}
    public record Dashboard(long totalUsers,long activeUsers,long lockedUsers,long totalAdmins,
            long totalDecks,long publicDecks,long privateDecks,long totalFlashcards) {}
    public record UserItem(Long id,String name,String email,String avatarUrl,String provider,String role,
            String status,LocalDateTime createdAt) {
        public static UserItem from(User u) {
            return new UserItem(u.getId(),u.getName(),u.getEmail(),u.getAvatarUrl(),u.getProvider(),
                    u.getRole() == null ? "ROLE_USER" : u.getRole(), u.isLocked() ? "LOCKED" : "ACTIVE",u.getCreatedAt());
        }
    }
    public record UserDetails(UserItem account,String bio,LocalDateTime updatedAt,LocalDateTime lastLoginAt,
            LocalDateTime lockedAt,String lockedReason,Long lockedBy,long ownedDeckCount) {}
    public record Audit(Long id,Long adminId,String adminName,String adminEmail,Long targetUserId,
            String targetUserName,String targetUserEmail,String action,String reason,LocalDateTime createdAt) {
        public static Audit from(AdminUserActionLog l) {
            return new Audit(l.getId(),l.getAdmin().getId(),l.getAdmin().getName(),l.getAdmin().getEmail(),
                    l.getTargetUser().getId(),l.getTargetUser().getName(),l.getTargetUser().getEmail(),l.getAction(),l.getReason(),l.getCreatedAt());
        }
    }
    public record Paged<T>(List<T> content,int number,int size,long totalElements,int totalPages,boolean first,boolean last) {
        public static <T> Paged<T> from(Page<T> page) {
            return new Paged<>(page.getContent(),page.getNumber(),page.getSize(),page.getTotalElements(),page.getTotalPages(),page.isFirst(),page.isLast());
        }
    }
}
