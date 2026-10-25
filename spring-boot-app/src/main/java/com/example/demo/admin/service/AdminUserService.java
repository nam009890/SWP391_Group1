package com.example.demo.admin.service;
import com.example.demo.admin.dto.AdminDtos.*;
import com.example.demo.admin.entity.AdminUserActionLog;
import com.example.demo.admin.repository.AdminUserActionLogRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.flashcard.repository.*;
import com.example.demo.flashcard.entity.DeckVisibility;
import com.example.demo.common.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.*;
import java.time.*;
@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class AdminUserService {
    private final UserRepository users;
    private final DeckRepository decks;
    private final FlashcardRepository cards;
    private final AdminUserActionLogRepository logs;
    public Dashboard dashboard() {
        return new Dashboard(users.count(),users.countByLocked(false),users.countByLocked(true),users.countByRole("ROLE_ADMIN"),
                decks.countByDeletedFalse(),decks.countByDeletedFalseAndVisibility(DeckVisibility.PUBLIC),
                decks.countByDeletedFalseAndVisibility(DeckVisibility.PRIVATE),cards.countByDeckDeletedFalse());
    }
    public Paged<UserItem> list(int page,int size,String keyword,String role,String status,String sort) {
        validatePage(page,size);
        if (!Set.of("ALL","ROLE_USER","ROLE_ADMIN").contains(role)) throw new IllegalArgumentException("Vai trò không hợp lệ");
        if (!Set.of("ALL","ACTIVE","LOCKED").contains(status)) throw new IllegalArgumentException("Trạng thái không hợp lệ");
        String key = keyword.trim().toLowerCase(Locale.ROOT);
        if (key.length() > 255) throw new IllegalArgumentException("Từ khóa quá dài");
        Specification<User> spec = (root,q,cb) -> {
            List<Predicate> conditions = new ArrayList<>();
            if (!key.isEmpty()) {
                // Escape wildcard để tìm kiếm chuỗi literal thay vì mẫu do người dùng điều khiển.
                String pattern = "%" + key.replace("!","!!").replace("%","!%").replace("_","!_").replace("[","![") + "%";
                conditions.add(cb.or(cb.like(cb.lower(root.get("name")),pattern,'!'),cb.like(cb.lower(root.get("email")),pattern,'!')));
            }
            if (!"ALL".equals(role)) conditions.add(cb.equal(cb.coalesce(root.get("role"),"ROLE_USER"),role));
            if (!"ALL".equals(status)) conditions.add(cb.equal(root.get("locked"),"LOCKED".equals(status)));
            return cb.and(conditions.toArray(Predicate[]::new));
        };
        Sort order = switch(sort) {
            case "NEWEST" -> Sort.by(Sort.Direction.DESC,"createdAt");
            case "OLDEST" -> Sort.by("createdAt");
            case "NAME_ASC" -> Sort.by("name");
            case "NAME_DESC" -> Sort.by(Sort.Direction.DESC,"name");
            case "EMAIL_ASC" -> Sort.by("email");
            case "EMAIL_DESC" -> Sort.by(Sort.Direction.DESC,"email");
            default -> throw new IllegalArgumentException("Thứ tự sắp xếp không hợp lệ");
        };
        return Paged.from(users.findAll(spec,PageRequest.of(page,size,order.and(Sort.by("id")))).map(UserItem::from));
    }
    public UserDetails details(Long id) {
        User u = find(id);
        return new UserDetails(UserItem.from(u),u.getBio(),u.getUpdatedAt(),u.getLastLoginAt(),u.getLockedAt(),
                u.getLockedReason(),u.getLockedBy(),decks.countByDeletedFalseAndOwnerId(id));
    }
    @Transactional
    public UserDetails transition(Long actorId,Long targetId,boolean lock,String reason) {
        User actor = find(actorId);
        // Xác minh lại actor từ database; không nhận adminId trong request JSON.
        if (actor.isLocked() || !"ROLE_ADMIN".equals(actor.getRole())) throw new BusinessException(403,"ACCESS_DENIED","Bạn không có quyền quản trị");
        if (targetId == null || targetId <= 0) throw new IllegalArgumentException("ID không hợp lệ");
        User target = users.findForUpdate(targetId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if (actorId.equals(targetId) || "ROLE_ADMIN".equals(target.getRole())) {
            throw new BusinessException(403,"ADMIN_PROTECTED","Không thể thay đổi khóa của chính mình hoặc quản trị viên");
        }
        if (target.isLocked() == lock) throw new BusinessException(409,"ACCOUNT_STATE_CONFLICT",lock ? "Tài khoản đã bị khóa" : "Tài khoản đang hoạt động");
        String cleanReason = reason == null ? "" : reason.trim();
        if (lock && (cleanReason.length() < 5 || cleanReason.length() > 500)) throw new IllegalArgumentException("Lý do khóa cần 5–500 ký tự");
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        target.setLocked(lock);
        target.setLockedAt(lock ? now : null);
        target.setLockedReason(lock ? cleanReason : null);
        target.setLockedBy(lock ? actorId : null);
        // Không giảm tokenVersion khi mở khóa: token đã thu hồi không thể sống lại.
        target.setTokenVersion(target.getTokenVersion() + 1);
        users.save(target);
        AdminUserActionLog log = new AdminUserActionLog();
        log.setAdmin(actor);
        log.setTargetUser(target);
        log.setAction(lock ? "LOCK_USER" : "UNLOCK_USER");
        log.setReason(lock ? cleanReason : null);
        log.setCreatedAt(now);
        logs.save(log);
        return details(targetId);
    }
    private User find(Long id) {
        if (id == null || id <= 0) throw new IllegalArgumentException("ID không hợp lệ");
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }
    public static void validatePage(int page,int size) {
        if (page < 0 || size < 1 || size > 100) throw new IllegalArgumentException("Trang phải >= 0; số dòng từ 1 đến 100");
    }
}
