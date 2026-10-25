package com.example.demo.study.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class LearningActivityLock {
    private final UserRepository users;
    private final EntityManager entityManager;

    @Transactional(propagation = Propagation.MANDATORY)
    public User acquire(Long userId) {
        if (userId == null) {
            throw new BusinessException(401, "UNAUTHENTICATED", "Vui lòng đăng nhập");
        }
        // Khóa hàng cha luôn tồn tại, kể cả khi progress/weak record chưa được tạo.
        // Cùng thứ tự khóa cho Study, manual add/delete và Weak Practice để tránh lost update.
        User user = users.findForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        entityManager.refresh(user, LockModeType.PESSIMISTIC_WRITE);
        if (user.isLocked()) {
            throw new BusinessException(403, "ACCOUNT_LOCKED", "Tài khoản của bạn đã bị khóa");
        }
        return user;
    }
}
