package com.example.demo.user.service;
import com.example.demo.user.dto.ProfileDtos.*;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.common.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.net.URI;
@Service @RequiredArgsConstructor
public class ProfileService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final jakarta.persistence.EntityManager entityManager;
    @Transactional(readOnly=true)
    public Profile get(Long id) { return Profile.from(find(id)); }
    private User find(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
    }
    @Transactional
    public Profile update(Long id, Update request) {
        User u = users.findForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        // Làm mới sau khi lấy khóa để không ghi đè trạng thái bảo mật từ request đồng thời.
        entityManager.refresh(u, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        ensureActive(u);
        String name = request.name() == null ? "" : request.name().trim();
        if (name.length() < 2 || name.length() > 100) throw new IllegalArgumentException("Tên phải có 2–100 ký tự");
        String avatar = trim(request.avatarUrl());
        if (avatar != null) {
            try {
                URI uri = URI.create(avatar);
                if (avatar.length() > 255 || uri.getHost() == null || uri.getUserInfo() != null ||
                        !("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))) {
                    throw new IllegalArgumentException();
                }
            } catch (IllegalArgumentException e) { throw new IllegalArgumentException("Ảnh đại diện phải là URL HTTP(S) hợp lệ, tối đa 255 ký tự"); }
        }
        String bio = trim(request.bio());
        if (bio != null && bio.length() > 500) throw new IllegalArgumentException("Giới thiệu tối đa 500 ký tự");
        // Chỉ cập nhật các trường được phép; bỏ qua role, email và trạng thái do client gửi.
        u.setName(name);
        u.setAvatarUrl(avatar);
        u.setBio(bio);
        return Profile.from(users.save(u));
    }
    @Transactional
    public void password(Long id, Password request) {
        User u = users.findForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        // Làm mới sau khi lấy khóa để không ghi đè trạng thái bảo mật từ request đồng thời.
        entityManager.refresh(u, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        ensureActive(u);
        if (!"LOCAL".equals(u.getProvider()) || u.getPassword() == null) {
            throw new BusinessException(409,"GOOGLE_PASSWORD_MANAGED","Mật khẩu tài khoản này được quản lý qua Google");
        }
        if (request.currentPassword() == null || !encoder.matches(request.currentPassword(), u.getPassword())) {
            throw new BusinessException(400,"CURRENT_PASSWORD_INVALID","Mật khẩu hiện tại không đúng");
        }
        validatePassword(request.newPassword());
        if (!request.newPassword().equals(request.confirmPassword())) throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
        if (encoder.matches(request.newPassword(), u.getPassword())) throw new IllegalArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại");
        u.setPassword(encoder.encode(request.newPassword()));
        // Tăng phiên bản để mọi JWT cũ không thể dùng lại.
        u.setTokenVersion(u.getTokenVersion() + 1);
        users.save(u);
    }
    public static void validatePassword(String password) {
        if (password == null || password.length() < 10 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72 ||
                !password.matches(".*[a-z].*") || !password.matches(".*[A-Z].*") || !password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("Mật khẩu cần ít nhất 10 ký tự, có chữ hoa, chữ thường và số; tối đa 72 byte");
        }
    }
    private void ensureActive(User u) {
        if (u.isLocked()) throw new BusinessException(403,"ACCOUNT_LOCKED","Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
    }
    private String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
