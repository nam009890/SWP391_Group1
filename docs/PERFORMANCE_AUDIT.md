# Rà soát hiệu năng EVMS — 25/10/2026

Đã rà soát khởi tạo auth, chuyển route, Deck/Study, Grammar, API client, paging/count Deck/Weak/Admin, JWT và cấu hình Hibernate/HTTP. Không reset SQL Server, không gọi AI trả phí, không thay schema trong đợt tối ưu này.

## Điểm đã sửa và bằng chứng

| Điểm | Trước | Sau |
|---|---|---|
| Làm mới hồ sơ khi focus cửa sổ | Object user mới khiến Deck gọi lại 3 API, Study tải lại due cards và reset phiên | Effect phụ thuộc account ID (Deck thêm role), không phụ thuộc toàn object hồ sơ. Đổi tài khoản/deck hoặc thao tác refresh vẫn tải mới. Regression React kiểm tra request count. |
| Tải trang Deck | Chunk DeckDetails 17,95 KB / gzip 5,67 KB | 8,42 KB / gzip 2,94 KB; UI AI là chunk riêng, chỉ tải khi mở generator. Không làm API AI trước khi người học yêu cầu. |
| Danh sách Grammar | Một query nhóm và hai lazy collection query cho từng nhóm: 1+2G | BatchSize 32 cho questions/reports; integration test hơn 20 nhóm kiểm tra tối đa 3 statement, không join hai collection gây tích Descartes. Với nhiều hơn 32 nhóm, số batch tăng theo lượng dữ liệu. |
| Xác thực mỗi request | Verify/parse cùng JWT 4 lần | Verify/parse một lần, giữ kiểm tra expiry/signature, account lock, tokenVersion và authIdentity bằng DB mỗi request. Không cache quyền hoặc trạng thái khóa. |
| Log SQL | In mọi SQL và format mỗi truy vấn | Mặc định tắt; bật khi cần bằng SHOW_SQL=true / FORMAT_SQL=true. |
| JSON qua HTTP | Chưa bật nén ứng dụng | Bật compression cho JSON/text từ 2 KB. Đo trên API Grammar H2 QA: 10.465 byte identity → 3.835 byte gzip, giảm khoảng 63%. |
| Weak request ở Deck | Không hủy khi rời trang | Truyền AbortSignal vào request Weak cùng các request Deck/Card. |
| Grammar localStorage | JSON có indentation | JSON compact, giữ nguyên dữ liệu và khả năng đọc cache cũ. |

Build size là số liệu build production trên máy local, không phải tốc độ mạng hoặc thời gian render. Chunk chính khoảng 412,5 KB vẫn chứa React/router/i18n và hai locale; không tuyên bố đã giảm chunk này. Nén yêu cầu client gửi Accept-Encoding phù hợp; reverse proxy cần cấu hình tương ứng khi triển khai.

## Kiểm chứng

- Maven clean test: 251 tests, 0 failure/error/skipped; gồm regression auth và query count Grammar.
- React: 9 tests pass; thêm trường hợp cập nhật hồ sơ không tải lại Deck/Study, đổi account vẫn tải lại.
- Frontend production build pass; i18n checker pass; lint 0 errors, 39 warnings từ mã hiện có.
- Browser regression: 5 scenario Chrome pass (1,3 phút), gồm Study, AI offline preview/commit, admin lock/unlock và route matrix VI/EN/mobile trên H2 QA riêng. Backend SQL Server hiện tại không bị thay đổi.

## Chạy demo bằng build production

Chạy từ repository root, hai terminal riêng. Đóng Vite/server cũ đang chiếm cùng port trước.

```powershell
# Terminal 1: Backend (SQL Server đã cấu hình trong application.properties)
mvn -f spring-boot-app/pom.xml spring-boot:run

# Terminal 2: dùng build để tránh chi phí transform/HMR của dev server
npm --prefix frontend run build
npm --prefix frontend run preview -- --host localhost --port 5173 --strictPort
```

Mở http://localhost:5173 để khớp CORS mặc định. Vite preview dành cho trình diễn local, không thay production web server. Restart Backend để cấu hình SQL log/compression mới có hiệu lực. Dev React StrictMode có thể chạy lại effect lúc mount để phát hiện lỗi; không tắt StrictMode chỉ để giấu request development.

## Giới hạn và hướng theo dõi

Chưa có benchmark tải đồng thời trên SQL Server thật hoặc đường mạng của người dùng, nên không đưa phần trăm cải thiện thời gian đáp ứng toàn hệ thống. Deck/Weak/Admin đã có paging và Deck đã batch count/owner; giữ các cơ chế đó. Không thêm cache toàn cục cho dữ liệu cá nhân/quota/quyền để tránh stale sau chỉnh sửa hoặc khóa tài khoản. Không tự tăng connection pool khi chưa có bằng chứng nghẽn pool.

Grammar vẫn trả toàn bộ payload theo contract hiện tại; khi học liệu lớn cần tách group summary và tải câu hỏi theo nhóm, đồng thời cập nhật offline/print/CMS. Chưa đổi contract này trong bản tối ưu để giữ các luồng hiện có. Gemini/OpenAI phụ thuộc thời gian nhà cung cấp, không có live latency benchmark trong task này.
