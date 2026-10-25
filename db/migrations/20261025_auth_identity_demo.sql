-- Incremental only: preserve users, passwords, roles and all learning data.
USE [demo_db];
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF COL_LENGTH(N'dbo.users',N'auth_identity') IS NULL
        ALTER TABLE dbo.users ADD auth_identity VARCHAR(36) NULL;
    IF COL_LENGTH(N'dbo.users',N'demo_account') IS NULL
        ALTER TABLE dbo.users ADD demo_account BIT NOT NULL CONSTRAINT DF_users_demo_account DEFAULT 0 WITH VALUES;
    EXEC(N'UPDATE dbo.users SET auth_identity=CONVERT(VARCHAR(36),NEWID()) WHERE auth_identity IS NULL;
           ALTER TABLE dbo.users ALTER COLUMN auth_identity VARCHAR(36) NOT NULL;');
    IF NOT EXISTS(SELECT 1 FROM sys.default_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.users')
                  AND parent_column_id=COLUMNPROPERTY(OBJECT_ID(N'dbo.users'),N'auth_identity','ColumnId'))
        EXEC(N'ALTER TABLE dbo.users ADD CONSTRAINT DF_users_auth_identity DEFAULT CONVERT(VARCHAR(36),NEWID()) FOR auth_identity;');
    IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.users') AND name=N'UQ_users_auth_identity')
        EXEC(N'ALTER TABLE dbo.users ADD CONSTRAINT UQ_users_auth_identity UNIQUE(auth_identity);');
    IF EXISTS(SELECT 1 FROM dbo.users WHERE provider=N'GOOGLE' AND provider_id IS NOT NULL GROUP BY provider_id HAVING COUNT(*)>1)
        THROW 51601,'Duplicate Google subjects found; reconcile manually without deleting history.',1;
    IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.users') AND name=N'UX_users_google_subject')
        EXEC(N'CREATE UNIQUE INDEX UX_users_google_subject ON dbo.users(provider_id) WHERE provider=N''GOOGLE'' AND provider_id IS NOT NULL;');
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
