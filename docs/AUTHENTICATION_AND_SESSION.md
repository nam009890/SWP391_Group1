# Xác thực, phiên và logout

## Mô hình thật

API dùng Bearer JWT, token lưu một lần ở localStorage key `token`; không có refresh token. Spring Security STATELESS không dùng JSESSIONID để xác thực API. Trình duyệt chỉ có HttpOnly session cookie cho **OAuth authorization handshake**, lưu state phía server tối đa năm phút. Hai cơ chế không thay thế nhau.

LOCAL login tra tài khoản, khoá hàng khi kiểm tra, xác minh BCrypt trước khi thông báo khóa, cập nhật lastLoginAt rồi phát JWT. Role không lấy từ request đăng ký hoặc tin vào claim phía client: mỗi protected request nạp lại role/lock/tokenVersion từ database. Register chỉ tạo ROLE_USER. Password reset qua email chưa được triển khai, không có tuyên bố “Forgot password hoạt động”.

## JWT và reset database

JWT HS512 có subject=email, `ver` và `aid` (auth_identity UUID của account), hạn 24 giờ. Backend kiểm tra chữ ký, thời hạn, account tồn tại, khóa, tokenVersion và auth_identity. Token thiếu aid sau nâng cấp bị từ chối; người dùng phải login lại. UUID được tạo mới khi tạo lại account, kể cả numeric ID/email/version trùng sau reset. Migration backfill UUID một lần cho user cũ, không thay password/role/history. Restore backup giữ nguyên UUID/version cũ thì **rotate JWT_SECRET** để vô hiệu phiên trước restore.

Default dev không có JWT_SECRET dùng signing key ngẫu nhiên mỗi lần boot, nên restart cũng thu hồi phiên. Prod/production yêu cầu secret riêng ít nhất 64 byte; không in secret, không commit. Cùng một triển khai nhiều instance cần secret ổn định dùng chung được quản lý an toàn.

## Frontend và nhiều tab

Khi F5/direct URL, App kiểm tra expiry cơ bản rồi gọi `/api/auth/me`; route đợi checkingAuth, Navbar không flash quyền giả. Payload decode ở frontend chỉ phục vụ timing, không quyết định quyền. Lỗi mạng khi rehydrate cho màn retry, không tự xem là đã logout. Axios xử lý 401 một lần qua auth-expired, không tự refresh hoặc gọi login lặp. HTTP error code được dịch ở frontend, không render stack trace.

Storage event đồng bộ login/logout qua tab; window focus tải lại profile để cập nhật role/lock. Admin khóa hoặc password change làm tokenVersion tăng; request tiếp theo bị từ chối, kể cả UI đang cũ. Browser Back không vượt được ProtectedRoute hoặc Backend.

## Logout thực sự

Navbar/Profile/Admin dùng một handler: chụp Authorization trước khi xoá localStorage, gọi POST `/api/auth/logout`, luôn xoá state cục bộ ngay, kể cả offline. Backend lock hàng và tăng tokenVersion, thu hồi tất cả JWT hiện tại của account. Khi không có mạng/request không tới server, chỉ có local logout; token bị sao chép ở nơi khác không được bảo đảm thu hồi cho tới expiry hoặc thao tác revocation sau đó. Không đánh đồng clear localStorage với server revocation.

Password change và lock/unlock tăng version; mở khóa không phục hồi token cũ. Cần login mới sau đổi mật khẩu/mở khóa.

## Cookie, CSRF và XSS

Cookie handshake HttpOnly/SameSite=Lax cho callback GET từ Google; `SESSION_COOKIE_SECURE=true` khi HTTPS production. OAuth state được Spring kiểm tra từ session server, không deserialize Java object từ cookie tùy ý. Cookie legacy chỉ bị xoá, không được đọc thành object. CSRF của Bearer API không dựa cookie; OAuth login-CSRF dùng state. CORS chỉ whitelist origin cấu hình, không mở wildcard để sửa lỗi UI.

localStorage có nguy cơ XSS: React escape nội dung, không nhúng token vào query, không log token, không tự render learner HTML. Export đề thi dùng DOM đã escape từ React. Đây là tradeoff giữ kiến trúc hiện tại, không phải bằng chứng loại bỏ mọi XSS; HTTPS, CSP/reverse proxy và bảo vệ máy dev vẫn cần vận hành đúng.
