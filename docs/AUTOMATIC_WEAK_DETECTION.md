# Tự động phát hiện từ yếu — EVMS / StudyE

## 1. Mục tiêu và phạm vi

Flashcard Study ghi nhận các từ người học quên hoặc khó nhớ vào danh sách Weak Vocabulary hiện có. Không tạo hệ thống từ yếu thứ hai, không dùng AI, không chạy scheduler. Việc phát hiện diễn ra đồng bộ trong transaction của hoạt động học đã lưu thành công.

Module Admin/Profile, JWT, quyền sở hữu và public/private deck được giữ nguyên. SM-2 và bộ sinh bốn dạng câu hỏi Weak Practice được giữ lại.

## 2. Rating và thuật toán

| Quality | Nhãn | Ý nghĩa trong Study Accuracy |
|---|---|---|
| 1 | Again | Quên từ, không nhớ tự tin |
| 3 | Hard | Khó nhớ, không nhớ tự tin |
| 4 | Good | Nhớ tự tin |
| 5 | Easy | Nhớ dễ dàng |

Các giá trị khác bị từ chối bằng HTTP 400 và không ghi dữ liệu.

Các ngưỡng nghiệp vụ nằm trong `WeaknessRules`: cửa sổ 3, Hard tối thiểu 2, sample Study tối thiểu 5, sample Practice tối thiểu 3, sai liên tiếp 2, tỷ lệ thấp dưới 60%, bước Mastery 20. Đây là các quy tắc sản phẩm có thể điều chỉnh bằng mã nguồn, không phải chuẩn khoa học hoặc công thức SM-2.

### Quy tắc Study theo đúng thứ tự ưu tiên

1. Quality hiện tại bằng 1 → `STUDY_FORGOT`.
2. Ít nhất 2 quality bằng 3 trong 3 event gần nhất của **cùng người học và cùng Flashcard** → `STUDY_HARD_REPEAT`.
3. Có ít nhất 5 event, tỷ lệ Good/Easy nhỏ hơn 60% → `STUDY_LOW_RECALL`.
4. Không khớp → không phát hiện mới; không xóa từ đã yếu hoặc thay lý do cũ bằng giá trị chung chung.

Cửa sổ gồm event vừa lưu, lấy theo ID giảm dần, không chỉ theo timestamp. Hai Hard thực tế là đủ; không cần chờ đủ 3 event. Một Hard đơn lẻ **không còn** tự tạo từ yếu. Quality 3 vẫn được SM-2 xử lý như trước; việc tách quality 3 thành recall không tự tin chỉ ảnh hưởng Study Accuracy/detection.

| Chuỗi cũ → mới | Kết quả lần cuối |
|---|---|
| [1] | Thêm ngay, STUDY_FORGOT |
| [3] | Không phát hiện |
| [3,3] | STUDY_HARD_REPEAT |
| [3,4,3] | STUDY_HARD_REPEAT |
| [3,4,4] | Không phát hiện |
| [3,3,4,4] | Lần cuối không phát hiện; từ đã có vẫn được giữ |
| [1,1,1,4,4] | 2/5 = 40%, STUDY_LOW_RECALL |
| [1,1,4,4,4] | 3/5 = 60%, không khớp điều kiện dưới 60% |
| [3,4,3,4,3] | 40% nhưng ưu tiên STUDY_HARD_REPEAT |
| [3,3,4,4,1] | Ưu tiên STUDY_FORGOT |

## 3. Hai loại Accuracy và Mastery

### Study Accuracy

`confidentRecallCount * 100.0 / studyReviewCount`

Confident recall chỉ gồm quality 4/5. Lấy aggregate trên event history thật trong database, không dùng repetitionCount hoặc tự dựng lịch sử. Không có event thì trả `studyReviewCount=0`, `studyAccuracy=null`. Làm tròn 2 chữ số sau dấu thập phân để hiển thị; xét ngưỡng bằng tỷ lệ chưa làm tròn.

### Weak Practice Accuracy

`correctCount * 100.0 / totalAttempts`

API `accuracy` vẫn giữ nghĩa Practice Accuracy, không thay bằng Study Accuracy. Để tương thích filter/sort cũ, `accuracy=0` khi totalAttempts=0; giao diện luôn dựa vào totalAttempts để hiển thị **“Chưa luyện tập”** thay vì 0%. Bộ lọc phần trăm cũ tiếp tục dùng giá trị sentinel 0 cho từ chưa luyện, nên nhóm dưới 25% có thể gồm cả từ chưa luyện; chúng vẫn được ghi nhãn rõ.

Ví dụ 2 câu đúng/5 lần trả lời → 40%. Không có event Study thì dù đã Practice vẫn không có Study Accuracy.

### Mastery

- Ban đầu: 0.
- Đúng: `min(100, masteryScore + 20)`.
- Sai: `max(0, masteryScore - 20)`.
- Đúng đặt consecutiveWrong=0; sai tăng consecutiveWrong.
- `totalAttempts = correctCount + wrongCount` được giữ khi phát sinh các câu trả lời mới.

Bước +/-20 là điểm số sản phẩm đơn giản, **không phải** thành phần nội tại của SM-2. Good/Easy ở Flashcard Study không cộng điểm Mastery hoặc tạo Practice attempt.

Practice tăng cường dấu hiệu yếu theo ưu tiên:

1. consecutiveWrong >= 2 → PRACTICE_CONSECUTIVE_WRONG.
2. totalAttempts >= 3 và Practice Accuracy < 60% → PRACTICE_LOW_ACCURACY.

Chỉ áp dụng cho từ đã có trong luồng Weak Practice. Không tự khám phá Flashcard ngoài danh sách qua Practice.

## 4. Bảng trigger và kết quả

| Trigger | Điều kiện | Reason | Database action | Thông báo frontend |
|---|---|---|---|---|
| Again | quality=1 | STUDY_FORGOT | Lưu event, thêm/cập nhật weak đủ điều kiện | Tên từ + bạn đã quên từ + đã tự động thêm |
| Hard lặp | >=2 Hard trong tối đa 3 event gần nhất | STUDY_HARD_REPEAT | Lưu event, thêm/cập nhật weak | Bạn đã nhiều lần gặp khó khăn khi ghi nhớ |
| Recall thấp | >=5 review, Good/Easy <60% | STUDY_LOW_RECALL | Lưu event, thêm/cập nhật weak | Tỷ lệ ghi nhớ tốt dưới 60% |
| Practice sai liên tiếp | consecutiveWrong>=2 | PRACTICE_CONSECUTIVE_WRONG | Cập nhật weak và ghi một attempt | Lý do tiếng Việt trên danh sách |
| Practice accuracy thấp | >=3 attempts, đúng <60% | PRACTICE_LOW_ACCURACY | Cập nhật weak và ghi một attempt | Lý do tiếng Việt trên danh sách |
| Manual Add | Người học tự thêm | MANUAL_MARK nếu chưa AUTO | Tạo/khôi phục cùng weak record | Thêm thủ công |
| Đã xóa mềm | Có trigger Study nhưng weakDeleted=true | Trigger của event trả trong response | Giữ trạng thái xóa; vẫn ghi event và SM-2 | Không báo thêm thành công |

Chỉ trạng thái `AUTO_ADDED` hiện thông báo “đã thêm” cùng link danh sách. `ALREADY_WEAK`, `SUPPRESSED`, `NOT_DETECTED` không tạo thông báo thêm mới.

## 5. Luồng dữ liệu và kiến trúc

```mermaid
sequenceDiagram
    actor Learner as Người học
    participant UI as StudyMode
    participant C as StudyController
    participant S as StudyService
    participant H as Review History
    participant R as WeaknessRules
    participant W as Weak Vocabulary
    Learner->>UI: Again / Hard / Good / Easy
    UI->>C: quality + UUID requestId
    C->>S: userId từ principal
    S->>S: Bắt đầu transaction, khóa hàng User, kiểm tra quyền deck
    S->>H: Tìm userId + requestId
    alt Request đã xử lý, cùng payload
        H-->>S: Snapshot kết quả gốc
    else Request mới
        S->>S: Cập nhật SM-2
        S->>H: Lưu event và flush
        H-->>S: Count, confident count, 3 quality gần nhất
        S->>R: Đánh giá luật theo ưu tiên
        R-->>S: Reason hoặc không phát hiện
        S->>W: Tạo/cập nhật hoặc SUPPRESSED
        W-->>S: weakDetection
        S->>H: Lưu snapshot response trong cùng transaction
    end
    S-->>C: Commit rồi trả ReviewResponse
    C-->>UI: Scheduling + studyAccuracy + weakDetection
    UI-->>Learner: Thông báo nếu AUTO_ADDED; chuyển thẻ sau thành công
```

Các file chính:

- `study/entity/FlashcardStudyEvent`: lịch sử review, identity người học/Flashcard/request, quality, confident flag, reviewedAt, response snapshot.
- `study/repository/FlashcardStudyEventRepository`: lookup request, count, confident count, cửa sổ ID giảm dần, thống kê nhóm cho danh sách.
- `study/service/impl/StudyServiceImpl`: giữ SM-2, thêm event, tính thống kê, detection và snapshot trong một transaction.
- `study/service/LearningActivityLock`: khóa database theo người học, dùng chung cho Study, manual add/patch/delete và Practice start/answer.
- `weakvocabulary/service/WeaknessRules`: ngưỡng, luật, phần trăm và cập nhật metadata.
- `weakvocabulary/service/impl/WeakVocabularyServiceImpl`: thêm/cập nhật cùng weak record, tôn trọng xóa mềm, map lý do, batch thống kê Study.
- `weakvocabulary/service/impl/WeakPracticeServiceImpl`: bảo vệ check-and-update answered, giữ scoring và bổ sung reinforcement.

Không tải toàn bộ lịch sử để đánh giá. Mỗi review dùng count queries và tối đa 3 event. Danh sách weak lấy aggregate theo cả trang bằng một query, không query toàn bộ history từng từ. Dropdown deck chỉ lấy distinct deck có weak record đang hoạt động và người học còn được phép xem, gồm deck riêng do chính họ sở hữu.

## 6. Database và migration

File mới: `db/migrations/20261025_automatic_weak_detection.sql`.

### flashcard_study_events

| Cột | Ý nghĩa |
|---|---|
| id | BIGINT IDENTITY, thứ tự ổn định |
| user_id | FK tới người học xác thực |
| flashcard_id | FK tới Flashcard |
| quality | 1,3,4,5; check constraint |
| confident_recall | BIT, khớp quality 4/5 |
| request_id | VARCHAR(36), UUID chuẩn hóa chữ thường |
| reviewed_at | DATETIME2, thời gian server UTC |
| response_json | NVARCHAR(MAX), snapshot kết quả logic ban đầu |

Unique `(user_id,request_id)` chống cùng request ở nhiều Flashcard. Index `(user_id,flashcard_id,id DESC)` INCLUDE quality/confident_recall phục vụ window/count. Event được tạo và hoàn tất snapshot trong cùng transaction; không có API sửa/xóa event.

`response_json` cần thiết vì retry phải trả scheduling, accuracy và detection của request đầu, thay vì state mới hơn. Không chứa mật khẩu/JWT. Cột nullable để cho phép flush event trước aggregate; service hoàn tất snapshot trước commit, lỗi serialization rollback toàn bộ.

### Metadata Weak Vocabulary

Thêm `detection_reason VARCHAR(40)`, `first_detected_at DATETIME2`, `last_detected_at DATETIME2`.

Manual-only cũ không có reason → MANUAL_MARK. AUTO hoặc BOTH cũ → LEGACY_AUTO, không suy diễn STUDY_FORGOT hay Hard từ dữ liệu thiếu. Không gán ngày phát hiện giả cho record legacy. Với AUTO legacy có firstDetectedAt chưa biết, giữ null khi phát hiện lại; lastDetectedAt nhận thời điểm mới đã quan sát. Với record mới hoặc MANUAL chuyển BOTH, firstDetectedAt được đặt lần đầu tự động, sau đó giữ nguyên.

Detection/event mới dùng UTC. Các trường lịch sử createdAt/updatedAt và lịch SM-2 hiện có giữ quy ước cũ để tránh tự đổi dữ liệu/lịch học trong nâng cấp này.

### Unique và dữ liệu cũ

Giữ unique `(user_id,flashcard_id)` của weak list. Bổ sung unique cùng cặp cho `user_flashcard_reviews`, và unique `item_id` cho Practice attempts.

Migration kiểm tra trùng trước khi thêm constraint. Nếu có trùng SM-2 hoặc attempts, script trả bảng chẩn đoán rồi THROW; không tự xóa hoặc chọn một state tùy ý. DBA cần sao lưu, xem lịch sử/ngữ nghĩa và quyết định cách hòa giải riêng trước khi chạy lại. Không chạy DELETE hoặc reset scores để làm cho migration qua.

Không tạo event giả cho các SM-2 state có sẵn. Study Accuracy bắt đầu từ event đầu tiên được ghi sau khi cài module.

### Thứ tự áp dụng

1. Sao lưu database hiện tại, dừng ứng dụng khi bảo trì.
2. Áp dụng migration deck ownership nếu chưa có.
3. Áp dụng `20261025_admin_profile.sql` nếu chưa có.
4. Áp dụng `20261025_automatic_weak_detection.sql`.
5. Khởi động ứng dụng và xác minh số liệu.

Ví dụ PowerShell từ thư mục repository, thay đúng server/database:

```powershell
sqlcmd -S localhost -d YOUR_EXISTING_DATABASE -E -b -i .\db\migrations\20261025_automatic_weak_detection.sql
```

Script chỉ cộng thêm, kiểm tra cột/index trước khi tạo, giữ users/Admin/Profile, flags nguồn, soft deletion, notes, scores, attempts, deck ownership và SM-2. Không thực thi migration tự động. **Không chạy `db/database.sql` trên database hiện tại. Không sửa `application.properties`.**

## 7. Idempotency và concurrency

- Client mới gửi UUID cho mỗi lần chọn rating. Retry giữ nguyên quality/Flashcard/requestId.
- Cùng người học + requestId + cùng payload: trả snapshot cũ, không cập nhật SM-2/event/weak lần nữa.
- Cùng key nhưng quality hoặc Flashcard khác: HTTP 409 REVIEW_REQUEST_CONFLICT.
- Khác requestId: hai review hợp lệ độc lập.
- Hai người học có thể dùng cùng UUID; unique theo người học.
- Client cũ không requestId vẫn hoạt động; server tạo UUID mới mỗi lần gọi, nên **không có bảo đảm chống retry cho client cũ**.
- Check quyền deck thực hiện trước khi trả snapshot, nên token/key cũ không đọc lại nội dung khi deck đã bị thu hồi quyền.

LearningActivityLock giữ PESSIMISTIC_WRITE trên hàng User từ đầu đến cuối transaction. Hàng cha luôn có sẵn nên bảo vệ cả trường hợp progress/weak chưa tồn tại. Các hoạt động của cùng người học được tuần tự hóa, người học khác vẫn độc lập. Cách này đổi một phần khả năng song song trong cùng tài khoản để giữ đúng counters và tránh race insert; không dùng khóa in-memory, không cần restart server. Unique constraints là lớp bảo vệ bổ sung.

Practice answer dùng cùng khóa trước khi đọc answered flag và cập nhật stats/session. Gửi lại item đã answered trả business error hiện có (HTTP 400), không ghi attempt thứ hai; không replay đáp án như Study. UI khóa nút trong lúc gửi. Nếu response Practice đầu bị mất nhưng server đã commit, retry có thể báo đã trả lời; counters vẫn chỉ tính một lần. Đây là hành vi lỗi nhất quán được chọn cho Practice, không phải replay API.

## 8. Lifecycle

Identity vẫn là `(user_id,flashcard_id)`, không phải chữ viết của từ. Hai Flashcard cùng vocabulary vẫn là hai đối tượng; hai người học có state riêng.

| Trạng thái | Khi tự động phát hiện |
|---|---|
| Chưa có weak | Tạo AUTO, stats Practice bằng 0, status AUTO_ADDED |
| MANUAL đang hoạt động | Chuyển BOTH, giữ ghi chú/scores/history, status ALREADY_WEAK |
| AUTO hoặc BOTH đang hoạt động | Giữ identity/firstDetectedAt/createdAt, cập nhật reason/lastDetectedAt, status ALREADY_WEAK |
| Đã xóa mềm | Giữ xóa, status SUPPRESSED; Study event/SM-2 vẫn được lưu |

MANUAL_MARK không che reason tự động của BOTH. Không có rule thì giữ reason và ngày phát hiện cũ; lastStudyQuality có thể được cập nhật từ review mới. Manual Add khôi phục soft-deleted record, giữ lịch sử và số liệu; thao tác tự động không được khôi phục. Không tự xóa hoặc bỏ cờ nguồn khi người học tiến bộ.

Không tạo active weak record với hai cờ false. Nếu muốn bỏ MANUAL trên MANUAL-only phải dùng thao tác xóa; patch tắt cờ cuối cùng bị từ chối. Filter AUTO và MANUAL tiếp tục bao gồm BOTH, đúng semantics cũ.

## 9. API

### POST /api/study/flashcards/{flashcardId}/review

Cần JWT hợp lệ, tài khoản hoạt động và quyền xem deck. userId luôn lấy từ principal.

```json
{"quality":3,"requestId":"1f9d3e4b-982c-4b74-849c-21f47bf3b531"}
```

Ví dụ schema kết quả sau Hard lặp, số liệu minh họa:

```json
{
  "id":10,
  "userId":12,
  "flashcardId":20,
  "easeFactor":222,
  "intervalDays":6,
  "repetitions":2,
  "nextReviewDate":"2026-10-31T10:00:00",
  "requestId":"1f9d3e4b-982c-4b74-849c-21f47bf3b531",
  "studyReviewCount":2,
  "studyAccuracy":0.0,
  "weakDetection":{"status":"AUTO_ADDED","reason":"STUDY_HARD_REPEAT","weakVocabularyId":33}
}
```

Các field SM-2 cũ giữ nguyên, kể cả easeFactor biểu diễn số nguyên theo tỷ lệ 100. `weakDetection` có status NOT_DETECTED/AUTO_ADDED/ALREADY_WEAK/SUPPRESSED. Không rule thì reason=null; weakVocabularyId có thể null nếu chưa có weak.

400: quality/requestId sai. 401: guest, JWT bị thu hồi/hết hạn/tài khoản bị khóa theo filter bảo mật hiện có. 403: tài khoản khóa được phát hiện tại service khi có request đang chờ khóa. 404: card/deck không tồn tại, đã xóa hoặc không được phép xem. 409: requestId reuse khác payload. Lỗi bắt buộc trong transaction rollback toàn bộ mutation.

### GET /api/weak-vocabularies

Giữ page/size, keyword, deckId, source, masteryMin/Max, accuracyMin/Max và sort cũ. Response vẫn dùng `items` và page metadata. Mỗi item bổ sung:

```json
{
  "detectionReason":"STUDY_HARD_REPEAT",
  "weakReason":"STUDY_HARD_REPEAT",
  "firstDetectedAt":"2026-10-25T05:00:00",
  "lastDetectedAt":"2026-10-25T05:00:00",
  "studyReviewCount":3,
  "studyAccuracy":33.33,
  "totalAttempts":0,
  "correctCount":0,
  "wrongCount":0,
  "accuracy":0.0,
  "masteryScore":0
}
```

`weakReason` giữ tên field cũ nhưng dùng controlled reason đúng nghĩa; UI mới dịch reason thay vì hiển thị mã. `accuracy` vẫn là Practice. Không trả nội dung của private/deleted deck ngoài quyền xem.

### GET /api/weak-vocabularies/decks

Cần xác thực, trả distinct deck có weak đang hoạt động mà chính người học được xem, dùng cho dropdown:

```json
[{"id":3,"name":"My private deck"}]
```

Các endpoint Manual Add, patch note, soft delete, Practice start/session/answer/summary giữ URL/request/response cũ. Không thêm endpoint sửa review history. Không cần statistics endpoint riêng vì response review/list đã đủ dữ liệu UI.

## 10. Frontend

- StudyMode dùng `submitStudyReview` trong `api/studyApi.js`, UUID mới cho một logical action; giữ UUID và quality sau lỗi để retry.
- Ref khóa ngay cả double click trước khi React render trạng thái saving. Pending request không cho chọn mức rating khác; có nút thử lưu lại. Không chuyển thẻ trước khi server xác nhận. Response đến muộn của phiên/deck cũ không thay state phiên mới.
- AUTO_ADDED hiển thị tên từ, lý do tiếng Việt và link “Xem danh sách từ yếu”; hiển thị cả khi đó là thẻ cuối.
- Guest vẫn xem/lật/thay thẻ public, không gọi review endpoint và không ghi lịch sử/weak/accuracy/mastery.
- WeakVocabulary hiển thị nguồn tiếng Việt và reason có ý nghĩa, hai nhóm chỉ số Study/Practice, “Chưa có dữ liệu”/“Chưa luyện tập” đúng ngữ cảnh.
- `weakVocabularyPresentation.js` tập trung nhãn lý do/nguồn/thông báo; không tính quyết định detection ở JavaScript.
- Giữ search, filter, sort, pagination, notes, delete, practice và theme hiện có. Filter accuracy ghi rõ là độ chính xác ôn luyện.
- WeakPracticeSession chặn double submit, hiển thị lỗi lưu. Không thay generator hoặc bốn dạng câu hỏi.

## 11. Security

Không nhận userId từ request body. Review/weak/practice đều thuộc principal hiện tại. DeckAccessPolicy tiếp tục chặn private của người khác và deck soft-delete. Cùng một public card có thể phát sinh weak record cá nhân của learner, không sửa card, owner hoặc dữ liệu learner khác. Lịch sử vẫn được giữ khi public deck chuyển private; list/session không làm lộ nội dung đã mất quyền.

LearningActivityLock đọc lại trạng thái account sau khi giữ khóa, phối hợp với account locking/JWT đã triển khai. Không thay SecurityConfig, JWT, Admin/Profile trong tính năng này. Guest không thể POST review, locked JWT không thể review/answer. Soft-deleted weak không được chọn vào phiên mới hoặc gửi đáp án qua phiên cũ.

## 12. Chạy và kiểm tra thủ công

Sau backup/migration đúng database, từ hai cửa sổ PowerShell:

```powershell
cd spring-boot-app
mvn clean test
mvn clean compile
mvn spring-boot:run
```

```powershell
cd frontend
npm ci
npm run build
npm run lint
npm run dev
```

Dùng cấu hình SQL Server/JWT/OAuth hiện có. Không dùng clean-install SQL. Không có demo statistics hoặc dữ liệu giả trong frontend.

### Kiểm tra UI

1. Guest mở public deck, lật/chuyển thẻ: không có POST review và không tăng event.
2. Login learner, mở một card đang đến hạn, chọn Again: lưu rồi chuyển thẻ, có thông báo và link weak list.
3. Mở weak list: nguồn AUTO, reason quên từ, studyReviewCount=1, studyAccuracy=0%, Practice “Chưa luyện tập”, Mastery=0.
4. Manual Add một từ khác; khi study hoặc practice đủ điều kiện, từ chuyển BOTH và giữ note/scores.
5. Xóa mềm một weak word rồi submit Again: API SUPPRESSED, từ không xuất hiện lại. Manual Add khôi phục đúng record.
6. Tạo lỗi mạng khi gửi Study rồi retry: request payload có cùng UUID. Sau server commit chỉ một event, một lần SM-2. Không đổi rating khi chưa giải quyết request cũ.
7. Practice: sai/sai/đúng → wrong=2, correct=1, total=3, consecutiveWrong=0, Mastery=20, accuracy=33.33%; weak record vẫn còn.
8. Kiểm tra source/accuracy/mastery/deck/search/sort/page, mobile layout và các liên kết Navbar/Admin/Profile.

### Kiểm tra chuỗi nhiều review qua API

UI vẫn tuân thủ lịch SM-2 nên một thẻ đã review sẽ không tự quay lại ngay trong danh sách due. Để kiểm tra deterministic sequence trong môi trường dev, gửi từng request với UUID khác nhau cho cùng card được phép xem; không sửa lịch trong database.

```powershell
# Đặt $token và $cardId bằng JWT/card của chính tài khoản kiểm thử; không ghi token vào repo.
$headers = @{ Authorization = "Bearer $token" }
$uri = "http://localhost:8080/api/study/flashcards/$cardId/review"
foreach ($quality in @(3, 4, 3)) {
    $body = @{ quality = $quality; requestId = [guid]::NewGuid().ToString() } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType 'application/json' -Body $body
}
```

Dùng Flashcard chưa có history để quan sát chuỗi mới. Thay bằng [1,1,1,4,4] để xác nhận rule LOW_RECALL ở review cuối. Dùng [1,1,4,4,4] để kiểm tra biên 60% không kích hoạt low rule.

Retry cùng payload:

```powershell
$body = @{ quality = 1; requestId = [guid]::NewGuid().ToString() } | ConvertTo-Json
$first = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType 'application/json' -Body $body
$replay = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType 'application/json' -Body $body
```

Hai kết quả phải là cùng snapshot; thay quality nhưng giữ requestId phải trả 409. Gửi JWT learner khác cho cùng card công khai phải có history riêng. Private của người khác, deleted deck, token locked và guest phải bị chặn.

## 13. Kiểm thử tự động và thay đổi kỳ vọng có chủ đích

`AutomaticWeakDetectionIntegrationTest` dùng H2 riêng với `MODE=MSSQLServer`, MockMvc, JPA thật, JWT thật và thread đồng thời. Bao phủ sequences/threshold/priority, stats thật, request replay/conflict, user/card isolation, giữ notes/mastery/accuracy, soft deletion/restore, Practice reinforcement và bounds, concurrency, rollback và deck/account security.

Các test cũ gọi constructor được cập nhật cho dependency history/lock mới. Hai test diễn đạt “một Hard tạo weak ngay” được đổi kỳ vọng theo yêu cầu mới; không đổi cách quality 3 được SM-2 xử lý. Test filter 0 attempts vẫn giữ kỳ vọng cũ để bảo đảm compatibility. Các suite Admin/Profile, DeckSecurity, Grammar, Study và Weak Practice vẫn phải chạy toàn bộ.

Kết quả thực thi cuối được ghi bên dưới sau khi build/test hoàn tất. H2 không thay thế xác minh migration SQL Server. Không tuyên bố browser E2E thành công khi chưa thực hiện bằng trình duyệt.

### Kết quả xác minh thực tế — 25/10/2026

| Kiểm tra | Kết quả |
|---|---|
| `mvn clean test -q` | 149 tests, 0 failures, 0 errors, 0 skipped |
| AutomaticWeakDetectionIntegrationTest | 40 tests mới, tất cả qua |
| AdminProfileIntegrationTest | 43 tests qua |
| DeckSecurityIntegrationTest | 20 tests qua |
| Authentication/Grammar/Study/Weak Vocabulary/Weak Practice còn lại | 46 tests qua |
| `npm run build` | Thành công |
| `npm run lint` | Exit 0, 0 errors, 39 warnings còn lại từ code sẵn có |
| `git diff --check` | Qua |

So với 40 warnings trước tính năng này, một cảnh báo React import không dùng trong StudyMode đã được loại bỏ; không thêm ESLint error. Test concurrency xác nhận request Study trùng chỉ tạo một event; request riêng biệt giữ đủ hai event và hai cập nhật easeFactor; practice cùng item chỉ chấm một lần, hai item khác nhau giữ đủ counters/Mastery. Test rollback xác nhận SM-2/event/weak cùng bị rollback khi transaction thất bại.

Chưa chạy migration trên SQL Server hiện tại; H2 MSSQLServer mode là database test, không phải chứng nhận tương thích migration trên SQL Server thật. Chưa thực hiện browser E2E; build/lint không được xem là bằng chứng toàn bộ thao tác UI đã chạy qua trình duyệt. Không ghi dữ liệu QA giả vào frontend hoặc database ứng dụng.

`mvn clean compile` dọn cả báo cáo Surefire của lượt test trước; chạy `mvn test` để tạo lại báo cáo khi cần.

Backend `mvn clean compile -q`: exit 0, thành công. Maven/JDK hiện có dòng khởi tạo `Access is denied.` và cảnh báo Guice dùng sun.misc.Unsafe; không có compilation error.
