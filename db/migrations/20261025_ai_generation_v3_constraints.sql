-- EVMS AI V3: repair the existing AI generation CHECK contracts, without resetting data.
-- Run the ENTIRE file manually in SSMS, in the existing demo_db, with ALTER permission.
-- No database/table deletion and no application-row UPDATE/DELETE/INSERT.
-- Prerequisite: AI V2 tables/columns. This supersedes the Gemini-only constraint patch.
USE [demo_db];
GO
SET XACT_ABORT ON;
SET NOCOUNT ON;
IF DB_NAME() <> N'demo_db' OR @@TRANCOUNT <> 0
    THROW 51400,'Select demo_db and run this migration outside an existing transaction.',1;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.ai_generation_batches',N'U') IS NULL
        THROW 51401,'Missing AI V2 table. Apply the AI V2 migration first; do not reset the database.',1;
    IF EXISTS(SELECT 1 FROM (VALUES(N'source'),(N'status'),(N'input_tokens'),(N'output_tokens'),
            (N'provider_attempts'),(N'created_at'),(N'expires_at'),(N'preview_json'),(N'commit_json'),
            (N'user_id'),(N'request_id'),(N'failure_status')) required(name)
        WHERE COL_LENGTH(N'dbo.ai_generation_batches',required.name) IS NULL)
        THROW 51402,'AI V2 columns are incomplete. Apply prerequisite AI migrations first.',1;

    -- Hold the table lock until commit so preflight/replacement cannot race a generation request.
    DECLARE @RowsBefore BIGINT;
    SELECT @RowsBefore=COUNT_BIG(*) FROM dbo.ai_generation_batches WITH(TABLOCKX,HOLDLOCK);
    IF EXISTS(SELECT 1 FROM dbo.ai_generation_batches
        WHERE source IS NULL OR source COLLATE Latin1_General_100_BIN2 NOT IN ('OPENAI','GEMINI','DEMO_LIBRARY')
           OR status IS NULL OR status COLLATE Latin1_General_100_BIN2 NOT IN ('PENDING','READY','FAILED','EXPIRED','COMMITTED'))
    BEGIN
        SELECT id,source,status FROM dbo.ai_generation_batches
        WHERE source IS NULL OR source COLLATE Latin1_General_100_BIN2 NOT IN ('OPENAI','GEMINI','DEMO_LIBRARY')
           OR status IS NULL OR status COLLATE Latin1_General_100_BIN2 NOT IN ('PENDING','READY','FAILED','EXPIRED','COMMITTED');
        THROW 51403,'Unknown historical source/status. Review the displayed rows; no values were rewritten.',1;
    END;
    IF EXISTS(SELECT 1 FROM dbo.ai_generation_batches WHERE input_tokens<0 OR output_tokens<0
        OR provider_attempts<0 OR provider_attempts>2 OR expires_at<created_at
        OR (preview_json IS NOT NULL AND ISJSON(preview_json)<>1)
        OR (commit_json IS NOT NULL AND ISJSON(commit_json)<>1))
        THROW 51404,'Historical usage, expiry or JSON violates the current contract. Review manually; data preserved.',1;
    IF EXISTS(SELECT 1 FROM dbo.ai_generation_batches GROUP BY user_id,request_id HAVING COUNT_BIG(*)>1)
        THROW 51405,'Duplicate user/request batches. Reconcile manually without discarding history.',1;

    IF OBJECT_ID(N'dbo.CK_ai_source',N'C') IS NOT NULL
        ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT CK_ai_source;
    IF OBJECT_ID(N'dbo.CK_ai_status',N'C') IS NOT NULL
        ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT CK_ai_status;
    IF OBJECT_ID(N'dbo.CK_ai_usage',N'C') IS NOT NULL
        ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT CK_ai_usage;
    IF OBJECT_ID(N'dbo.CK_ai_expiry',N'C') IS NOT NULL
        ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT CK_ai_expiry;
    IF OBJECT_ID(N'dbo.CK_ai_generation_batches_preview_json',N'C') IS NOT NULL
        ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT CK_ai_generation_batches_preview_json;
    IF OBJECT_ID(N'dbo.CK_ai_generation_batches_commit_json',N'C') IS NOT NULL
        ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT CK_ai_generation_batches_commit_json;

    -- Keep these definitions synchronized with AiGenerationSource/AiGenerationStatus and database.sql.
    ALTER TABLE dbo.ai_generation_batches WITH CHECK ADD CONSTRAINT CK_ai_source
        CHECK(source IN ('OPENAI','GEMINI','DEMO_LIBRARY'));
    ALTER TABLE dbo.ai_generation_batches WITH CHECK ADD CONSTRAINT CK_ai_status
        CHECK(status IN ('PENDING','READY','FAILED','EXPIRED','COMMITTED'));
    ALTER TABLE dbo.ai_generation_batches WITH CHECK ADD CONSTRAINT CK_ai_usage
        CHECK((input_tokens IS NULL OR input_tokens >= 0) AND (output_tokens IS NULL OR output_tokens >= 0)
            AND (provider_attempts IS NULL OR provider_attempts BETWEEN 0 AND 2));
    ALTER TABLE dbo.ai_generation_batches WITH CHECK ADD CONSTRAINT CK_ai_expiry
        CHECK(expires_at >= created_at);
    ALTER TABLE dbo.ai_generation_batches WITH CHECK ADD CONSTRAINT CK_ai_generation_batches_preview_json
        CHECK(preview_json IS NULL OR ISJSON(preview_json)=1);
    ALTER TABLE dbo.ai_generation_batches WITH CHECK ADD CONSTRAINT CK_ai_generation_batches_commit_json
        CHECK(commit_json IS NULL OR ISJSON(commit_json)=1);

    IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.ai_generation_batches')
        AND name=N'UQ_ai_user_request' AND type='UQ')
        ALTER TABLE dbo.ai_generation_batches ADD CONSTRAINT UQ_ai_user_request UNIQUE(user_id,request_id);
    IF (SELECT COUNT(*) FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.ai_generation_batches')
        AND name IN (N'CK_ai_source',N'CK_ai_status',N'CK_ai_usage',N'CK_ai_expiry',
            N'CK_ai_generation_batches_preview_json',N'CK_ai_generation_batches_commit_json')
        AND is_disabled=0 AND is_not_trusted=0)<>6
        THROW 51406,'AI CHECK constraints are missing, disabled or untrusted.',1;
    IF @RowsBefore<>(SELECT COUNT_BIG(*) FROM dbo.ai_generation_batches)
        THROW 51407,'Unexpected row count change; migration rolled back.',1;
    COMMIT TRANSACTION;
    SELECT name,definition,is_disabled,is_not_trusted FROM sys.check_constraints
    WHERE parent_object_id=OBJECT_ID(N'dbo.ai_generation_batches') ORDER BY name;
    SELECT source,status,COUNT_BIG(*) AS batch_count FROM dbo.ai_generation_batches GROUP BY source,status;
    SELECT @RowsBefore AS preserved_batch_rows;
    PRINT 'SUCCESS: AI V3 constraints synchronized. Existing generation data preserved.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
