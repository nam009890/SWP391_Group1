-- =====================================================
-- 1. CREATE DATABASE IF NOT EXISTS
-- =====================================================
IF DB_ID(N'demo_db') IS NULL
BEGIN
    CREATE DATABASE demo_db;
END;
GO
-- =====================================================
-- 2. USE DATABASE
-- =====================================================
USE demo_db;
GO
-- =====================================================
-- 3. DROP EXISTING TABLES (children before parents)
-- =====================================================
IF OBJECT_ID(N'dbo.weak_practice_attempts', N'U') IS NOT NULL DROP TABLE dbo.weak_practice_attempts;
IF OBJECT_ID(N'dbo.weak_practice_items', N'U') IS NOT NULL DROP TABLE dbo.weak_practice_items;
IF OBJECT_ID(N'dbo.weak_practice_sessions', N'U') IS NOT NULL DROP TABLE dbo.weak_practice_sessions;
IF OBJECT_ID(N'dbo.user_weak_vocabularies', N'U') IS NOT NULL DROP TABLE dbo.user_weak_vocabularies;
IF OBJECT_ID(N'dbo.user_flashcard_reviews', N'U') IS NOT NULL DROP TABLE dbo.user_flashcard_reviews;
IF OBJECT_ID(N'dbo.flashcards', N'U') IS NOT NULL DROP TABLE dbo.flashcards;
IF OBJECT_ID(N'dbo.decks', N'U') IS NOT NULL DROP TABLE dbo.decks;
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL DROP TABLE dbo.users;
GO
-- =====================================================
-- 4. CREATE TABLES (derived from current JPA entities)
-- =====================================================
CREATE TABLE dbo.users (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, email NVARCHAR(255) NULL, name NVARCHAR(255) NULL,
    avatar_url NVARCHAR(255) NULL, password NVARCHAR(255) NULL, provider NVARCHAR(255) NULL,
    provider_id NVARCHAR(255) NULL, role NVARCHAR(255) NULL
);
CREATE TABLE dbo.decks (id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY, name NVARCHAR(255) NULL, description NVARCHAR(MAX) NULL);
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
 (N'principle',N'nguyên tắc',N'/ˈprɪnsəpəl/'),(N'process',N'quy trình',N'/ˈprəʊses/'),(N'require',N'yêu cầu',N'/rɪˈkwaɪə/'),(N'respond',N'phản hồi',N'/rɪˈspɒnd/'),(N'significant',N'đáng kể',N'/sɪɡˈnɪfɪkənt/'),(N'similar',N'tương tự',N'/ˈsɪmɪlə/'),(N'specific',N'cụ thể',N'/spəˈsɪfɪk/'),(N'strategy',N'chiến lược',N'/ˈstrætədʒi/'),(N'structure',N'cấu trúc',N'/ˈstrʌktʃə/'),(N'sufficient',N'đủ',N'/səˈfɪʃənt/'),
 (N'support',N'hỗ trợ',N'/səˈpɔːt/'),(N'tendency',N'xu hướng',N'/ˈtendənsi/'),(N'theory',N'lý thuyết',N'/ˈθɪəri/'),(N'transfer',N'chuyển giao',N'/trænsˈfɜː/'),(N'vary',N'thay đổi',N'/ˈveəri/'),(N'accept',N'chấp nhận',N'/əkˈsept/'),(N'access',N'truy cập',N'/ˈækses/'),(N'accurate',N'chính xác',N'/ˈækjərət/'),(N'acquire',N'tiếp thu',N'/əˈkwaɪə/'),(N'beneficial',N'có lợi',N'/benɪˈfɪʃəl/');
INSERT dbo.flashcards(deck_id,vocabulary,meaning,phonetic,example_sentence) SELECT @demoDeck,word,meaning,phonetic,N'Students should '+word+N' this concept during every lesson.' FROM @words;
INSERT dbo.user_weak_vocabularies(user_id,flashcard_id,manual_marked,auto_detected,mastery_score,total_attempts,correct_count,wrong_count,consecutive_wrong,last_study_quality,weak_note,weak_deleted,created_at,updated_at)
SELECT 1,id,CASE WHEN id%3 IN(0,2) THEN 1 ELSE 0 END,CASE WHEN id%3 IN(1,2) THEN 1 ELSE 0 END,(id*7)%101,id%21,(id%21)-(id%6),id%6,id%6,CASE WHEN id%2=0 THEN 1 ELSE 3 END,CASE WHEN id%5=0 THEN N'Ôn lại trong tuần này' ELSE NULL END,CASE WHEN id%71=0 THEN 1 ELSE 0 END,SYSDATETIME(),SYSDATETIME() FROM dbo.flashcards WHERE deck_id=@demoDeck;
GO
-- =====================================================
-- 8. VERIFICATION
-- =====================================================
SELECT COUNT(*) AS user_count FROM dbo.users;
SELECT COUNT(*) AS deck_count FROM dbo.decks;
SELECT COUNT(*) AS flashcard_count FROM dbo.flashcards;
SELECT COUNT(*) AS weak_vocabulary_count FROM dbo.user_weak_vocabularies;
SELECT COUNT(*) AS weak_practice_session_count FROM dbo.weak_practice_sessions;
SELECT COUNT(*) AS weak_practice_item_count FROM dbo.weak_practice_items;
SELECT COUNT(*) AS weak_practice_attempt_count FROM dbo.weak_practice_attempts;
