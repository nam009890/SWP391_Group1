-- Chạy trên database EVMS hiện tại, KHÔNG chạy database.sql (script reset).
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF COL_LENGTH('dbo.decks', 'owner_id') IS NULL
    ALTER TABLE dbo.decks ADD owner_id BIGINT NULL;
IF COL_LENGTH('dbo.decks', 'visibility') IS NULL
    ALTER TABLE dbo.decks ADD visibility VARCHAR(7) NOT NULL CONSTRAINT DF_decks_visibility DEFAULT 'PUBLIC' WITH VALUES;
IF COL_LENGTH('dbo.decks', 'deleted') IS NULL
    ALTER TABLE dbo.decks ADD deleted BIT NOT NULL CONSTRAINT DF_decks_deleted DEFAULT 0 WITH VALUES;
IF COL_LENGTH('dbo.decks', 'created_at') IS NULL
    ALTER TABLE dbo.decks ADD created_at DATETIME2 NOT NULL CONSTRAINT DF_decks_created DEFAULT SYSDATETIME() WITH VALUES;
IF COL_LENGTH('dbo.decks', 'updated_at') IS NULL
    ALTER TABLE dbo.decks ADD updated_at DATETIME2 NOT NULL CONSTRAINT DF_decks_updated DEFAULT SYSDATETIME() WITH VALUES;
-- Dynamic SQL tránh lỗi compile nếu các column vừa được thêm trong cùng batch.
EXEC(N'UPDATE dbo.decks SET visibility = ''PUBLIC'' WHERE visibility IS NULL;
       UPDATE dbo.decks SET deleted = 0 WHERE deleted IS NULL;
       UPDATE dbo.decks SET created_at = SYSDATETIME() WHERE created_at IS NULL;
       UPDATE dbo.decks SET updated_at = created_at WHERE updated_at IS NULL;');
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('dbo.decks') AND name = 'FK_decks_owner')
    EXEC(N'ALTER TABLE dbo.decks ADD CONSTRAINT FK_decks_owner FOREIGN KEY(owner_id) REFERENCES dbo.users(id)');
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('dbo.decks') AND name = 'CK_decks_visibility')
    EXEC(N'ALTER TABLE dbo.decks ADD CONSTRAINT CK_decks_visibility CHECK(visibility IN (''PUBLIC'', ''PRIVATE''))');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.decks') AND name = 'IX_decks_public')
    EXEC(N'CREATE INDEX IX_decks_public ON dbo.decks(visibility, deleted, created_at DESC)');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.decks') AND name = 'IX_decks_owner')
    EXEC(N'CREATE INDEX IX_decks_owner ON dbo.decks(owner_id, deleted, created_at DESC)');
COMMIT;
EXEC(N'SELECT COUNT(*) AS total_decks, SUM(CASE WHEN owner_id IS NULL THEN 1 ELSE 0 END) AS legacy_decks FROM dbo.decks');
