# Database phát triển EVMS / StudyE

`db/database.sql` xoá và tạo lại **15 bảng ứng dụng trong database demo_db đang tồn tại**. Không truy cập master; không CREATE/DROP/ALTER DATABASE, không đổi collation hoặc ngắt kết nối bằng SINGLE_USER. Dữ liệu trong 15 bảng sẽ mất; sao lưu trước. Chỉ dùng local development/demo. Tôi chỉ sửa và kiểm tra tĩnh file, không thực thi reset.

## Chạy bằng SQL Server Management Studio

1. Dừng Backend để tránh khoá bảng. Backup dữ liệu cần giữ và kiểm tra đúng server/instance.
2. Cần SQL Server 2016+, demo_db đã tồn tại, compatibility level ít nhất 130 và quyền DROP/CREATE các bảng ứng dụng, index/constraint và INSERT. Không cần quyền tạo/xoá database.
3. Mở query window mới, chọn demo_db, mở toàn bộ database.sql, nhấn Execute toàn bộ. Không cần sửa @AllowReset: đã bỏ guard opt-in theo yêu cầu. Không chạy từng đoạn hoặc bọc file trong transaction ngoài.
4. Chờ thông báo `SUCCESS: demo_db application tables rebuilt...`, counts khớp expected_rows và không có lỗi.

File dùng USE [demo_db] và kiểm tra DB_NAME trước từng giai đoạn. Điều kiện không hợp lệ báo THROW rõ ràng. Không bật NOEXEC để che lỗi; đầu file vẫn SET NOEXEC OFF để phục hồi session đã chạy bản cũ. Chỉ coi là hoàn tất khi có reset_status=COMMITTED, danh sách bốn account, bảng actual_rows/expected_rows và thông báo SUCCESS. Trong SSMS hãy bỏ chọn đoạn SQL (Ctrl+A để chọn toàn bộ), Execute, rồi Refresh Databases → demo_db → Tables; kiểm tra đúng SQL Server instance.

Các bảng con được DROP trước bảng cha. Một transaction duy nhất giữ xuyên qua GO đến khi tạo bảng, seed và verification hoàn tất mới COMMIT. GO tách compilation để tránh metadata cũ, không tách transaction. Lỗi seed/check rollback cả DROP, phục hồi bảng/dữ liệu trước reset. Bảng ngoài mô hình không bị xoá; FK bên ngoài có thể khiến DROP thất bại và rollback. Batch cuối rollback transaction còn mở nếu lỗi compile bỏ qua TRY/CATCH.

Giữ nguyên collation hiện tại. Các phép so sánh tên/type giữa system catalog và manifest dùng COLLATE DATABASE_DEFAULT hai phía để xử lý trường hợp catalog collation khác database collation (lỗi 468). Verification chỉ kiểm tra 15 bảng ứng dụng, không yêu cầu xoá bảng không liên quan.

## Schema hiện tại

Đối chiếu 15 entity hiện tại, naming strategy mặc định Spring Boot và toàn bộ bốn migration. Sau clean install không cần chạy migration bổ sung.

| Bảng | Chức năng | Dòng mẫu |
|---|---|---:|
| users | LOCAL/Google, role, profile, khoá tài khoản, JWT version | 4 |
| admin_user_action_logs | Audit LOCK_USER/UNLOCK_USER | 0 |
| decks | Owner, PUBLIC/PRIVATE, xoá mềm | 4 |
| flashcards | Từ, nghĩa, IPA, câu ví dụ Unicode | 86 |
| user_flashcard_reviews | Trạng thái SM-2 duy nhất theo user/card | 0 |
| flashcard_study_events | Lịch sử Study, request id, response snapshot | 0 |
| user_weak_vocabularies | Nguồn phát hiện, mastery, counters, xoá mềm | 80 |
| weak_practice_sessions | Owner, dạng bài, trạng thái, tổng kết | 260 |
| weak_practice_items | Thứ tự, câu hỏi, đáp án, options JSON | 260 |
| weak_practice_attempts | Lịch sử trả lời duy nhất theo item | 260 |
| ai_generation_gate | Khoá tuần tự quota/request đồng thời | 1 |
| ai_generation_batches | Preview, lease, TTL, ownership, quota, commit replay | 0 |
| grammar_groups | Bộ đề cộng đồng | 4 |
| grammar_questions | Câu hỏi thuộc 8 dạng bài | 14 |
| grammar_question_reports | Báo lỗi câu hỏi | 0 |

So với file reset cũ: thêm bốn bảng admin logs, Study Event, AI gate và AI batch; thêm chín cột users: `locked`, `locked_at`, `locked_reason`, `locked_by`, `created_at`, `updated_at`, `last_login_at`, `bio`, `token_version`; thêm ba cột weak: `detection_reason`, `first_detected_at`, `last_detected_at`. Tên thực là **locked**, không phải is_locked. Giữ đúng FK attempt `user_weak_vocabulary_id`, Study `response_json`, AI `failure_status`, `commit_fingerprint`, `commit_json`.

BIGINT IDENTITY cho 13 entity; gate dùng BIGINT id=1, batch dùng VARCHAR(36) id do ứng dụng sinh. DATETIME2(6) theo Hibernate SQLServerDialect, default thời gian mới là UTC. Nullable theo entity; riêng users/decks/weak timestamps và visibility giữ NOT NULL theo migration. Text hiển thị dùng NVARCHAR; enum/UUID/fingerprint dùng VARCHAR. Ease factor là FLOAT(53), tương ứng Java double. Không thêm unique vocabulary/question_key vì entity không yêu cầu.

Chỉ sửa bốn annotation TEXT thành NVARCHAR(MAX): `Flashcard.exampleSentence`, `GrammarGroup.description`, `GrammarQuestion.instruction`, `GrammarQuestionReport.description`, để Java thống nhất Unicode DDL. Không đổi thuật toán hoặc cấu hình. Asset `frontend/public/demo/classroom.svg` phục vụ câu hỏi hình ảnh mẫu, không phụ thuộc URL ngoài.

Có 159 cột, 15 PK, 21 FK, 9 unique constraint, 29 CHECK và 42 DEFAULT. FK bảo vệ ownership/audit/history/Grammar; unique bảo vệ user/card, Study request, AI request, session/order, một attempt/item, grammar group/report key. Email không NULL có unique filtered index riêng. CHECK bảo vệ enum thực tế, quality/confidence, mastery 0–100, counters không âm/cộng đúng, ease factor, JSON và usage. Grammar type/status là String nên không ép enum chưa có trong Java.

28 query index (gồm unique email), ngoài index PK/UQ, phục vụ Admin search, audit, public/owner decks, card/deck, SM-2 due, Study recent, weak filter, Practice history, AI quota/lease/expiry, Grammar group/report. Không lặp index user/card hoặc session/order đã có UQ.

AI không có entity candidate/quota riêng: candidates nằm trong preview_json, replay trong commit_json, usage đếm batches theo user/ngày và toàn cục dưới khoá gate 1. Không tạo bảng giả ngoài mô hình; staging để rỗng, không chứa secret hoặc kết quả AI giả. Source hỗ trợ OPENAI/GEMINI/DEMO_LIBRARY. Nếu database đang có AI V2 báo CK_ai_source khi dùng Gemini, chạy **`db/migrations/20261025_ai_generation_v3_constraints.sql`**, không chạy file reset này. Migration mới đồng bộ sáu CHECK, giữ nguyên dữ liệu và thay thế patch source Gemini cũ. Xem mục 23 trong `docs/AI_FLASHCARD_GENERATOR_V2.md`.

## Dữ liệu mẫu

Clean SQL tự tạo bốn account Admin/Learner/Locked với BCrypt, theo yêu cầu demo local. Email/password và hướng dẫn nằm trong docs/DEMO_ACCOUNTS.md; không cần initializer.

Bốn deck thuộc learner1, ID lấy qua OUTPUT: Everyday English, Academic English, Travel PUBLIC; Weak Vocabulary Demo PRIVATE. Sáu card cơ bản và 80 từ demo có nghĩa/IPA, câu tiếng Anh tự nhiên; sửa lỗi nghĩa specific. Không giả định identity id=1 cho FK.

80 weak chia tám nhóm mười từ, replay đáp án từ mastery 0 theo +20/-20, clamp 0–100. Có **30 MANUAL, 10 AUTO, 40 BOTH**, gồm **70 active, 10 xoá mềm**; mastery cuối các nhóm là 0/60/0/0/40/100/80/20, accuracy/attempts khác nhau. 260 session hoàn tất, mỗi session một item MEANING_TO_WORD và một attempt. Snapshot/time/owner/counters được đối chiếu. Đây là **synthetic demo history**, được giải thích trong SQL comment và tài liệu; weak_note để NULL cho người học tự ghi chú. Các mode Practice khác được schema hỗ trợ và tạo qua ứng dụng.

Nếu đã chạy seed cũ và giao diện hiện ghi chú kỹ thuật `[SYNTHETIC DEMO]...`, chỉ chạy `db/migrations/20261025_cleanup_demo_notes.sql`, rồi tải lại trang. File này chỉ gỡ đúng chuỗi seed cũ của demo account và sửa mô tả deck mẫu, không reset bảng và không xoá ghi chú khác. Không cần chạy sau reset bằng seed mới.

Nguồn LEGACY_AUTO cũ không biết thời gian nên first_detected_at để NULL; trigger Practice mới cập nhật metadata theo quy tắc hiện tại. Xoá mềm sau lần luyện cuối, giữ history/counters. SM-2 và Study Event rỗng, không gán quality giả hay lịch sử Study mâu thuẫn.

Giữ 13 câu Grammar, thêm một FILL_BLANK_CARDS đủ tám dạng; JSON được kiểm tra, sửa since viết thường giữa câu. Hình ảnh dùng SVG lớp học đúng nội dung. Câu nghe sân bay có audio_url=null, dùng fallback **Text-to-Speech trình duyệt** sẵn có; không còn âm thanh mưa sai transcript. Cần trình duyệt hỗ trợ SpeechSynthesis/giọng tiếng Anh. Tác giả là learner1, không gán Admin, bỏ email cá nhân cũ.

## Cấp Admin phát triển

Đăng ký tài khoản riêng trước. Chủ database được uỷ quyền có thể chạy thủ công đoạn sau, thay placeholder bằng email đã xác minh. Không nâng quyền demo có mật khẩu công khai. Xem thêm `docs/ADMIN_AND_PROFILE.md`.

```sql
USE [demo_db];
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @verified_email NVARCHAR(255)=N'REPLACE_WITH_VERIFIED_EXISTING_EMAIL';
    IF @verified_email=N'demo@studye.local'
        THROW 51200,'Use a private verified development account.',1;
    IF (SELECT COUNT(*) FROM dbo.users WHERE email=@verified_email)<>1
        THROW 51201,'Expected exactly one existing verified account.',1;
    IF EXISTS(SELECT 1 FROM dbo.users WHERE email=@verified_email AND locked=1)
        THROW 51202,'Account must be active.',1;
    UPDATE dbo.users SET role=N'ROLE_ADMIN',token_version=token_version+1,
        updated_at=SYSUTCDATETIME() WHERE email=@verified_email;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
```

Đăng nhập lại sau thay đổi; JWT cũ bị thu hồi bằng token_version. Không có mật khẩu Admin mặc định.

## Verification và khởi động Backend

Cuối SQL kiểm tra manifest toàn bộ bảng/cột: type/length/scale/nullable/identity/default; PK/FK/UQ/CHECK enabled/trusted và query index. Kiểm tra FK không orphan, counts, duplicate keys, source/delete coverage, counters/mastery qua profile độc lập và aggregate attempts, session totals/snapshots/owner/time, JSON và đáp án Grammar. Sai lệch THROW trước COMMIT; chỉ báo SUCCESS sau COMMIT.

Bản table reset được kiểm tra tĩnh bằng Microsoft ScriptDom SQL Server 160 parser. Schema hiện có 15 bảng, 159 cột, 15 PK, 21 FK, 9 UQ, 29 CHECK, 42 DEFAULT và 28 query indexes. Clean seed tạo bốn tài khoản với mật khẩu demo local công khai đã được chấp thuận. Ngày 25/10/2026, migration `20261025_auth_identity_demo.sql` và `db/verify_database.sql` đã chạy thành công trên localhost/demo_db; không chạy reset. Backend regression 250 tests pass, clean compile pass. Chưa chạy Hibernate validate trên SQL Server thật; browser QA chạy H2 cô lập. Xem docs/FINAL_SYSTEM_QA.md cho kết quả hiện tại và giới hạn.
Sau khi bạn reset thành công, giữ cấu hình SQL Server/JWT/OAuth/OpenAI local hiện có. Từ thư mục `spring-boot-app`:

```powershell
mvn clean test
mvn clean compile
mvn spring-boot:run '-Dspring-boot.run.arguments=--spring.jpa.hibernate.ddl-auto=validate'
```

Lần validate kiểm tra schema đã tạo, không nhờ Hibernate thêm cột. Đảm bảo datasource trỏ đúng demo_db vừa tạo lại các bảng. Sau khi không có validation error, thử login/register, public/private deck, Study một card, Weak filter/Practice, Grammar, AI preview/commit trên deck sở hữu và Admin với tài khoản riêng. OPENAI cần cấu hình hợp lệ, DEMO_LIBRARY bật theo tài liệu AI V2. Không đưa secret vào SQL/log.

Dừng rồi khởi động bình thường bằng `mvn spring-boot:run` khi cần. Cấu hình thường ngày không bị sửa trong công việc database này. Nếu validate lỗi, xử lý schema/mapping rõ ràng, không dùng update để che cột thiếu.

## Nâng cấp database có dữ liệu

**Không chạy database.sql để nâng cấp.** Sao lưu, đọc và chạy migration theo thứ tự: `20261024_deck_ownership.sql`, `20261025_admin_profile.sql`, `20261025_automatic_weak_detection.sql`, `20261025_ai_flashcard_generation_v2.sql`. Migration có thể dừng khi duplicate cần hoà giải; không xoá history để ép unique. Giữ nguyên migration cho lộ trình nâng cấp.

Clean install tích hợp hiệu lực cuối cả bốn migration nên không chạy lại sau table reset. Bốn annotation Unicode sửa có thể yêu cầu rà soát cột TEXT trên database rất cũ và migration chuyển đổi riêng sau backup; reset script không nâng cấp database cũ và không khôi phục Unicode đã mất trước đây.

Nâng cấp auth/session hiện tại: chạy `20261025_auth_identity_demo.sql` rồi `db/verify_database.sql`; nếu AI constraints cũ, áp dụng `20261025_gemini_provider.sql` và `20261025_ai_generation_v3_constraints.sql` theo hướng dẫn AI. Migration không xoá dữ liệu. Tài khoản demo opt-in và trạng thái provisioning thực tế xem `docs/DEMO_ACCOUNTS.md`; SQL migration không tạo Admin.
