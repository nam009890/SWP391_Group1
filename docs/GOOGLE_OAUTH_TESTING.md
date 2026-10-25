# Google OAuth2 — audit và kiểm tra thật

**LIVE GOOGLE OAUTH: NOT VERIFIED.** Test tự động dùng identity/mock handshake; không đăng nhập Google thật hoặc kiểm chứng client credentials của bạn.

## Luồng đã sửa

1. Login chuyển tới Backend `/oauth2/authorization/google`, origin theo VITE_API_URL.
2. Spring giữ authorization request/state trong session server; JSESSIONID chỉ là handshake HttpOnly/SameSite=Lax, timeout 5 phút. Cookie serialized Java cũ không còn được deserialize.
3. Callback đổi code và đọc verified email/sub từ Google. Lookup Google subject trước; lặp lại không tự tạo user mới khi đã có identity.
4. Từ chối email không verified, subject rỗng/khác, account bị khóa. Không cấp Admin theo email. Account GOOGLE hiện có giữ role, avatar/bio/tên đã chỉnh.
5. Account LOCAL cùng email **không tự merge**, kể cả Google xác minh email: trả OAUTH_LINK_REQUIRED, dùng mật khẩu LOCAL để đăng nhập. Chưa có UI explicit account linking, không giả vờ hỗ trợ. Dữ liệu/role/history cũ được giữ.
6. Callback nạp lại lock dưới row lock, cập nhật lastLoginAt, phát JWT versioned + aid. Redirect chỉ tới app.frontend-url cấu hình, không dùng redirect_uri tùy ý từ browser.
7. JWT ở URL fragment `#token`, frontend tiêu thụ rồi replaceState xoá ngay; không đưa vào query/referrer. Sau đó `/auth/me` xác minh và Navbar dùng profile từ server. Không lưu token trong session cookie.
8. Success/failure dọn session handshake và cookie legacy. Failure chỉ có code allowlist OAUTH_FAILED/ACCOUNT_LOCKED/OAUTH_LINK_REQUIRED, không raw exception trong URL.

Migration `20261025_auth_identity_demo.sql` bổ sung unique filtered Google subject, dừng nếu dữ liệu cũ có subject trùng thay vì xoá history. Cấu hình FRONTEND_URL tin cậy, VITE_API_URL, CORS và Google redirect URI phải khớp host/port thực. OAuth client secret chỉ ở file local ignored hoặc environment như trước; không paste vào báo cáo.

## Checklist bằng Google account thật

- Google Console redirect URI: `http://localhost:8080/login/oauth2/code/google` cho dev mặc định; origin frontend `http://localhost:5173`. HTTPS deployment dùng URI/secure-cookie tương ứng.
- Click Continue with Google; xác nhận về đúng frontend, token không còn trong address bar, profile/role đúng; F5, My Decks và logout đều hoạt động.
- Login lại cùng account không tăng số user hoặc mất profile/Deck. Google không cấp ROLE_ADMIN cho account mới.
- Hủy consent, state sai/hết hạn, thiếu verified email: về Login với thông báo localized, không loop.
- LOCAL cùng email: OAUTH_LINK_REQUIRED, không gộp dữ liệu. Nếu trước đây từng auto-link LOCAL, dùng password hiện có; linking mới cần thiết kế riêng có xác thực cả hai phía.
- Admin khóa Google learner: callback không phát JWT; JWT cũ vẫn bị từ chối sau unlock, phải login mới.
- Dùng browser devtools kiểm tra cookie HttpOnly, SameSite và Secure đúng môi trường, không sao chép token/cookie ra report.

Không thể kết luận live pass chỉ từ unit test hoặc màn Login có nút Google.
