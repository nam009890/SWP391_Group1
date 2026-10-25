# Hệ thống giao diện Việt / Anh

`frontend/src/i18n/index.js` cấu hình i18next/react-i18next. Mặc định vi; localStorage `studye.language` chỉ nhận vi/en. Navbar và modal Create Deck có VI/EN, aria-pressed, keyboard focus. Đổi ngôn ngữ không reload/remount route, không sửa token, form, Practice state hoặc database. Language giữ qua logout/F5/OAuth redirect; html lang cập nhật.

## Tổ chức

`src/i18n/locales/{vi,en}/` chia namespace common, navigation, auth, profile, admin, decks, study, weakVocabulary, practice, ai, grammar, validation. File JSON hai ngôn ngữ có cùng key; key mô tả nguồn kèm suffix ổn định để tránh trùng. `t('namespace:key', { name: value })` dùng interpolation, không nối learner data vào khóa dịch.

App dùng useTranslation để re-render toàn cây UI mà không reset component state. Nhãn trong array/map ở module scope phải là factory được gọi khi render, không gọi t một lần lúc import. Dates/numbers dùng Intl với vi-VN/en-US; giữ raw số/enum trong request. localizeMessage chỉ áp dụng feedback hệ thống lưu trong state, không áp dụng học liệu.

## Chính sách nội dung

Dịch nhãn, menu, validation, form placeholder, empty/loading/error, sort/filter, feedback và confirmation của mọi module. **Không dịch** Deck name/description, vocabulary/meaning/IPA/example, Grammar payload, AI output hoặc ghi chú người học từ API. Brand StudyE, Google và machine code OPENAI/GEMINI/DEMO_LIBRARY không đổi; nhãn PUBLIC/PRIVATE hiển thị có dịch nhưng value gửi server giữ nguyên.

Backend tiếp tục trả code ổn định. Axios dùng `validation:CODE`; code lạ fallback thông báo request thất bại an toàn. Không dump stack trace hoặc dịch tự động prose server bằng dịch vụ bên ngoài. Backend lỗi validation/not-found/internal đã có code bổ sung, giữ contract message/status trước đây.

## Thêm nhãn mới

1. Thêm key có ý nghĩa vào cả vi và en cùng namespace; không để empty string.
2. Dùng t tại render/handler/factory, giữ cùng placeholders giữa hai locale.
3. Không dịch trong useState để biến nội dung người học khi chuyển language; feedback lưu state dùng localizeMessage nếu cần cập nhật.
4. `npm run check:i18n` kiểm tra key trùng, key thiếu, placeholder lệch, key t không tồn tại, raw JSX text/attribute và template Việt chưa đưa vào catalog. Brand/URL placeholders có allowlist nhỏ, không whitelist hàng loạt route.
5. Chạy `npm test`, build/lint, mở route cả hai language trên mobile và desktop. Static scanner không tự chứng minh mọi chuỗi động đều đúng ngữ nghĩa; browser route QA bổ sung và vẫn cần review khi thêm feature mới.

Học liệu mẫu trong Grammar model được loại khỏi scan UI vì là nội dung giáo dục. Nội dung này không được “dịch” chỉ để làm checker xanh.
