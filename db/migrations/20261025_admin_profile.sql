-- Migration cộng thêm cho database hiện tại. KHÔNG chạy db/database.sql.
-- Sao lưu trước; chọn đúng database trong SSMS/sqlcmd. Thời gian mới lưu UTC.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID('dbo.users', 'U') IS NULL
    THROW 50001, 'Missing dbo.users. Select the existing application database.', 1;
IF COL_LENGTH('dbo.users','locked') IS NULL
    ALTER TABLE dbo.users ADD locked BIT NOT NULL CONSTRAINT DF_users_locked DEFAULT 0 WITH VALUES;
IF COL_LENGTH('dbo.users','token_version') IS NULL
    ALTER TABLE dbo.users ADD token_version BIGINT NOT NULL CONSTRAINT DF_users_token_version DEFAULT 0 WITH VALUES;
IF COL_LENGTH('dbo.users','locked_at') IS NULL
    ALTER TABLE dbo.users ADD locked_at DATETIME2 NULL;
IF COL_LENGTH('dbo.users','locked_reason') IS NULL
    ALTER TABLE dbo.users ADD locked_reason NVARCHAR(500) NULL;
IF COL_LENGTH('dbo.users','locked_by') IS NULL
    ALTER TABLE dbo.users ADD locked_by BIGINT NULL;
IF COL_LENGTH('dbo.users','created_at') IS NULL
    ALTER TABLE dbo.users ADD created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME() WITH VALUES;
IF COL_LENGTH('dbo.users','updated_at') IS NULL
    ALTER TABLE dbo.users ADD updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME() WITH VALUES;
IF COL_LENGTH('dbo.users','last_login_at') IS NULL
    ALTER TABLE dbo.users ADD last_login_at DATETIME2 NULL;
IF COL_LENGTH('dbo.users','bio') IS NULL
    ALTER TABLE dbo.users ADD bio NVARCHAR(500) NULL;
-- SQL động tránh lỗi compile khi cột vừa được thêm trong cùng batch.
EXEC(N'UPDATE dbo.users SET locked = 0 WHERE locked IS NULL;
       UPDATE dbo.users SET token_version = 0 WHERE token_version IS NULL;
       UPDATE dbo.users SET role = ''ROLE_USER'' WHERE role IS NULL OR LTRIM(RTRIM(role)) = '''';
       UPDATE dbo.users SET created_at = SYSUTCDATETIME() WHERE created_at IS NULL;
       UPDATE dbo.users SET updated_at = created_at WHERE updated_at IS NULL;
       ALTER TABLE dbo.users ALTER COLUMN locked BIT NOT NULL;
       ALTER TABLE dbo.users ALTER COLUMN token_version BIGINT NOT NULL;');
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints d JOIN sys.columns c ON c.object_id=d.parent_object_id AND c.column_id=d.parent_column_id WHERE c.object_id=OBJECT_ID('dbo.users') AND c.name='locked')
    EXEC(N'ALTER TABLE dbo.users ADD CONSTRAINT DF_users_locked DEFAULT 0 FOR locked');
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints d JOIN sys.columns c ON c.object_id=d.parent_object_id AND c.column_id=d.parent_column_id WHERE c.object_id=OBJECT_ID('dbo.users') AND c.name='token_version')
    EXEC(N'ALTER TABLE dbo.users ADD CONSTRAINT DF_users_token_version DEFAULT 0 FOR token_version');
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints d JOIN sys.columns c ON c.object_id=d.parent_object_id AND c.column_id=d.parent_column_id WHERE c.object_id=OBJECT_ID('dbo.users') AND c.name='role')
    EXEC(N'ALTER TABLE dbo.users ADD CONSTRAINT DF_users_role DEFAULT ''ROLE_USER'' FOR role');
IF OBJECT_ID('dbo.admin_user_action_logs','U') IS NULL
BEGIN
    CREATE TABLE dbo.admin_user_action_logs (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        admin_id BIGINT NOT NULL,
        target_user_id BIGINT NOT NULL,
        action VARCHAR(20) NOT NULL,
        reason NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_admin_logs_created DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_admin_logs_admin FOREIGN KEY(admin_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_admin_logs_target FOREIGN KEY(target_user_id) REFERENCES dbo.users(id),
        CONSTRAINT CK_admin_logs_action CHECK(action IN ('LOCK_USER','UNLOCK_USER'))
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.users') AND name='IX_users_admin_search')
    EXEC(N'CREATE INDEX IX_users_admin_search ON dbo.users(locked,role,created_at DESC) INCLUDE(name,email)');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.admin_user_action_logs') AND name='IX_admin_logs_created')
    EXEC(N'CREATE INDEX IX_admin_logs_created ON dbo.admin_user_action_logs(created_at DESC,id DESC)');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.admin_user_action_logs') AND name='IX_admin_logs_target')
    EXEC(N'CREATE INDEX IX_admin_logs_target ON dbo.admin_user_action_logs(target_user_id,created_at DESC)');
COMMIT;
-- Không sửa role hợp lệ, mật khẩu, quyền sở hữu deck hay lịch sử học.
