-- Add GEMINI as an actual source without resetting tables or generation history.
-- Run manually in SSMS against the existing demo_db before enabling Gemini.
USE [demo_db];
GO
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    IF OBJECT_ID(N'dbo.ai_generation_batches',N'U') IS NULL
        THROW 51300,'Apply the AI V2 schema first.',1;
    IF OBJECT_ID(N'dbo.CK_ai_source',N'C') IS NOT NULL
        ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT CK_ai_source;
    ALTER TABLE dbo.ai_generation_batches WITH CHECK ADD CONSTRAINT CK_ai_source
        CHECK(source IN ('OPENAI','GEMINI','DEMO_LIBRARY'));
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
