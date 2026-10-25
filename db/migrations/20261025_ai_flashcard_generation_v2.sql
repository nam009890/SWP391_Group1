-- Migration cộng thêm AI Flashcard Generator V2. Chọn database hiện có và sao lưu trước.
-- KHÔNG chạy db/database.sql. Không sửa dữ liệu Flashcard/Study/Weak/Admin/Profile hiện tại.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID('dbo.users','U') IS NULL OR OBJECT_ID('dbo.decks','U') IS NULL
    THROW 50020, 'Select the existing application database first.', 1;
IF OBJECT_ID('dbo.ai_generation_gate','U') IS NULL
    CREATE TABLE dbo.ai_generation_gate (id BIGINT NOT NULL PRIMARY KEY);
IF NOT EXISTS (SELECT 1 FROM dbo.ai_generation_gate WHERE id=1)
    INSERT INTO dbo.ai_generation_gate(id) VALUES(1);
IF OBJECT_ID('dbo.ai_generation_batches','U') IS NULL
BEGIN
    CREATE TABLE dbo.ai_generation_batches (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        deck_id BIGINT NOT NULL,
        request_id VARCHAR(36) NOT NULL,
        request_fingerprint VARCHAR(64) NOT NULL,
        source VARCHAR(20) NOT NULL,
        prompt_version VARCHAR(40) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at DATETIME2 NOT NULL,
        expires_at DATETIME2 NOT NULL,
        lease_until DATETIME2 NOT NULL,
        input_tokens BIGINT NULL,
        output_tokens BIGINT NULL,
        provider_attempts INT NULL,
        failure_code VARCHAR(60) NULL,
        failure_status INT NULL,
        preview_json NVARCHAR(MAX) NULL,
        commit_fingerprint VARCHAR(64) NULL,
        commit_json NVARCHAR(MAX) NULL,
        CONSTRAINT FK_ai_batch_user FOREIGN KEY(user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_ai_batch_deck FOREIGN KEY(deck_id) REFERENCES dbo.decks(id),
        CONSTRAINT UQ_ai_user_request UNIQUE(user_id,request_id),
        CONSTRAINT CK_ai_source CHECK(source IN ('OPENAI','DEMO_LIBRARY')),
        CONSTRAINT CK_ai_status CHECK(status IN ('PENDING','READY','FAILED','EXPIRED','COMMITTED'))
    );
END;
IF COL_LENGTH('dbo.ai_generation_batches','failure_status') IS NULL
    ALTER TABLE dbo.ai_generation_batches ADD failure_status INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.ai_generation_batches') AND name='IX_ai_created')
    CREATE INDEX IX_ai_created ON dbo.ai_generation_batches(created_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.ai_generation_batches') AND name='IX_ai_user_created')
    CREATE INDEX IX_ai_user_created ON dbo.ai_generation_batches(user_id,created_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.ai_generation_batches') AND name='IX_ai_pending')
    CREATE INDEX IX_ai_pending ON dbo.ai_generation_batches(user_id,status,lease_until);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.ai_generation_batches') AND name='IX_ai_expiry')
    CREATE INDEX IX_ai_expiry ON dbo.ai_generation_batches(status,expires_at);
COMMIT;
