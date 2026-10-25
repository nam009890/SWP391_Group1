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

## Rà soát UI bổ sung theo ảnh người dùng — 25/10/2026

- Form thêm thẻ: thiếu layout/size riêng sau khi CSS modal được scope. Đã dùng grid hai cột desktop, một cột dưới 768px; label ở trên input, input đầy cột, cao tối thiểu 46px, focus ring và nút lưu đầy chiều ngang mobile. Bổ sung htmlFor/id, required/maxlength, disabled khi lưu và role=alert. Style form-row/form-actions được scope trong add-card-form để tránh ảnh hưởng màn khác.
- VI/EN: chuyển CSS từ Navbar vào LanguageSwitcher.css, dùng font kế thừa, line-height cố định, cùng kích thước nút và khoảng đệm. Dùng được độc lập cả Navbar/modal, giữ aria-pressed.
- Deck: wrap nhóm action/header, nội dung dài không đẩy tràn; sửa màu số thứ tự và vạch chia từ theme tối sang token hiện tại.
- Grammar: đổi nền live preview và loại bỏ màu nền tối hardcode của hộp in/báo lỗi. Hai modal dùng React portal vào document.body để thoát stacking context do animation của trang, không còn bị Navbar che. Bố cục phần đầu đề thi và options chuyển dọc trên màn hình nhỏ bằng media screen; không đổi bố cục A4 khi in/export.
- Đã kiểm tra Chrome các route Deck/Profile/Weak/Practice/Grammar/CMS/Admin cả VI/EN, modal/dropdown trên năm viewport, form thêm thẻ tại 320/375/768/1440 và sau khi mở Grammar. Bộ 7 kịch bản E2E pass; modal portal và form được kiểm tra lại riêng sau bản sửa cuối. React 9 tests pass; production build/i18n pass; lint 0 errors, 39 warnings có sẵn.
- QA dùng H2 riêng, không tác động SQL Server thật, không gửi report/email hoặc gọi AI trả phí. Ảnh test nằm frontend/test-results (ignored, được tạo lại mỗi lần chạy); bản ảnh đối chiếu cuối trong .qa-local/ui-review (ignored).
