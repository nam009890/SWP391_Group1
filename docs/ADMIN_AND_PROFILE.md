# Quản trị tài khoản và hồ sơ cá nhân — EVMS / StudyE

## 1. Kiến trúc

- `user/entity/User`: bổ sung trạng thái khóa, metadata, thời gian UTC, bio và tokenVersion.
- `user/dto/ProfileDtos`: DTO hồ sơ, cập nhật hồ sơ và đổi mật khẩu. Không trả entity User.
- `user/service/ProfileService`: chuẩn hóa, kiểm tra dữ liệu, cập nhật hồ sơ và BCrypt password.
- `user/controller/UserController`: `/api/profile/me` và `/password`.
- `admin/controller`: dashboard, danh sách/chi tiết người dùng, khóa/mở khóa và audit chỉ đọc.
- `admin/service/AdminUserService`: truy vấn count, Specification phân trang, transaction khóa/mở khóa.
- `admin/service/AdminAuditLogService`: phân trang, lọc nhật ký.
- `admin/entity/AdminUserActionLog`, repository: lưu người thao tác thực tế và người bị tác động.
- `common/security`: principal có quyền từ database; filter JWT kiểm tra database mỗi request; OAuth kiểm tra email_verified, subject và trạng thái.
- Frontend dùng chung state user tại App; `/api/auth/me` là nguồn xác thực. Profile cập nhật xong gọi lại endpoint này để Navbar phản ánh ngay.

Không sửa mô hình quyền sở hữu deck, không xóa tài khoản hoặc lịch sử học. Grammar vẫn cho thành viên tạo nội dung cộng đồng; các request thay đổi dữ liệu cần đăng nhập. Các GET công khai giữ nguyên.

## 2. Database và migration

File: `db/migrations/20261025_admin_profile.sql`.

Cột thêm vào `dbo.users`:

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| locked | BIT NOT NULL DEFAULT 0 | Cờ tài khoản bị khóa |
| locked_at | DATETIME2 NULL | Thời điểm khóa UTC |
| locked_reason | NVARCHAR(500) NULL | Lý do, chỉ Admin xem |
| locked_by | BIGINT NULL | ID Admin thực hiện |
| created_at, updated_at | DATETIME2 | Thời gian tạo/cập nhật UTC |
| last_login_at | DATETIME2 NULL | Đăng nhập thành công gần nhất |
| bio | NVARCHAR(500) NULL | Giới thiệu cá nhân |
| token_version | BIGINT NOT NULL DEFAULT 0 | Phiên bản thu hồi JWT |

Bảng `admin_user_action_logs`: id, admin_id, target_user_id, action, reason, created_at; FK tới users; chỉ có LOCK_USER/UNLOCK_USER. Không chứa mật khẩu hoặc token. Index phục vụ trạng thái/vai trò/ngày tạo và lịch sử theo người dùng/thời gian.

Thời gian mới lưu bằng LocalDateTime UTC và SYSUTCDATETIME(), JSON dạng không có offset; frontend thêm `Z` trước khi hiển thị theo múi giờ máy người dùng. Ngày tạo của tài khoản cũ không có dữ liệu lịch sử được backfill bằng thời điểm migration, không phải ngày đăng ký thực tế.

### Chạy an toàn trên Windows

1. Sao lưu database hiện tại; kiểm tra tên database và máy chủ.
2. Dừng ứng dụng khi bảo trì, áp dụng migration deck trước nếu chưa chạy.
3. Mở SSMS, chọn đúng database hiện tại, chạy script mới. Hoặc dùng Windows Authentication:

```powershell
sqlcmd -S localhost -d YOUR_EXISTING_DATABASE -E -b -i .\db\migrations\20261024_deck_ownership.sql
sqlcmd -S localhost -d YOUR_EXISTING_DATABASE -E -b -i .\db\migrations\20261025_admin_profile.sql
```

Không chạy `db/database.sql`: đây là script DROP/CREATE dành cho cài đặt sạch. Module không tự chạy migration và không sửa cấu hình database hiện tại. Script mới kiểm tra cột/index trước khi thêm; không thay mật khẩu, role hợp lệ, quyền sở hữu hay dữ liệu học. Nếu đã có cột tương tự với kiểu khác, DBA cần kiểm tra tương thích trước.

### Cấp quyền Admin thủ công

Người vận hành có quyền database xác minh chủ tài khoản trước, rồi chạy transaction bên dưới cho **tài khoản đã tồn tại**. Email LOCAL chưa có quy trình xác minh trong dự án, vì vậy phải xác minh ngoài hệ thống; Google phải có email_verified. Không có endpoint cấp quyền Admin, không cấp quyền dựa theo email trong code.

```sql
SET XACT_ABORT ON;
BEGIN TRANSACTION;
DECLARE @verified_email NVARCHAR(255) = N'REPLACE_WITH_VERIFIED_EXISTING_EMAIL';
IF (SELECT COUNT(*) FROM dbo.users WHERE email = @verified_email) <> 1
    THROW 50002, 'Expected exactly one existing verified account', 1;
IF EXISTS (SELECT 1 FROM dbo.users WHERE email = @verified_email AND locked = 1)
    THROW 50003, 'Account must be active before provisioning', 1;
UPDATE dbo.users
SET role = 'ROLE_ADMIN', token_version = token_version + 1, updated_at = SYSUTCDATETIME()
WHERE email = @verified_email;
COMMIT;
```

Tài khoản phải đăng nhập lại. Không có mật khẩu Admin mặc định hoặc tài khoản quản trị ẩn. Quyền Admin cũ được giữ nguyên. Các thay đổi role thủ công nên luôn tăng token_version để bắt buộc đăng nhập lại.

## 3. Xác thực và bảo mật

- ROLE_USER/ROLE_ADMIN được lấy từ database trên mỗi request, không tin role trong JWT hoặc frontend.
- Null role được xem là learner và migration backfill ROLE_USER. Không có logic nâng quyền theo email.
- JWT có subject email và claim `ver`. Mỗi request kiểm tra chữ ký, hạn dùng, tài khoản tồn tại, trạng thái khóa và `ver == tokenVersion`.
- Khóa, mở khóa và đổi mật khẩu tăng tokenVersion; mở khóa không khôi phục token cũ. JWT trước khi nâng cấp không có `ver` cũng phải đăng nhập lại.
- Khóa/mở khóa dùng PESSIMISTIC_WRITE, kiểm tra transition và ghi audit trong cùng transaction. Request lặp trả 409, không tạo log trùng. Không khóa chính mình hoặc Admin khác; module cũng không thay đổi khóa Admin khi mở khóa.
- Profile và đăng nhập đọc lại bản ghi sau khi giữ khóa để tránh dữ liệu trong persistence context ghi đè trạng thái bảo mật vừa thay đổi.
- LOCAL login kiểm tra mật khẩu trước khi thông báo ACCOUNT_LOCKED. Sai mật khẩu kể cả với tài khoản khóa vẫn trả 401 chung. Với thông tin đúng nhưng bị khóa trả 403 ACCOUNT_LOCKED, không trả lý do khóa.
- Google yêu cầu email_verified=true, subject trùng nếu đã liên kết. Khi liên kết tài khoản LOCAL, giữ provider LOCAL và mật khẩu cũ; chỉ lưu providerId sau khi Google xác minh email. Không ghi đè tên/avatar/bio của tài khoản đã tồn tại. Người mới luôn ROLE_USER.
- OAuth thất bại về `/login?error=ACCOUNT_LOCKED` hoặc `OAUTH_FAILED`, không có token trong URL lỗi. Thành công giữ callback hiện có `/oauth2/redirect?token=...` để tương thích frontend.
- OAuthAccountService giữ khóa trong lúc kiểm tra trạng thái, lưu lastLoginAt và cấp token. Lock xảy ra sau khi token được cấp vẫn làm token đó vô hiệu ở request tiếp theo.
- Hai endpoint debug cấp JWT/tạo tài khoản theo email cố định đã bị gỡ khỏi Spring MVC.
- Secret JWT không còn hard-code. Cấu hình `JWT_SECRET` tối thiểu 64 byte UTF-8 để dùng HS512; giữ bí mật và dùng cùng secret giữa các instance. Không cấu hình thì dev dùng key ngẫu nhiên, JWT mất hiệu lực sau restart.
- Không lưu password/JWT/OAuth token vào audit. Các API mới chỉ trả DTO whitelist. Trường role/locked/id/email/provider gửi trong profile JSON bị bỏ qua, không được ghi.
- Frontend không logout vì mọi 403; chỉ thu hồi local state khi 401 session hoặc khi đổi mật khẩu thành công. Guest có thể dùng chức năng đọc công khai sau khi bỏ Authorization lỗi.

## 4. API

Base URL dev: `http://localhost:8080/api`. Endpoint cần xác thực dùng `Authorization: Bearer <JWT>`.

| Method | URL | Quyền | Request/query | Thành công |
|---|---|---|---|---|
| POST | /auth/register | Guest | name,email,password | 200 token,name,email |
| POST | /auth/login | Guest | email,password | 200 token,name,email |
| GET | /auth/me | Thành viên hoạt động | Không | 200 Profile |
| GET | /profile/me | Thành viên hoạt động | Không | 200 Profile |
| PUT | /profile/me | Chính mình | name,avatarUrl,bio | 200 Profile |
| PUT | /profile/me/password | Chính mình, LOCAL | currentPassword,newPassword,confirmPassword | 204, đăng nhập lại |
| GET | /admin/dashboard | Admin | Không | 200 Dashboard |
| GET | /admin/users | Admin | page,size,keyword,role,status,sort | 200 Page<UserItem> |
| GET | /admin/users/{id} | Admin | ID dương | 200 UserDetails |
| PATCH | /admin/users/{id}/lock | Admin | reason | 200 UserDetails |
| PATCH | /admin/users/{id}/unlock | Admin | Không cần body | 200 UserDetails |
| GET | /admin/audit-logs | Admin | page,size,action,targetUserId,adminId | 200 Page<Audit> |

### Hồ sơ

```json
{"name":"Nguyễn An","avatarUrl":"https://example.com/avatar.png","bio":"Học tiếng Anh mỗi ngày"}
```

Name trim, 2–100 ký tự. Avatar tùy chọn, HTTP(S) có host, không userinfo, tối đa 255 ký tự để giữ tương thích cột avatar_url hiện tại; frontend ảnh lỗi dùng chữ cái tên. Bio trim, tối đa 500 ký tự, chuỗi trống thành null. Email/provider/role/status chỉ đọc.

Profile response:

```json
{"id":12,"name":"Nguyễn An","email":"an@example.com","avatarUrl":null,"bio":null,"provider":"LOCAL","role":"ROLE_USER","createdAt":"2026-10-25T04:00:00"}
```

Đổi mật khẩu:

```json
{"currentPassword":"CurrentPassword123","newPassword":"BetterPassword123","confirmPassword":"BetterPassword123"}
```

Mật khẩu mới ít nhất 10 ký tự, có hoa/thường/số, tối đa 72 byte UTF-8 (giới hạn BCrypt), không trùng mật khẩu hiện tại và phải khớp xác nhận. Google-only trả 409 GOOGLE_PASSWORD_MANAGED; mật khẩu hiện tại sai trả 400 CURRENT_PASSWORD_INVALID. Đăng ký mới cũng dùng quy tắc mật khẩu này; mật khẩu cũ vẫn đăng nhập bình thường.

### Dashboard

```json
{"totalUsers":0,"activeUsers":0,"lockedUsers":0,"totalAdmins":0,"totalDecks":0,"publicDecks":0,"privateDecks":0,"totalFlashcards":0}
```

Các giá trị ví dụ bằng 0 để mô tả schema, API thực tế luôn query count database. Deck đã soft-delete bị loại; flashcard chỉ tính trong deck chưa xóa. activeUsers/lockedUsers tính mọi role; totalAdmins gồm Admin theo role lưu trong DB.

### Danh sách người dùng

Mặc định page=0, size=10, keyword rỗng, role/status=ALL, sort=NEWEST. size 1–100; page >= 0. Keyword trim, tối đa 255 ký tự, tìm tên/email không phân biệt hoa thường; wildcard được escape. Role: ALL, ROLE_USER, ROLE_ADMIN. Status: ALL, ACTIVE, LOCKED. Sort whitelist: NEWEST, OLDEST, NAME_ASC, NAME_DESC, EMAIL_ASC, EMAIL_DESC; có ID làm tie-break ổn định.

Ví dụ: `/api/admin/users?page=0&size=10&keyword=an&role=ROLE_USER&status=ACTIVE&sort=NEWEST`.

```json
{"content":[{"id":12,"name":"Nguyễn An","email":"an@example.com","avatarUrl":null,"provider":"LOCAL","role":"ROLE_USER","status":"ACTIVE","createdAt":"2026-10-25T04:00:00"}],"number":0,"size":10,"totalElements":1,"totalPages":1,"first":true,"last":true}
```

Chi tiết dùng cùng UserItem trong `account`, thêm bio, updatedAt, lastLoginAt, lockedAt, lockedReason, lockedBy, ownedDeckCount. Số deck sở hữu chỉ tính deck chưa xóa. Không tạo số liệu ôn tập không đáng tin cậy.

```json
{"account":{"id":12,"name":"Nguyễn An","email":"an@example.com","avatarUrl":null,"provider":"LOCAL","role":"ROLE_USER","status":"ACTIVE","createdAt":"2026-10-25T04:00:00"},"bio":null,"updatedAt":"2026-10-25T04:00:00","lastLoginAt":null,"lockedAt":null,"lockedReason":null,"lockedBy":null,"ownedDeckCount":0}
```

Khóa body: `{"reason":"Vi phạm quy định sử dụng hệ thống"}`. Trim, 5–500 ký tự. Mở khóa không cần JSON. Cả hai trả UserDetails mới. 404 nếu không có user; 403 nếu tự thao tác/Admin; 409 nếu trạng thái đã đúng như yêu cầu; 400 nếu lý do/ID sai.

### Nhật ký

Mặc định page=0, size=10, action=ALL. Action chỉ nhận ALL/LOCK_USER/UNLOCK_USER; targetUserId và adminId là filter ID dương, không phải người thực hiện được client tự chỉ định. Sắp xếp createdAt DESC, id DESC.

```json
{"content":[{"id":1,"adminId":2,"adminName":"Admin","adminEmail":"admin@example.com","targetUserId":12,"targetUserName":"Nguyễn An","targetUserEmail":"an@example.com","action":"LOCK_USER","reason":"Vi phạm quy định","createdAt":"2026-10-25T04:05:00"}],"number":0,"size":10,"totalElements":1,"totalPages":1,"first":true,"last":true}
```

Không có endpoint sửa/xóa audit.

### Lỗi chung

```json
{"status":401,"error":"Unauthorized","code":"SESSION_REVOKED","message":"Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.","timestamp":"2026-10-25T04:05:00"}
```

400: dữ liệu, ID, filter/sort/page sai. 401: guest/token hết hạn/chữ ký sai/phiên bị thu hồi. 403: thiếu quyền; LOCAL login đúng mật khẩu nhưng bị khóa có code ACCOUNT_LOCKED. JWT của người bị khóa trả 401 ACCOUNT_LOCKED để client xóa phiên. 404: user thiếu. 409: transition không hợp lệ, Google password, email đã tồn tại. 500: lỗi ngoài dự kiến, không trả stack trace hoặc SQL nội bộ. Một số lỗi validation/endpoint cũ có thể không có code, frontend dùng message/status.

## 5. Frontend

| Route | Chức năng |
|---|---|
| /profile | Hồ sơ, preview avatar, lưu/hủy, đổi mật khẩu LOCAL, thông báo Google |
| /admin | 8 thống kê thật từ database |
| /admin/users | Search bằng nút/Enter, clear, role/status/sort, phân trang server, chi tiết và xác nhận khóa/mở khóa |
| /admin/users/:id | Hồ sơ, trạng thái, thời gian, lý do khóa, số deck, thao tác được phép |
| /admin/audit-logs | Nhật ký chỉ đọc, lọc action/người dùng/Admin, phân trang |

AdminRoute dựa trên user từ `/auth/me`; guest về login kèm đường dẫn quay lại, learner thấy trang từ chối. Trong lúc xác thực chỉ hiển thị loading. Navbar có avatar dropdown, hồ sơ, quản trị khi đúng role, đăng xuất. Sidebar mobile có nút Menu; bảng có vùng cuộn ngang. Dialog native giữ focus và cho Escape khi không đang gửi. Sau thao tác chỉ refresh dữ liệu, không reload trình duyệt. Dashboard fetch lại khi mở route nên thống kê phản ánh thay đổi mới nhất.

## 6. Chạy dự án

Từ PowerShell tại thư mục repository:

```powershell
# Sau khi áp dụng migration và giữ cấu hình SQL Server/OAuth hiện có:
# Thiết lập JWT_SECRET bằng secret ngẫu nhiên >=64 byte từ secret manager của bạn.
$env:JWT_SECRET = 'REPLACE_WITH_YOUR_RANDOM_SECRET_OF_AT_LEAST_64_BYTES'
cd spring-boot-app
mvn clean test
mvn clean compile
mvn spring-boot:run
```

Mở PowerShell khác:

```powershell
cd frontend
npm ci
npm run build
npm run lint
npm run dev
```

Frontend mặc định cổng 5173; backend 8080. `VITE_API_URL` cho phép đổi API base URL. Giữ Google redirect URI hiện có (`/login/oauth2/code/google`) và đăng ký client hợp lệ. Không commit secret hoặc mật khẩu database. Chuỗi JWT_SECRET ví dụ trên chỉ là placeholder, cần thay bằng secret thật ngẫu nhiên.

## 7. Kiểm thử tự động

`AdminProfileIntegrationTest` dùng H2 riêng `MODE=MSSQLServer`, MockMvc, JUnit 5 và BCrypt thật. Bao phủ login, locked password, authorization, forged headers/JSON, lock/unlock và audit, token cũ sau unlock/password, các module được bảo vệ, Grammar community, profile validation, Google identity/profile/role, filter/pagination, dashboard soft-delete, endpoint debug, đăng ký và khóa đồng thời.

Các test hiện có DeckSecurityIntegrationTest, GrammarServiceImplTest, StudyServiceImplWeakIntegrationTest, WeakVocabularyServiceImplTest, WeakVocabularyRepositoryIntegrationTest, WeakPracticeServiceImplTest và DemoAccountPasswordTest vẫn chạy. H2 test tạo schema riêng, không dùng database SQL Server ứng dụng.

Xem kết quả thực tế trong `spring-boot-app/target/surefire-reports`. Build/lint frontend phải được chạy riêng; lint warnings có sẵn trong Grammar/Weak Vocabulary không được xem là lỗi runtime mới.

## 8. Kiểm tra thủ công

1. Guest: mở trang chủ, tìm/phân trang public deck, học deck công khai; mở /profile và /admin phải về login. GET /api/admin/dashboard không token trả 401.
2. Learner: đăng ký với mật khẩu theo quy tắc, login, mở /profile; sửa tên/avatar/bio, kiểm tra Navbar đổi ngay và reload giữ dữ liệu. Gửi thêm role/locked/id/email trong JSON phải không thay đổi những trường đó. Tài khoản khác không bị thay đổi.
3. Learner: /admin phải bị chặn; gọi API Admin với JWT learner trả 403 và phiên còn dùng được. Vẫn tạo được câu hỏi/nhóm Grammar cộng đồng.
4. Admin: cấp role thủ công theo SQL ở trên, đăng nhập mới; kiểm tra 8 count theo dữ liệu DB. Tìm tên/email hoa/thường, kết hợp filter, đổi sort và số dòng; mở chi tiết.
5. Khóa: giữ JWT learner trước khi khóa; từ Admin mở modal, nhập lý do, xác nhận; trạng thái đổi và có đúng một audit ghi Admin thật. Khóa lại trả 409. Tự khóa hoặc khóa Admin khác trả 403.
6. Locked: login sai mật khẩu vẫn 401, đúng mật khẩu trả 403 ACCOUNT_LOCKED. Google login cũng bị chặn. JWT giữ ở bước 5 phải trả 401 ở profile, deck ghi, study, weak vocabulary/practice và Grammar mutation.
7. Mở khóa: xác nhận mở khóa, xem audit UNLOCK_USER, metadata khóa hiện tại được xóa. JWT cũ vẫn 401; đăng nhập mới hoạt động. Không mất deck hoặc lịch sử học.
8. Password LOCAL: sai current/confirmation/yếu/trùng đều bị từ chối; đổi đúng buộc về login, token cũ 401, password cũ sai, password mới hoạt động. Google-only hiển thị thông báo quản lý mật khẩu qua Google.
9. OAuth: dùng Google thật có email verified, sửa tên/avatar trong profile rồi login Google lại, dữ liệu tự sửa giữ nguyên; Admin giữ role trong database; tài khoản Google mới không tự nhận Admin.
10. Regression: public/private deck, owner/non-owner editing, guest study, weak detection/practice và Grammar. Test ở desktop/mobile, ảnh avatar lỗi, server mất kết nối, bảng rỗng và nút retry.

Ví dụ kiểm JWT cũ trong PowerShell (nhập token vào biến trong phiên của bạn, không ghi vào repo):

```powershell
$headers = @{ Authorization = "Bearer $oldToken" }
Invoke-WebRequest -Uri http://localhost:8080/api/profile/me -Headers $headers
```

## 9. Giới hạn xác minh

Migration được chuẩn bị nhưng chưa thực thi trên SQL Server hiện tại; cần DBA chạy và xác minh index, dữ liệu và khả năng chạy lại script. Google live callback cần tài khoản/client Google thật để QA. Kiểm tra giao diện trực tiếp có thể bị giới hạn bởi quyền công cụ trình duyệt; không coi frontend build là bằng chứng đã test toàn bộ tương tác bằng trình duyệt. Không có dữ liệu Admin giả hoặc thống kê demo trong frontend.

## 10. Kết quả chạy ngày 25/10/2026

- `mvn clean test -q`: 109 test, 0 failures, 0 errors, 0 skipped. Trong đó AdminProfileIntegrationTest có 43 test và bộ regression cũ có 66 test.
- `npm run build`: thành công.
- `npm run lint`: exit 0, 0 errors, 40 warnings. Kiểm tra ESLint trên source tại HEAD trước thay đổi cho thấy 0 errors/41 warnings; các cảnh báo còn lại thuộc code sẵn có.
- Backend QA đã khởi động thành công với H2 in-memory riêng. Không áp dụng migration vào SQL Server hiện tại.
- Browser QA chưa thực hiện được: trình duyệt tích hợp không truy cập localhost của Windows; công cụ Windows từ chối điều khiển cửa sổ Firefox được nhận diện là ứng dụng Gmail. Không coi các tương tác frontend hoặc Google OAuth thật là đã kiểm thử.
- `mvn clean compile` xóa thư mục target và báo cáo Surefire trước đó; chạy lại `mvn test` khi cần tái tạo báo cáo chi tiết.
- `mvn clean compile -q`: exit 0, thành công. Maven/JDK hiện tại có cảnh báo sun.misc.Unsafe từ Guice và dòng khởi tạo `Access is denied.`; không có lỗi compilation.
