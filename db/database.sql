-- =====================================================
-- 1. RECREATE DATABASE (Clean Slate)
-- =====================================================
USE master;
GO

IF DB_ID(N'demo_db') IS NOT NULL
BEGIN
    -- Terminate active connections so the DB can be safely dropped
    ALTER DATABASE demo_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE demo_db;
END;
GO

CREATE DATABASE demo_db;
GO

-- =====================================================
-- 2. USE DATABASE
-- =====================================================
USE demo_db;
GO

-- =====================================================
-- 4. CREATE TABLES (derived from current JPA entities)
-- =====================================================
CREATE TABLE dbo.users (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, email NVARCHAR(255) NULL, name NVARCHAR(255) NULL,
    avatar_url NVARCHAR(255) NULL, password NVARCHAR(255) NULL, provider NVARCHAR(255) NULL,
    provider_id NVARCHAR(255) NULL, role NVARCHAR(255) NULL
);
CREATE TABLE dbo.decks (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, name NVARCHAR(255) NULL, description NVARCHAR(MAX) NULL,
    owner_id BIGINT NULL, visibility VARCHAR(7) NOT NULL DEFAULT 'PUBLIC', deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_decks_owner FOREIGN KEY(owner_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_decks_visibility CHECK(visibility IN ('PUBLIC', 'PRIVATE'))
);
CREATE INDEX IX_decks_public ON dbo.decks(visibility, deleted, created_at DESC);
CREATE INDEX IX_decks_owner ON dbo.decks(owner_id, deleted, created_at DESC);
CREATE TABLE dbo.flashcards (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, deck_id BIGINT NULL, vocabulary NVARCHAR(255) NULL,
    meaning NVARCHAR(255) NULL, phonetic NVARCHAR(255) NULL, example_sentence NVARCHAR(MAX) NULL,
    CONSTRAINT FK_flashcards_deck FOREIGN KEY(deck_id) REFERENCES dbo.decks(id)
);
CREATE TABLE dbo.user_flashcard_reviews (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, user_id BIGINT NULL, flashcard_id BIGINT NULL,
    next_review_date DATETIME2 NULL, repetition_count INT NOT NULL DEFAULT 0, ease_factor FLOAT NOT NULL DEFAULT 2.5, interval_days INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_reviews_user FOREIGN KEY(user_id) REFERENCES dbo.users(id), CONSTRAINT FK_reviews_flashcard FOREIGN KEY(flashcard_id) REFERENCES dbo.flashcards(id)
);
CREATE TABLE dbo.user_weak_vocabularies (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, user_id BIGINT NOT NULL, flashcard_id BIGINT NOT NULL,
    manual_marked BIT NOT NULL DEFAULT 0, auto_detected BIT NOT NULL DEFAULT 0, mastery_score INT NOT NULL DEFAULT 0,
    total_attempts INT NOT NULL DEFAULT 0, correct_count INT NOT NULL DEFAULT 0, wrong_count INT NOT NULL DEFAULT 0, consecutive_wrong INT NOT NULL DEFAULT 0,
    last_study_quality INT NULL, weak_note NVARCHAR(MAX) NULL, weak_deleted BIT NOT NULL DEFAULT 0, weak_deleted_at DATETIME2 NULL,
    last_practiced_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_weak_user_flashcard UNIQUE(user_id, flashcard_id), CONSTRAINT FK_weak_user FOREIGN KEY(user_id) REFERENCES dbo.users(id), CONSTRAINT FK_weak_flashcard FOREIGN KEY(flashcard_id) REFERENCES dbo.flashcards(id)
);
CREATE TABLE dbo.weak_practice_sessions (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, user_id BIGINT NOT NULL, question_type NVARCHAR(255) NULL, status NVARCHAR(255) NULL,
    started_at DATETIME2 NULL, completed_at DATETIME2 NULL, total_questions INT NOT NULL, correct_answers INT NOT NULL, wrong_answers INT NOT NULL,
    CONSTRAINT FK_session_user FOREIGN KEY(user_id) REFERENCES dbo.users(id)
);
CREATE TABLE dbo.weak_practice_items (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, session_id BIGINT NOT NULL, weak_vocabulary_id BIGINT NOT NULL, item_order INT NOT NULL,
    question_type NVARCHAR(255) NULL, question_content NVARCHAR(MAX) NULL, correct_answer NVARCHAR(255) NULL, options_json NVARCHAR(MAX) NULL,
    answered BIT NOT NULL DEFAULT 0, answered_at DATETIME2 NULL,
    CONSTRAINT FK_item_session FOREIGN KEY(session_id) REFERENCES dbo.weak_practice_sessions(id), CONSTRAINT FK_item_weak FOREIGN KEY(weak_vocabulary_id) REFERENCES dbo.user_weak_vocabularies(id)
);
CREATE TABLE dbo.weak_practice_attempts (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, session_id BIGINT NOT NULL, item_id BIGINT NOT NULL, user_weak_vocabulary_id BIGINT NOT NULL,
    question_type NVARCHAR(255) NULL, question_content NVARCHAR(MAX) NULL, user_answer NVARCHAR(MAX) NULL, correct_answer NVARCHAR(255) NULL,
    correct BIT NOT NULL, attempted_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_attempt_session FOREIGN KEY(session_id) REFERENCES dbo.weak_practice_sessions(id), CONSTRAINT FK_attempt_item FOREIGN KEY(item_id) REFERENCES dbo.weak_practice_items(id), CONSTRAINT FK_attempt_weak FOREIGN KEY(user_weak_vocabulary_id) REFERENCES dbo.user_weak_vocabularies(id)
);
CREATE TABLE dbo.grammar_groups (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, group_key NVARCHAR(100) NOT NULL UNIQUE, title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL, icon NVARCHAR(50) NULL, author_name NVARCHAR(255) NULL, author_email NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
CREATE TABLE dbo.grammar_questions (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, question_key NVARCHAR(100) NULL, group_id BIGINT NULL,
    title NVARCHAR(255) NULL, question_type NVARCHAR(50) NOT NULL, instruction NVARCHAR(MAX) NULL,
    payload_json NVARCHAR(MAX) NULL, correct_token_id INT NULL, correction NVARCHAR(255) NULL,
    error_type NVARCHAR(255) NULL, hint NVARCHAR(500) NULL, explanation NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_questions_group FOREIGN KEY(group_id) REFERENCES dbo.grammar_groups(id) ON DELETE CASCADE
);
CREATE TABLE dbo.grammar_question_reports (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, report_key NVARCHAR(100) NOT NULL UNIQUE, group_id BIGINT NULL,
    question_key NVARCHAR(100) NULL, question_title NVARCHAR(255) NULL, error_type NVARCHAR(255) NULL,
    description NVARCHAR(MAX) NULL, reporter_name NVARCHAR(255) NULL, reporter_email NVARCHAR(255) NULL,
    author_name NVARCHAR(255) NULL, author_email NVARCHAR(255) NULL, status NVARCHAR(50) NOT NULL DEFAULT N'PENDING',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_reports_group FOREIGN KEY(group_id) REFERENCES dbo.grammar_groups(id) ON DELETE CASCADE
);
GO
-- =====================================================
-- 5. CONSTRAINTS / INDEXES
-- =====================================================
CREATE UNIQUE INDEX UX_users_email ON dbo.users(email) WHERE email IS NOT NULL;
CREATE INDEX IX_flashcards_deck ON dbo.flashcards(deck_id);
CREATE INDEX IX_reviews_user_flashcard ON dbo.user_flashcard_reviews(user_id, flashcard_id);
CREATE INDEX IX_weak_user_active ON dbo.user_weak_vocabularies(user_id, weak_deleted);
CREATE INDEX IX_weak_flashcard ON dbo.user_weak_vocabularies(flashcard_id);
CREATE INDEX IX_sessions_user ON dbo.weak_practice_sessions(user_id);
CREATE INDEX IX_items_session ON dbo.weak_practice_items(session_id, item_order);
CREATE INDEX IX_grammar_questions_group ON dbo.grammar_questions(group_id);
CREATE INDEX IX_grammar_reports_group ON dbo.grammar_question_reports(group_id);
CREATE INDEX IX_grammar_reports_author ON dbo.grammar_question_reports(author_email);
GO
-- =====================================================
-- 6. BASE SEED DATA
-- =====================================================
INSERT dbo.users(email,name,password,provider,role) VALUES
 (N'demo@studye.local',N'Demo StudyE',N'$2a$10$5jJSpWMyRZqmeEn9exHWCOtupH0dBCPoOPqqTK/RyvZFqCA2RRhuy',N'LOCAL',N'ROLE_USER');
INSERT dbo.decks(name,description) VALUES
 (N'Everyday English',N'Basic vocabulary'),(N'Academic English',N'Academic vocabulary'),(N'Travel',N'Useful travel vocabulary'),(N'Weak Vocabulary Demo',N'Development data for weak vocabulary and practice');
INSERT dbo.flashcards(deck_id,vocabulary,meaning,phonetic,example_sentence) VALUES
 (1,N'hello',N'xin chào',N'/həˈləʊ/',N'Say hello when you meet a friend.'),(1,N'learn',N'học',N'/lɜːn/',N'We learn something new every day.'),(2,N'research',N'nghiên cứu',N'/rɪˈsɜːtʃ/',N'Research requires careful evidence.'),(3,N'passport',N'hộ chiếu',N'/ˈpɑːspɔːt/',N'Keep your passport in a safe place.'),(3,N'journey',N'chuyến đi',N'/ˈdʒɜːni/',N'The journey begins at dawn.'),(2,N'analysis',N'phân tích',N'/əˈnæləsɪs/',N'Good analysis makes the report clear.');
-- =====================================================
-- 7. WEAK VOCABULARY DEMO DATA
-- =====================================================
DECLARE @demoDeck BIGINT=(SELECT id FROM dbo.decks WHERE name=N'Weak Vocabulary Demo');
DECLARE @words TABLE (word NVARCHAR(255), meaning NVARCHAR(255), phonetic NVARCHAR(255));
INSERT @words VALUES
 (N'abandon',N'từ bỏ',N'/əˈbændən/'),(N'ability',N'khả năng',N'/əˈbɪləti/'),(N'achieve',N'đạt được',N'/əˈtʃiːv/'),(N'adapt',N'thích nghi',N'/əˈdæpt/'),(N'adequate',N'đầy đủ',N'/ˈædɪkwət/'),(N'advantage',N'lợi thế',N'/ədˈvɑːntɪdʒ/'),(N'affect',N'ảnh hưởng',N'/əˈfekt/'),(N'alternative',N'phương án thay thế',N'/ɔːlˈtɜːnətɪv/'),(N'analyze',N'phân tích',N'/ˈænəlaɪz/'),(N'approach',N'cách tiếp cận',N'/əˈprəʊtʃ/'),
 (N'appropriate',N'phù hợp',N'/əˈprəʊpriət/'),(N'assume',N'giả định',N'/əˈsjuːm/'),(N'attempt',N'cố gắng',N'/əˈtempt/'),(N'aware',N'nhận thức',N'/əˈweə/'),(N'benefit',N'lợi ích',N'/ˈbenɪfɪt/'),(N'challenge',N'thách thức',N'/ˈtʃælɪndʒ/'),(N'circumstance',N'hoàn cảnh',N'/ˈsɜːkəmstæns/'),(N'combine',N'kết hợp',N'/kəmˈbaɪn/'),(N'communicate',N'giao tiếp',N'/kəˈmjuːnɪkeɪt/'),(N'compare',N'so sánh',N'/kəmˈpeə/'),
 (N'complex',N'phức tạp',N'/ˈkɒmpleks/'),(N'concentrate',N'tập trung',N'/ˈkɒnsəntreɪt/'),(N'consequence',N'hậu quả',N'/ˈkɒnsɪkwəns/'),(N'consider',N'xem xét',N'/kənˈsɪdə/'),(N'consistent',N'nhất quán',N'/kənˈsɪstənt/'),(N'consume',N'tiêu thụ',N'/kənˈsjuːm/'),(N'context',N'ngữ cảnh',N'/ˈkɒntekst/'),(N'contribute',N'đóng góp',N'/kənˈtrɪbjuːt/'),(N'convince',N'thuyết phục',N'/kənˈvɪns/'),(N'decline',N'suy giảm',N'/dɪˈklaɪn/'),
 (N'define',N'định nghĩa',N'/dɪˈfaɪn/'),(N'demonstrate',N'chứng minh',N'/ˈdemənstreɪt/'),(N'determine',N'xác định',N'/dɪˈtɜːmɪn/'),(N'develop',N'phát triển',N'/dɪˈveləp/'),(N'efficient',N'hiệu quả',N'/ɪˈfɪʃənt/'),(N'emphasize',N'nhấn mạnh',N'/ˈemfəsaɪz/'),(N'encourage',N'khuyến khích',N'/ɪnˈkʌrɪdʒ/'),(N'environment',N'môi trường',N'/ɪnˈvaɪrənmənt/'),(N'establish',N'thiết lập',N'/ɪˈstæblɪʃ/'),(N'estimate',N'ước tính',N'/ˈestɪmeɪt/'),
 (N'evaluate',N'đánh giá',N'/ɪˈvæljueɪt/'),(N'evidence',N'bằng chứng',N'/ˈevɪdəns/'),(N'expand',N'mở rộng',N'/ɪkˈspænd/'),(N'factor',N'yếu tố',N'/ˈfæktə/'),(N'feature',N'đặc điểm',N'/ˈfiːtʃə/'),(N'focus',N'tập trung',N'/ˈfəʊkəs/'),(N'function',N'chức năng',N'/ˈfʌŋkʃən/'),(N'generate',N'tạo ra',N'/ˈdʒenəreɪt/'),(N'identify',N'xác định',N'/aɪˈdentɪfaɪ/'),(N'impact',N'tác động',N'/ˈɪmpækt/'),
 (N'improve',N'cải thiện',N'/ɪmˈpruːv/'),(N'indicate',N'chỉ ra',N'/ˈɪndɪkeɪt/'),(N'influence',N'ảnh hưởng',N'/ˈɪnfluəns/'),(N'maintain',N'duy trì',N'/meɪnˈteɪn/'),(N'major',N'chủ yếu',N'/ˈmeɪdʒə/'),(N'method',N'phương pháp',N'/ˈmeθəd/'),(N'occur',N'xảy ra',N'/əˈkɜː/'),(N'participate',N'tham gia',N'/pɑːˈtɪsɪpeɪt/'),(N'perform',N'thực hiện',N'/pəˈfɔːm/'),(N'prevent',N'ngăn chặn',N'/prɪˈvent/'),
 (N'principle',N'nguyên tắc',N'/ˈprɪnsəpəl/'),(N'process',N'quy trình',N'/ˈprəʊses/'),(N'require',N'yêu cầu',N'/rɪˈkwaɪə/'),(N'respond',N'phản hồi',N'/rɪˈspɒnd/'),(N'significant',N'đáng kể',N'/sɪɡˈnɪfɪkənt/'),(N'similar',N'tương tự',N'/ˈsɪmɪlə/'),(N'specific',N'c cụ thể',N'/spəˈsɪfɪk/'),(N'strategy',N'chiến lược',N'/ˈstrætədʒi/'),(N'structure',N'cấu trúc',N'/ˈstrʌktʃə/'),(N'sufficient',N'đủ',N'/səˈfɪʃənt/'),
 (N'support',N'hỗ trợ',N'/səˈpɔːt/'),(N'tendency',N'xu hướng',N'/ˈtendənsi/'),(N'theory',N'lý thuyết',N'/ˈθɪəri/'),(N'transfer',N'chuyển giao',N'/trænsˈfɜː/'),(N'vary',N'thay đổi',N'/ˈveəri/'),(N'accept',N'chấp nhận',N'/əkˈsept/'),(N'access',N'truy cập',N'/ˈækses/'),(N'accurate',N'chính xác',N'/ˈækjərət/'),(N'acquire',N'tiếp thu',N'/əˈkwaɪə/'),(N'beneficial',N'có lợi',N'/benɪˈfɪʃəl/');
INSERT dbo.flashcards(deck_id,vocabulary,meaning,phonetic,example_sentence) SELECT @demoDeck,word,meaning,phonetic,N'Students should '+word+N' this concept during every lesson.' FROM @words;
INSERT dbo.user_weak_vocabularies(user_id,flashcard_id,manual_marked,auto_detected,mastery_score,total_attempts,correct_count,wrong_count,consecutive_wrong,last_study_quality,weak_note,weak_deleted,created_at,updated_at)
SELECT 1,id,CASE WHEN id%3 IN(0,2) THEN 1 ELSE 0 END,CASE WHEN id%3 IN(1,2) THEN 1 ELSE 0 END,(id*7)%101,id%21,(id%21)-(id%6),id%6,id%6,CASE WHEN id%2=0 THEN 1 ELSE 3 END,CASE WHEN id%5=0 THEN N'Ôn lại trong tuần này' ELSE NULL END,CASE WHEN id%71=0 THEN 1 ELSE 0 END,SYSDATETIME(),SYSDATETIME() FROM dbo.flashcards WHERE deck_id=@demoDeck;
GO
-- =====================================================
-- 8. GRAMMAR MODULE SEED DATA (TEST 1, TEST 2, TEST 3, TEST 4)
-- =====================================================
-- 8.1. Insert Groups
INSERT dbo.grammar_groups (group_key, title, description, icon, author_name, author_email) VALUES
 (N'group_test_01', N'Test 1', N'Bài kiểm tra tổng hợp: Thì Quá khứ, Hiện tại đơn, Menu thả xuống', N'', N'StudyE Official', N'buiquangviet032@gmail.com'),
 (N'group_test_02', N'Test 2', N'Bài kiểm tra chuyên đề: Câu điều kiện loại 1 & loại 2', N'', N'StudyE Official', N'buiquangviet032@gmail.com'),
 (N'group_test_03', N'Test 3', N'Bài kiểm tra: Giới từ, Cụm tính từ và Cấu trúc thường gặp', N'', N'StudyE Official', N'buiquangviet032@gmail.com'),
 (N'group_test_04', N'Test 4', N'Bài kiểm tra nâng cao: Hình ảnh, Đoạn văn điền từ, Đọc hiểu văn bản & Nghe Audio', N'', N'StudyE Official', N'buiquangviet032@gmail.com');

-- 8.2. Insert Questions for Test 1
INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, correct_token_id, correction, error_type, hint, explanation)
SELECT 
    g.id,
    N'cau_1_tim_loi_sai',
    N'Câu 1: Tìm Lỗi Sai - Thì Quá Khứ Đơn',
    N'SPOT_ERROR',
    N'Chỉ ra từ bị sai trong câu sau:',
    N'{"tokens":[{"id":1,"text":"She"},{"id":2,"text":"go"},{"id":3,"text":"to school"},{"id":4,"text":"yesterday."}]}',
    2,
    N'went',
    N'Thì quá khứ đơn / Tương hợp thời gian',
    N'Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu (yesterday).',
    N'Vì có trạng từ ''yesterday'' nên động từ ''go'' phải chia ở thì quá khứ đơn là ''went''.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_01';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_2_hien_tai_don',
    N'Câu 2: Điền Từ - Thì Hiện Tại Đơn',
    N'FILL_BLANK_TEXT',
    N'Hoàn thành câu bằng cách điền từ thích hợp:',
    N'{"template":"She usually {1} up early and {2} jogging.","blanks":{"1":{"hint":"wake","accepted_answers":["wakes"]},"2":{"hint":"go","accepted_answers":["goes"]}},"validation":{"strict_case":false,"ignore_extra_whitespace":true}}',
    N'Thì Hiện tại đơn: Diễn tả thói quen lặp đi lặp lại với chủ ngữ ngôi thứ ba số ít (She).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_01';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_3_chon_gioi_tu',
    N'Câu 3: Chọn Từ Trắc Nghiệm - Hiện Tại Hoàn Thành',
    N'FILL_BLANK_DROPDOWN',
    N'Chọn từ thích hợp từ danh sách thả xuống:',
    N'{"template":"They have lived in Vietnam {1} 3 years.","blanks":{"1":{"options":["for","since","from","during"],"correct_answer":"for"}}}',
    N'Dùng ''for'' đi kèm với một khoảng thời gian (3 years) trong thì Hiện tại hoàn thành.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_01';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_4_chon_the_dap_an',
    N'Câu 4: Chọn Từ Thả Xuống - Hiện Tại Hoàn Thành Tiếp Diễn',
    N'FILL_BLANK_DROPDOWN',
    N'Chọn từ thích hợp từ danh sách thả xuống:',
    N'{"template":"She has been living here {1} 2015.","blanks":{"1":{"options":["Since","For","From","During"],"correct_answer":"Since"}}}',
    N'Dùng ''Since'' đi kèm với mốc thời gian xác định trong quá khứ (2015) trong thì Hiện tại hoàn thành tiếp diễn.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_01';

-- 8.3. Insert Questions for Test 2
INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_cond_1',
    N'Câu 1: Điền Động Từ - Câu Điều Kiện Loại 2',
    N'FILL_BLANK_TEXT',
    N'Điền dạng đúng của động từ trong ngoặc:',
    N'{"template":"If I {1} enough money, I {2} a new house.","blanks":{"1":{"hint":"have","accepted_answers":["had"]},"2":{"hint":"buy","accepted_answers":["would buy","''d buy"]}},"validation":{"strict_case":false,"ignore_extra_whitespace":true}}',
    N'Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_02';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, correct_token_id, correction, error_type, hint, explanation)
SELECT 
    g.id,
    N'cau_cond_2',
    N'Câu 2: Tìm Lỗi Sai - Mệnh Đề If Loại 1',
    N'SPOT_ERROR',
    N'Chỉ ra từ bị sai trong câu điều kiện sau:',
    N'{"tokens":[{"id":1,"text":"If"},{"id":2,"text":"it"},{"id":3,"text":"will rain"},{"id":4,"text":"tomorrow,"},{"id":5,"text":"we will stay home."}]}',
    3,
    N'rains',
    N'Câu điều kiện loại 1 / Mệnh đề If',
    N'Mệnh đề If loại 1 không dùng ''will''.',
    N'Trong câu điều kiện loại 1, mệnh đề If chia thì Hiện tại đơn (''rains''), không dùng ''will rain''.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_02';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_cond_3',
    N'Câu 3: Chọn Từ Trắc Nghiệm - Câu Điều Kiện Loại 0',
    N'FILL_BLANK_DROPDOWN',
    N'Chọn từ đúng diễn tả chân lý hiển nhiên:',
    N'{"template":"If you heat ice, it {1}.","blanks":{"1":{"options":["melts","will melt","melted","would melt"],"correct_answer":"melts"}}}',
    N'Câu điều kiện loại 0 diễn tả sự thật hiển nhiên: Cả 2 vế đều dùng thì Hiện tại đơn (heat / melts).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_02';

-- 8.4. Insert Questions for Test 3
INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_prep_1',
    N'Câu 1: Chọn Từ Thả Xuống - Giới Từ Đi Kèm Tính Từ',
    N'FILL_BLANK_DROPDOWN',
    N'Chọn từ thích hợp từ danh sách thả xuống:',
    N'{"template":"They are interested {1} learning English online.","blanks":{"1":{"options":["in","on","at","with"],"correct_answer":"in"}}}',
    N'Cấu trúc cố định: ''to be interested in something'' (thích thú, quan tâm đến điều gì).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_03';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_prep_2',
    N'Câu 2: Điền Giới Từ - Giới Từ Chỉ Thời Gian',
    N'FILL_BLANK_TEXT',
    N'Điền giới từ chỉ thời gian thích hợp:',
    N'{"template":"The meeting starts {1} 9:00 AM {2} Monday.","blanks":{"1":{"hint":"giờ giấc","accepted_answers":["at"]},"2":{"hint":"thứ trong tuần","accepted_answers":["on"]}},"validation":{"strict_case":false,"ignore_extra_whitespace":true}}',
    N'Dùng ''at'' trước mốc giờ cụ thể (at 9:00 AM) và ''on'' trước ngày/thứ trong tuần (on Monday).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_03';

-- 8.5. Insert Questions for Test 4 (Multimedia & Reading)
INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_img_1',
    N'Câu 1: Quan sát hình ảnh lớp học',
    N'IMAGE_QUESTION',
    N'Quan sát bức ảnh bên dưới và chọn câu miêu tả chính xác nhất:',
    N'{"image_url":"https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80","image_caption":"Hoạt động trong lớp học hiện đại","question_text":"What are the students and teacher doing in the classroom?","options":["The teacher is explaining the lesson while students listen attentively.","The students are taking an exam in complete silence.","Everyone is playing outdoor sports in the school yard.","The teacher is writing a letter at the desk alone."],"correct_answer":"The teacher is explaining the lesson while students listen attentively."}',
    N'Bức ảnh thể hiện không gian lớp học sống động, giáo viên đang trao đổi và học sinh đang chú ý lắng nghe.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_04';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_cloze_1',
    N'Câu 2: Đoạn văn điền từ về Lợi ích đọc sách',
    N'PASSAGE_CLOZE',
    N'Đọc đoạn văn sau và chọn từ thích hợp cho mỗi chỗ trống:',
    N'{"passage_title":"The Benefits of Regular Reading","passage_text":"Reading books every day helps expand your vocabulary and improve your focus. It {1} you to learn new ideas and understand different cultures. Furthermore, developing a reading habit at an early age {2} proven to enhance critical thinking skills.","blanks":{"1":{"options":["allows","forces","forbids","stops"],"correct_answer":"allows"},"2":{"options":["has been","have been","was being","is having"],"correct_answer":"has been"}}}',
    N'[1] ''allows'' mang nghĩa tạo điều kiện / cho phép. [2] ''developing a reading habit'' là danh động từ số ít nên chia ''has been proven''.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_04';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_reading_1',
    N'Câu 3: Đọc hiểu - Trí Tuệ Nhân Tạo (AI)',
    N'READING_COMPREHENSION',
    N'Đọc kỹ đoạn văn sau và trả lời các câu hỏi bên dưới:',
    N'{"passage_title":"Artificial Intelligence in Everyday Life","passage_text":"Artificial Intelligence (AI) is rapidly transforming how we live and work. From virtual assistants on smartphones to personalized recommendations on streaming services, AI algorithms analyze vast amounts of data to provide convenient solutions. However, experts remind us that ethical guidelines are essential to ensure user privacy and data security.","sub_questions":[{"id":"sub_1","question":"What is one application of AI mentioned in the passage?","options":["Spacecraft manual navigation","Personalized recommendations on streaming services","Traditional postal mail delivery","Printing physical textbooks"],"correct_answer":"Personalized recommendations on streaming services"},{"id":"sub_2","question":"Why do experts emphasize ethical guidelines for AI?","options":["To completely stop technological advancement","To ensure user privacy and data security","To increase the prices of smartphones","To make algorithms run slower"],"correct_answer":"To ensure user privacy and data security"}]}',
    N'Đoạn văn nhấn mạnh ứng dụng thực tiễn của AI (gợi ý nội dung) và sự cần thiết của quy chuẩn đạo đức nhằm bảo vệ quyền riêng tư người dùng.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_04';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_audio_1',
    N'Câu 4: Nghe thông báo sân bay (Audio Listening)',
    N'AUDIO_LISTENING',
    N'Nghe thông báo âm thanh và chọn câu trả lời chính xác:',
    N'{"audio_url":"https://actions.google.com/sounds/v1/weather/rain_heavy.ogg","transcript":"Good morning passengers! Flight VN382 to Da Nang is now boarding at Gate 4. Please have your boarding passes and identity cards ready.","question_text":"Which flight is currently boarding according to the announcement?","options":["Flight VN382 to Da Nang at Gate 4","Flight VN120 to Hanoi at Gate 2","Flight QH555 to Nha Trang at Gate 10","Flight VJ888 to Phu Quoc at Gate 7"],"correct_answer":"Flight VN382 to Da Nang at Gate 4"}',
    N'Thông báo ghi rõ: ''Flight VN382 to Da Nang is now boarding at Gate 4''.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_04';
GO

-- =====================================================
-- 9. VERIFICATION
-- =====================================================
SELECT COUNT(*) AS user_count FROM dbo.users;
SELECT COUNT(*) AS deck_count FROM dbo.decks;
SELECT COUNT(*) AS flashcard_count FROM dbo.flashcards;
SELECT COUNT(*) AS weak_vocabulary_count FROM dbo.user_weak_vocabularies;
SELECT COUNT(*) AS weak_practice_session_count FROM dbo.weak_practice_sessions;
SELECT COUNT(*) AS weak_practice_item_count FROM dbo.weak_practice_items;
SELECT COUNT(*) AS weak_practice_attempt_count FROM dbo.weak_practice_attempts;
SELECT COUNT(*) AS grammar_group_count FROM dbo.grammar_groups;
SELECT COUNT(*) AS grammar_question_count FROM dbo.grammar_questions;
