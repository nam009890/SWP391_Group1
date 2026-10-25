# Final system QA — EVMS / StudyE

## Audit và phạm vi

Đã kiểm tra source/schema/tests hiện tại của Authentication, Admin/Profile, Deck, Study/SM-2, Weak Detection/Practice, AI và Grammar. Giữ AI providers thật OPENAI/GEMINI/DEMO_LIBRARY; không có Ollama implementation nên không thêm OLLAMA vào CHECK. Không thay SM-2 formulas, WeaknessRules thresholds, ownership hoặc public/private policy.

Các lỗi chính: thiếu UUID chống token sau reset; OAuth cookie deserialize không an toàn; redirect JWT qua query; auto-link LOCAL theo email; logout chỉ local/cross-tab thiếu; thiếu code error để dịch; labels hai ngôn ngữ lẫn lộn/module-level translation bị cache; dark global input CSS; dropdown fixed không neo trigger; Grammar select min-width tràn mobile. Chi tiết sửa ở AUTHENTICATION_AND_SESSION, GOOGLE_OAUTH_TESTING, I18N_GUIDE, UI_DESIGN_SYSTEM.

## Database

`db/database.sql` vẫn là **table reset thủ công**, không đụng master, không tự chạy. Giữ đủ 15 bảng, các AI CHECK hiện hành; User thêm auth_identity/demo_account, unique auth identity/Google subject. Cập nhật theo yêu cầu sau QA: clean SQL tự tạo bốn account demo có mật khẩu công khai chỉ cho local; xem DEMO_ACCOUNTS.md. Startup bình thường không tự tạo Admin.

Upgrade không mất dữ liệu: auth_identity_demo migration đã chạy thành công trên SQL Server localhost/demo_db ngày 25/10/2026. `db/verify_database.sql` đã chạy và báo SUCCESS; chỉ đọc application data và system catalogs, dùng table variable cho diagnostics. Dữ liệu hiện có, gồm ba batch GEMINI/FAILED, được giữ nguyên. Không chạy database.sql/reset. Hibernate validate và browser trên SQL Server thật chưa được kiểm chứng; browser QA dùng H2 riêng.

## Demo và chạy trên Windows

Xem DEMO_ACCOUNTS.md để nhập ba mật khẩu qua secure prompt và chạy profile demo opt-in. Không có plaintext credential trong tài liệu. SQL Server datasource/JWT/OAuth/AI cấu hình local hiện có được giữ; không in secret.

```powershell
# Từ repository root, sau khi review/chạy migration phù hợp trong SSMS:
# Windows Authentication, database đã tồn tại; không chạy table-reset:
sqlcmd -S localhost -E -d demo_db -I -b -i db/migrations/20261025_auth_identity_demo.sql
sqlcmd -S localhost -E -d demo_db -I -b -i db/verify_database.sql
mvn -f spring-boot-app/pom.xml clean test
mvn -f spring-boot-app/pom.xml clean compile
npm --prefix frontend ci
npm --prefix frontend run check:i18n
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run lint
git diff --check
# Chạy thường ngày, không provisioning:
mvn -f spring-boot-app/pom.xml spring-boot:run
# Terminal khác:
npm --prefix frontend run dev
```

Node 22.13 đã được dùng cho QA; Maven target Java 17. `.env.example` không tự được Spring nạp; đặt environment trong đúng process hoặc IDE Run Configuration. Default frontend 5173/backend 8080, CORS/origins cần khớp.

## Runtime và browser

QA dùng server Spring Boot thật trên 8097 với `jdbc:h2:mem:browserqa;MODE=MSSQLServer`, ddl-auto=create-drop chỉ với **H2 cô lập**, profile demo, API offline. Vite trên 5187, Chrome headless thật. Không dùng SQL Server hiện tại. Test secret runtime ở .qa-local (ignored), không commit/copy vào báo cáo. Playwright cần local QA server/credentials đã chuẩn bị; không trỏ e2e vào production.

Chạy lại browser QA bằng ba terminal riêng tại repository root (cần Chrome cài sẵn):

```powershell
# Terminal 1: tạo H2 và random QA credentials ignored, khởi động Backend test
.\scripts\start-qa.ps1
# Terminal 2: Vite QA đúng origin CORS
.\scripts\start-qa.ps1 -Frontend
# Terminal 3, sau khi cả hai server sẵn sàng:
npm --prefix frontend run test:e2e
```

Dừng hai server sau QA; H2 in-memory biến mất. Không dùng credentials QA cho demo_db thật.

Browser suite kiểm tra login/F5/direct protected URL, create Deck/card, Study, Weak page, locale persistence và unsaved form, logout giữa hai tab + server revocation; admin lock/unlock/auth/audit; năm viewport modal/dropdown; route matrix learner/admin cả vi/en; Weak Practice và AI offline preview/confirm. Screenshot có trong frontend/test-results (ignored), có kiểm tra DOM overflow và màu input. Khi test phát hiện bug, sửa rồi chạy lại; không đánh dấu pass từ compilation.

## Trạng thái cần phân biệt

- Unit/integration Backend dùng H2/mocks, không paid AI calls.
- Browser thật/H2 có thể chứng minh UI/API local, không chứng minh SQL Server locking/migration semantics.
- Google OAuth live **NOT VERIFIED**, cần checklist Google account thật.
- Gemini/OpenAI live **NOT VERIFIED** trong task này; giữ providers và dùng offline/mock regression.
- Forgot/reset password qua email chưa có; không tuyên bố hoạt động.
- Logout offline chỉ xoá browser, server revocation cần request tới server.
- CSP/HTTPS/secret rotation là công việc vận hành deployment, không tự cấu hình máy production.

## Manual acceptance

Admin → Users → khóa/mở learner2, thử login mỗi trạng thái và xem audit. Learner1/2 chỉ chỉnh Deck của mình; khách học public Deck nhưng không lưu private progress. Login → My Decks → F5 → Weak → F5; đổi VI/EN trong form chưa lưu phải giữ nội dung. Mở hai tab, logout một tab, protected operation tab kia bị chặn. Đổi mật khẩu/lock làm JWT cũ vô hiệu; reset tạo UUID account khác. Chạy Google checklist riêng trước khi trình bày rằng Google live đã pass.

## Kết quả thực thi ngày 25/10/2026

- Backend: 250 tests, 0 failures/errors/skipped; Maven clean compile thành công (116 source files, target Java 17).
- React: 7 tests pass; Chrome Playwright: 5 scenarios pass, gồm route matrix VI/EN và năm viewport 320/375/768/1024/1440.
- Frontend build pass; lint: 0 errors, 39 warnings còn từ mã hiện có.
- i18n checker pass: 55 source files, 1.013 references, 12 namespaces; key và interpolation hai locale khớp.
- SQL Server: migration auth_identity_demo và read-only verifier pass. Không reset hoặc xoá bảng/dữ liệu.
- Screenshot QA: [Create Deck 320px](../frontend/test-results/modal-320.png), [dropdown 1440px](../frontend/test-results/dropdown-1440.png). Artifacts ignored; chạy lại e2e để tái tạo.

Bốn tài khoản demo đã được tạo/kiểm thử trên H2 cô lập, **chưa được provision vào demo_db thật**. Automatic approval review chặn việc khởi động initializer vì ghi bền vững tài khoản/quyền Admin, yêu cầu người dùng trực tiếp phê duyệt. Không thử đường vòng. Xem DEMO_ACCOUNTS.md cho danh sách và lệnh reviewable; mật khẩu không được công khai. Google OAuth và Gemini/OpenAI live vẫn chưa được kiểm chứng trong đợt QA này.

## Thay đổi sau QA theo yêu cầu chủ project
Đã gộp cấu hình vào resources/application.properties, bỏ application-local.properties/import. database.sql nay seed sẵn bốn account với BCrypt và mật khẩu demo công khai đã được chấp thuận. Agent không chạy reset; dữ liệu SQL Server hiện tại chưa có các account mới từ reset này. Các ghi chú provisioning bị chặn ở phần kết quả trước đó là lịch sử vòng QA, được thay thế bằng quy trình SQL đơn giản trong DEMO_ACCOUNTS.md.


## Sửa reset SQL ngày 25/10/2026 sau phản hồi chạy không có dữ liệu
Đồng bộ manifest users=4 và kiểm tra Admin/locked; bỏ SET NOEXEC ON trước THROW. Gộp DROP/create/seed/check trong một transaction qua GO. Kiểm thử SQL Server engine thực tế hai lần trên schema riêng trong tempdb: cả hai SUCCESS, 15 bảng/4 users/86 flashcards/80 weak/14 Grammar. Kiểm thử chủ động gây lỗi count 51105: rollback khôi phục sentinel của bảng users cũ; schema QA đã dọn. Không reset bảng dbo của demo_db. Regression BCrypt và AI schema: 6 tests pass. Khi thành công có COMMITTED, account list, counts và SUCCESS, không chỉ Commands completed successfully.
