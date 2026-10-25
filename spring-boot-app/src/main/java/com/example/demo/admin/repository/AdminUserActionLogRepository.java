package com.example.demo.admin.repository;
import com.example.demo.admin.entity.AdminUserActionLog;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
public interface AdminUserActionLogRepository extends JpaRepository<AdminUserActionLog,Long>, JpaSpecificationExecutor<AdminUserActionLog> {
    @Override @EntityGraph(attributePaths={"admin","targetUser"})
    Page<AdminUserActionLog> findAll(org.springframework.data.jpa.domain.Specification<AdminUserActionLog> spec, Pageable pageable);
}
