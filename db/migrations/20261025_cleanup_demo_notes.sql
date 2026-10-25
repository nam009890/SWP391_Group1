-- Remove technical seed labels already visible in the demo account UI.
-- No reset, no history/counter changes; preserve all other user-written notes.
USE [demo_db];
GO
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE w SET weak_note=NULL
    FROM dbo.user_weak_vocabularies w
    JOIN dbo.users u ON u.id=w.user_id
    WHERE u.email=N'demo@studye.local'
      AND w.weak_note COLLATE Latin1_General_100_BIN2 =
          N'[SYNTHETIC DEMO] Coherent practice replay; legacy automatic origin is unknown.' COLLATE Latin1_General_100_BIN2;

    UPDATE d SET description=N'Từ vựng mẫu để thử luyện tập và bộ lọc từ cần ôn.'
    FROM dbo.decks d JOIN dbo.users u ON u.id=d.owner_id
    WHERE u.email=N'demo@studye.local'
      AND d.name=N'Weak Vocabulary Demo'
      AND d.description COLLATE Latin1_General_100_BIN2 =
          N'[SYNTHETIC DEMO] Luyện tập và bộ lọc từ yếu' COLLATE Latin1_General_100_BIN2;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
