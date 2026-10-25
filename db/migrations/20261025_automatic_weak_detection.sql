-- Chạy trên database hiện có sau migration Admin/Profile. KHÔNG chạy database.sql.
-- Không tái tạo lịch sử từ SM-2, không xóa/sửa progress để xử lý dữ liệu trùng.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID('dbo.user_flashcard_reviews','U') IS NULL OR OBJECT_ID('dbo.user_weak_vocabularies','U') IS NULL
    THROW 50010, 'Select the existing application database and apply prerequisite migrations.', 1;

-- Dừng và cung cấp chẩn đoán để DBA xử lý chủ động; không tự chọn/xóa bản ghi học.
IF EXISTS (SELECT 1 FROM dbo.user_flashcard_reviews GROUP BY user_id,flashcard_id HAVING COUNT(*) > 1)
BEGIN
    SELECT user_id,flashcard_id,COUNT(*) AS duplicate_count FROM dbo.user_flashcard_reviews
    GROUP BY user_id,flashcard_id HAVING COUNT(*) > 1;
    THROW 50011, 'Duplicate SM-2 states found. Review and reconcile manually before rerunning.', 1;
END;
IF EXISTS (SELECT 1 FROM dbo.user_weak_vocabularies GROUP BY user_id,flashcard_id HAVING COUNT(*) > 1)
    THROW 50012, 'Duplicate weak records found. Preserve history and reconcile manually.', 1;
IF EXISTS (SELECT 1 FROM dbo.weak_practice_attempts GROUP BY item_id HAVING COUNT(*) > 1)
BEGIN
    SELECT item_id,COUNT(*) AS duplicate_count FROM dbo.weak_practice_attempts GROUP BY item_id HAVING COUNT(*) > 1;
    THROW 50013, 'Duplicate practice attempts found. Review manually before adding uniqueness.', 1;
END;

IF COL_LENGTH('dbo.user_weak_vocabularies','detection_reason') IS NULL
    ALTER TABLE dbo.user_weak_vocabularies ADD detection_reason VARCHAR(40) NULL;
IF COL_LENGTH('dbo.user_weak_vocabularies','first_detected_at') IS NULL
    ALTER TABLE dbo.user_weak_vocabularies ADD first_detected_at DATETIME2 NULL;
IF COL_LENGTH('dbo.user_weak_vocabularies','last_detected_at') IS NULL
    ALTER TABLE dbo.user_weak_vocabularies ADD last_detected_at DATETIME2 NULL;
EXEC(N'UPDATE dbo.user_weak_vocabularies
       SET detection_reason = CASE WHEN auto_detected = 1 THEN ''LEGACY_AUTO'' ELSE ''MANUAL_MARK'' END
       WHERE detection_reason IS NULL AND (auto_detected = 1 OR manual_marked = 1);');
-- Ngày phát hiện cũ không biết chính xác nên để NULL, kể cả BOTH và từ đã xóa mềm.

IF OBJECT_ID('dbo.flashcard_study_events','U') IS NULL
BEGIN
    CREATE TABLE dbo.flashcard_study_events (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        flashcard_id BIGINT NOT NULL,
        quality INT NOT NULL,
        confident_recall BIT NOT NULL,
        request_id VARCHAR(36) NOT NULL,
        reviewed_at DATETIME2 NOT NULL CONSTRAINT DF_study_event_reviewed DEFAULT SYSUTCDATETIME(),
        response_json NVARCHAR(MAX) NULL,
        CONSTRAINT FK_study_event_user FOREIGN KEY(user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_study_event_card FOREIGN KEY(flashcard_id) REFERENCES dbo.flashcards(id),
        CONSTRAINT CK_study_event_quality CHECK(quality IN (1,3,4,5)),
        CONSTRAINT CK_study_event_confident CHECK((quality IN (4,5) AND confident_recall = 1)
            OR (quality IN (1,3) AND confident_recall = 0)),
        CONSTRAINT UQ_study_event_user_request UNIQUE(user_id,request_id)
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.flashcard_study_events') AND name='IX_study_event_history')
    EXEC(N'CREATE INDEX IX_study_event_history ON dbo.flashcard_study_events(user_id,flashcard_id,id DESC) INCLUDE(quality,confident_recall)');

-- Nhận diện unique index theo cột, tránh tạo index trùng do tên Hibernate khác tên SQL.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID('dbo.user_flashcard_reviews') AND i.is_unique=1
    AND (SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=2
    AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name='user_id')
    AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name='flashcard_id'))
    EXEC(N'ALTER TABLE dbo.user_flashcard_reviews ADD CONSTRAINT UQ_review_user_card UNIQUE(user_id,flashcard_id)');
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID('dbo.user_weak_vocabularies') AND i.is_unique=1
    AND (SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=2
    AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name='user_id')
    AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name='flashcard_id'))
    EXEC(N'ALTER TABLE dbo.user_weak_vocabularies ADD CONSTRAINT UQ_weak_user_flashcard UNIQUE(user_id,flashcard_id)');
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID('dbo.weak_practice_attempts') AND i.is_unique=1
    AND (SELECT COUNT(*) FROM sys.index_columns ic WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0)=1
    AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 AND c.name='item_id'))
    EXEC(N'ALTER TABLE dbo.weak_practice_attempts ADD CONSTRAINT UQ_practice_attempt_item UNIQUE(item_id)');
COMMIT;
