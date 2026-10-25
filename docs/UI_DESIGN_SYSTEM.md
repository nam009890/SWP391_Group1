# Design system StudyE

Giữ nền kem, nâu chủ đạo, accent ấm và card bo tròn. Không thêm UI framework. `frontend/src/theme.css` là nguồn token: --bg-color, --surface, --surface-elevated, --primary, --text-main, --text-muted, --input-bg, --input-text, --placeholder, --border-default/focus, --focus-ring, --error/success/warning, --disabled-bg, --radius và --space-1/2/3/4/6. Typography Segoe UI/system, line-height 1.6.

Input nền #fffefb, text #4b3428, placeholder #786457; không giảm opacity cả component để tạo disabled. Focus-visible có outline; disabled có màu riêng. Ordinary text nhắm WCAG AA, vẫn cần contrast review khi thêm palette. Theme cũ còn một số selector quan trọng/inline style; công việc này không reformat toàn bộ CSS không liên quan.

## Root cause và sửa thực tế

CreateDeckModal.css trước đây khai báo `.glass-input` toàn cục với RGBA nền slate tối, focus xanh và placeholder opacity thấp; CSS lazy-load ghi đè theme. Đã scope toàn bộ vào `.deck-modal-content`, dùng token warm, bỏ gray giả disabled. Select/textarea giống input. Overlay/modal có padding 16px, max-height theo 100dvh, overflow-y:auto, footer wrap; ở 320/375px nút không bị ép xuống chữ rời. Có focus trap, autofocus, trả focus khi đóng, Escape và body scroll lock. Selector language ngay trong modal để không phải click nền bị overlay chặn khi đổi ngôn ngữ.

Navbar dropdown trước dùng position:fixed/right:16px và menu overflow-x:auto, không neo profile trigger. Nay details relative, dropdown absolute dưới summary, width giới hạn viewport; outside pointer/Escape/route change đóng menu. Native summary hỗ trợ Enter/Space và các button Tab được. Mobile <=1100px có menu riêng cuộn trong viewport, dropdown nằm trong anchor layout; không giấu text thành first-letter. Logo/menu/language không chồng nhau ở 320px.

Grammar CMS có select inline minWidth 320/240px và wrapper fit-content gây tràn ngang trên 375px. Đã bỏ minWidth cố định, width 100% trong wrapper maxWidth 480px. Không dùng chuỗi !important để che nguyên nhân. Màu step CMS dùng token primary/success thay random neon.

## Quy ước

- Button tối thiểu 42px, focus rõ, label không phụ thuộc màu.
- Form dùng label và validation dễ đọc; input/textarea/select cùng surface.
- Table bọc vùng scroll ngang riêng, không làm cả trang tràn.
- Modal nằm trong viewport, nội dung dài scroll, hành động không clip; không đặt fixed width lớn.
- Menu luôn có anchor, close handlers và z-index phù hợp; tránh hover boundary gây flicker.
- Empty/loading/error dùng token và locale; nội dung người học wrap mà không bị dịch.
- QA tối thiểu 320/375/768/1024/1440; kiểm tra cả tiếng Việt và Anh, không chỉ screenshot ở desktop.

Playwright chạy Chrome thật với local H2 và lưu screenshot trong frontend/test-results (ignored). Đây không phải test SQL Server hoặc Google live. Chỉ báo browser pass sau khi suite thực sự hoàn tất; kết quả mới nhất ở FINAL_SYSTEM_QA.md.
