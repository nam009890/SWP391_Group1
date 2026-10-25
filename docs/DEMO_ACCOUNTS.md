# Tài khoản demo local

Chạy **toàn bộ `db/database.sql`** trong SSMS trên `demo_db` đã tồn tại. Script reset các bảng ứng dụng và tự tạo bốn tài khoản; không cần profile demo, biến mật khẩu hoặc initializer. Agent chưa chạy reset này.

| Email | Mật khẩu demo | Vai trò | Trạng thái |
|---|---|---|---|
| admin@studye.test | AdminDemo@123 | ROLE_ADMIN | ACTIVE |
| learner1@studye.test | LearnerDemo@123 | ROLE_USER | ACTIVE |
| learner2@studye.test | LearnerDemo@123 | ROLE_USER | ACTIVE |
| locked@studye.test | LockedDemo@123 | ROLE_USER | LOCKED |

Đây là mật khẩu công khai được chủ project chấp thuận cho local demo; không dùng trên deployment thật. SQL lưu hash BCrypt, không lưu plaintext. Mỗi lần reset sẽ khôi phục các mật khẩu/trạng thái này và xóa dữ liệu cũ trong các bảng ứng dụng. Learner1 sở hữu bộ học liệu mẫu; các account khác có thể tạo Deck sau login. Admin mở khóa locked account để thử đăng nhập.

Backend chạy bình thường: `mvn -f spring-boot-app/pom.xml spring-boot:run`. Không bật `DEMO_SEED_ENABLED` cho quy trình SQL này. Initializer opt-in vẫn được giữ để tương thích QA/H2, không cần dùng khi đã chạy SQL.

Cấu hình Backend chỉ còn `spring-boot-app/src/main/resources/application.properties`; file application-local.properties và config import đã bỏ. Giá trị local được giữ khi gộp. Trước khi đẩy Git, chạy `powershell -File scripts/clear-config-secrets.ps1` để thay các credential trong đúng file này bằng environment placeholders, rồi review diff. Script không xóa secrets khỏi Git history cũ. Sau khi scrub, đặt biến môi trường tương ứng khi chạy Backend.
