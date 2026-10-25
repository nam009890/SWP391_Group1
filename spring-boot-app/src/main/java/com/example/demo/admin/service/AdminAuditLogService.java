package com.example.demo.admin.service;
import com.example.demo.admin.dto.AdminDtos.*;
import com.example.demo.admin.entity.AdminUserActionLog;
import com.example.demo.admin.repository.AdminUserActionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import java.util.Set;
@Service @RequiredArgsConstructor
public class AdminAuditLogService {
    private final AdminUserActionLogRepository logs;
    @Transactional(readOnly=true)
    public Paged<Audit> list(int page,int size,Long targetUserId,Long adminId,String action) {
        AdminUserService.validatePage(page,size);
        if ((targetUserId != null && targetUserId <= 0) || (adminId != null && adminId <= 0)) throw new IllegalArgumentException("ID không hợp lệ");
        if (!Set.of("ALL","LOCK_USER","UNLOCK_USER").contains(action)) throw new IllegalArgumentException("Hành động không hợp lệ");
        Specification<AdminUserActionLog> spec = (r,q,cb) -> cb.and(
                targetUserId == null ? cb.conjunction() : cb.equal(r.get("targetUser").get("id"),targetUserId),
                adminId == null ? cb.conjunction() : cb.equal(r.get("admin").get("id"),adminId),
                "ALL".equals(action) ? cb.conjunction() : cb.equal(r.get("action"),action));
        return Paged.from(logs.findAll(spec,PageRequest.of(page,size,Sort.by(Sort.Direction.DESC,"createdAt","id"))).map(Audit::from));
    }
}
