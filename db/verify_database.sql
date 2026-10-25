-- Read-only verification of existing demo_db. Does not reset or update application data.
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
SET NOCOUNT ON;
DECLARE @Problems TABLE(area NVARCHAR(80),detail NVARCHAR(500));
DECLARE @Tables TABLE(name SYSNAME);
INSERT @Tables VALUES (N'users'),(N'admin_user_action_logs'),(N'decks'),(N'flashcards'),(N'user_flashcard_reviews'),(N'flashcard_study_events'),(N'user_weak_vocabularies'),(N'weak_practice_sessions'),(N'weak_practice_items'),(N'weak_practice_attempts'),(N'ai_generation_gate'),(N'ai_generation_batches'),(N'grammar_groups'),(N'grammar_questions'),(N'grammar_question_reports');
INSERT @Problems SELECT N'TABLE',N'Missing dbo.'+name FROM @Tables WHERE OBJECT_ID(N'dbo.'+name,N'U') IS NULL;
DECLARE @Columns TABLE(table_name SYSNAME,column_name SYSNAME);
INSERT @Columns VALUES
(N'users',N'id'),
(N'users',N'auth_identity'),
(N'users',N'demo_account'),
(N'users',N'avatar_url'),
(N'users',N'bio'),
(N'users',N'created_at'),
(N'users',N'email'),
(N'users',N'last_login_at'),
(N'users',N'locked'),
(N'users',N'locked_at'),
(N'users',N'locked_by'),
(N'users',N'locked_reason'),
(N'users',N'name'),
(N'users',N'password'),
(N'users',N'provider'),
(N'users',N'provider_id'),
(N'users',N'role'),
(N'users',N'token_version'),
(N'users',N'updated_at'),
(N'admin_user_action_logs',N'id'),
(N'admin_user_action_logs',N'action'),
(N'admin_user_action_logs',N'admin_id'),
(N'admin_user_action_logs',N'created_at'),
(N'admin_user_action_logs',N'reason'),
(N'admin_user_action_logs',N'target_user_id'),
(N'decks',N'id'),
(N'decks',N'created_at'),
(N'decks',N'deleted'),
(N'decks',N'description'),
(N'decks',N'name'),
(N'decks',N'owner_id'),
(N'decks',N'updated_at'),
(N'decks',N'visibility'),
(N'flashcards',N'id'),
(N'flashcards',N'deck_id'),
(N'flashcards',N'example_sentence'),
(N'flashcards',N'meaning'),
(N'flashcards',N'phonetic'),
(N'flashcards',N'vocabulary'),
(N'user_flashcard_reviews',N'id'),
(N'user_flashcard_reviews',N'ease_factor'),
(N'user_flashcard_reviews',N'flashcard_id'),
(N'user_flashcard_reviews',N'interval_days'),
(N'user_flashcard_reviews',N'next_review_date'),
(N'user_flashcard_reviews',N'repetition_count'),
(N'user_flashcard_reviews',N'user_id'),
(N'flashcard_study_events',N'id'),
(N'flashcard_study_events',N'confident_recall'),
(N'flashcard_study_events',N'flashcard_id'),
(N'flashcard_study_events',N'quality'),
(N'flashcard_study_events',N'request_id'),
(N'flashcard_study_events',N'response_json'),
(N'flashcard_study_events',N'reviewed_at'),
(N'flashcard_study_events',N'user_id'),
(N'user_weak_vocabularies',N'id'),
(N'user_weak_vocabularies',N'auto_detected'),
(N'user_weak_vocabularies',N'consecutive_wrong'),
(N'user_weak_vocabularies',N'correct_count'),
(N'user_weak_vocabularies',N'created_at'),
(N'user_weak_vocabularies',N'detection_reason'),
(N'user_weak_vocabularies',N'first_detected_at'),
(N'user_weak_vocabularies',N'flashcard_id'),
(N'user_weak_vocabularies',N'last_detected_at'),
(N'user_weak_vocabularies',N'last_practiced_at'),
(N'user_weak_vocabularies',N'last_study_quality'),
(N'user_weak_vocabularies',N'manual_marked'),
(N'user_weak_vocabularies',N'mastery_score'),
(N'user_weak_vocabularies',N'total_attempts'),
(N'user_weak_vocabularies',N'updated_at'),
(N'user_weak_vocabularies',N'user_id'),
(N'user_weak_vocabularies',N'weak_deleted'),
(N'user_weak_vocabularies',N'weak_deleted_at'),
(N'user_weak_vocabularies',N'weak_note'),
(N'user_weak_vocabularies',N'wrong_count'),
(N'weak_practice_sessions',N'id'),
(N'weak_practice_sessions',N'completed_at'),
(N'weak_practice_sessions',N'correct_answers'),
(N'weak_practice_sessions',N'question_type'),
(N'weak_practice_sessions',N'started_at'),
(N'weak_practice_sessions',N'status'),
(N'weak_practice_sessions',N'total_questions'),
(N'weak_practice_sessions',N'user_id'),
(N'weak_practice_sessions',N'wrong_answers'),
(N'weak_practice_items',N'id'),
(N'weak_practice_items',N'answered'),
(N'weak_practice_items',N'answered_at'),
(N'weak_practice_items',N'correct_answer'),
(N'weak_practice_items',N'item_order'),
(N'weak_practice_items',N'options_json'),
(N'weak_practice_items',N'question_content'),
(N'weak_practice_items',N'question_type'),
(N'weak_practice_items',N'session_id'),
(N'weak_practice_items',N'weak_vocabulary_id'),
(N'weak_practice_attempts',N'id'),
(N'weak_practice_attempts',N'attempted_at'),
(N'weak_practice_attempts',N'correct'),
(N'weak_practice_attempts',N'correct_answer'),
(N'weak_practice_attempts',N'item_id'),
(N'weak_practice_attempts',N'question_content'),
(N'weak_practice_attempts',N'question_type'),
(N'weak_practice_attempts',N'session_id'),
(N'weak_practice_attempts',N'user_answer'),
(N'weak_practice_attempts',N'user_weak_vocabulary_id'),
(N'ai_generation_gate',N'id'),
(N'ai_generation_batches',N'id'),
(N'ai_generation_batches',N'commit_fingerprint'),
(N'ai_generation_batches',N'commit_json'),
(N'ai_generation_batches',N'created_at'),
(N'ai_generation_batches',N'deck_id'),
(N'ai_generation_batches',N'expires_at'),
(N'ai_generation_batches',N'failure_code'),
(N'ai_generation_batches',N'failure_status'),
(N'ai_generation_batches',N'input_tokens'),
(N'ai_generation_batches',N'lease_until'),
(N'ai_generation_batches',N'output_tokens'),
(N'ai_generation_batches',N'preview_json'),
(N'ai_generation_batches',N'prompt_version'),
(N'ai_generation_batches',N'provider_attempts'),
(N'ai_generation_batches',N'request_fingerprint'),
(N'ai_generation_batches',N'request_id'),
(N'ai_generation_batches',N'source'),
(N'ai_generation_batches',N'status'),
(N'ai_generation_batches',N'user_id'),
(N'grammar_groups',N'id'),
(N'grammar_groups',N'author_email'),
(N'grammar_groups',N'author_name'),
(N'grammar_groups',N'created_at'),
(N'grammar_groups',N'description'),
(N'grammar_groups',N'group_key'),
(N'grammar_groups',N'icon'),
(N'grammar_groups',N'title'),
(N'grammar_groups',N'updated_at'),
(N'grammar_questions',N'id'),
(N'grammar_questions',N'correct_token_id'),
(N'grammar_questions',N'correction'),
(N'grammar_questions',N'created_at'),
(N'grammar_questions',N'error_type'),
(N'grammar_questions',N'explanation'),
(N'grammar_questions',N'group_id'),
(N'grammar_questions',N'hint'),
(N'grammar_questions',N'instruction'),
(N'grammar_questions',N'payload_json'),
(N'grammar_questions',N'question_key'),
(N'grammar_questions',N'question_type'),
(N'grammar_questions',N'title'),
(N'grammar_questions',N'updated_at'),
(N'grammar_question_reports',N'id'),
(N'grammar_question_reports',N'author_email'),
(N'grammar_question_reports',N'author_name'),
(N'grammar_question_reports',N'created_at'),
(N'grammar_question_reports',N'description'),
(N'grammar_question_reports',N'error_type'),
(N'grammar_question_reports',N'group_id'),
(N'grammar_question_reports',N'question_key'),
(N'grammar_question_reports',N'question_title'),
(N'grammar_question_reports',N'report_key'),
(N'grammar_question_reports',N'reporter_email'),
(N'grammar_question_reports',N'reporter_name'),
(N'grammar_question_reports',N'status');
INSERT @Problems SELECT N'COLUMN',N'Missing '+table_name+N'.'+column_name FROM @Columns WHERE COL_LENGTH(N'dbo.'+table_name,column_name) IS NULL;
IF EXISTS(SELECT 1 FROM @Problems) BEGIN SELECT * FROM @Problems; THROW 51500,'Required schema is incomplete; apply migrations before data verification.',1; END;
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.users') AND type='PK') INSERT @Problems VALUES(N'PK',N'users missing primary key');
IF OBJECT_ID(N'dbo.UQ_users_auth_identity') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_users_auth_identity');
IF OBJECT_ID(N'dbo.FK_users_locked_by') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_users_locked_by');
IF OBJECT_ID(N'dbo.CK_users_role') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_users_role');
IF OBJECT_ID(N'dbo.CK_users_provider') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_users_provider');
IF OBJECT_ID(N'dbo.CK_users_token_version') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_users_token_version');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''users.locked_by'' WHERE EXISTS(SELECT 1 FROM dbo.users c LEFT JOIN dbo.users p ON c.locked_by=p.id WHERE c.locked_by IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.admin_user_action_logs') AND type='PK') INSERT @Problems VALUES(N'PK',N'admin_user_action_logs missing primary key');
IF OBJECT_ID(N'dbo.FK_admin_logs_admin') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_admin_logs_admin');
IF OBJECT_ID(N'dbo.FK_admin_logs_target') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_admin_logs_target');
IF OBJECT_ID(N'dbo.CK_admin_logs_action') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_admin_logs_action');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''admin_user_action_logs.admin_id'' WHERE EXISTS(SELECT 1 FROM dbo.admin_user_action_logs c LEFT JOIN dbo.users p ON c.admin_id=p.id WHERE c.admin_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''admin_user_action_logs.target_user_id'' WHERE EXISTS(SELECT 1 FROM dbo.admin_user_action_logs c LEFT JOIN dbo.users p ON c.target_user_id=p.id WHERE c.target_user_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.decks') AND type='PK') INSERT @Problems VALUES(N'PK',N'decks missing primary key');
IF OBJECT_ID(N'dbo.FK_decks_owner') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_decks_owner');
IF OBJECT_ID(N'dbo.CK_decks_visibility') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_decks_visibility');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''decks.owner_id'' WHERE EXISTS(SELECT 1 FROM dbo.decks c LEFT JOIN dbo.users p ON c.owner_id=p.id WHERE c.owner_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.flashcards') AND type='PK') INSERT @Problems VALUES(N'PK',N'flashcards missing primary key');
IF OBJECT_ID(N'dbo.FK_flashcards_deck') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_flashcards_deck');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''flashcards.deck_id'' WHERE EXISTS(SELECT 1 FROM dbo.flashcards c LEFT JOIN dbo.decks p ON c.deck_id=p.id WHERE c.deck_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.user_flashcard_reviews') AND type='PK') INSERT @Problems VALUES(N'PK',N'user_flashcard_reviews missing primary key');
IF OBJECT_ID(N'dbo.FK_reviews_user') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_reviews_user');
IF OBJECT_ID(N'dbo.FK_reviews_flashcard') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_reviews_flashcard');
IF OBJECT_ID(N'dbo.UQ_review_user_card') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_review_user_card');
IF OBJECT_ID(N'dbo.CK_review_counters') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_review_counters');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''user_flashcard_reviews.user_id'' WHERE EXISTS(SELECT 1 FROM dbo.user_flashcard_reviews c LEFT JOIN dbo.users p ON c.user_id=p.id WHERE c.user_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''user_flashcard_reviews.flashcard_id'' WHERE EXISTS(SELECT 1 FROM dbo.user_flashcard_reviews c LEFT JOIN dbo.flashcards p ON c.flashcard_id=p.id WHERE c.flashcard_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.flashcard_study_events') AND type='PK') INSERT @Problems VALUES(N'PK',N'flashcard_study_events missing primary key');
IF OBJECT_ID(N'dbo.FK_study_event_user') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_study_event_user');
IF OBJECT_ID(N'dbo.FK_study_event_flashcard') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_study_event_flashcard');
IF OBJECT_ID(N'dbo.UQ_study_event_user_request') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_study_event_user_request');
IF OBJECT_ID(N'dbo.CK_study_event_quality') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_study_event_quality');
IF OBJECT_ID(N'dbo.CK_study_event_confident') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_study_event_confident');
IF OBJECT_ID(N'dbo.CK_flashcard_study_events_response_json') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_flashcard_study_events_response_json');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''flashcard_study_events.user_id'' WHERE EXISTS(SELECT 1 FROM dbo.flashcard_study_events c LEFT JOIN dbo.users p ON c.user_id=p.id WHERE c.user_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''flashcard_study_events.flashcard_id'' WHERE EXISTS(SELECT 1 FROM dbo.flashcard_study_events c LEFT JOIN dbo.flashcards p ON c.flashcard_id=p.id WHERE c.flashcard_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.user_weak_vocabularies') AND type='PK') INSERT @Problems VALUES(N'PK',N'user_weak_vocabularies missing primary key');
IF OBJECT_ID(N'dbo.FK_weak_user') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_weak_user');
IF OBJECT_ID(N'dbo.FK_weak_flashcard') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_weak_flashcard');
IF OBJECT_ID(N'dbo.UQ_weak_user_flashcard') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_weak_user_flashcard');
IF OBJECT_ID(N'dbo.CK_weak_mastery') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_mastery');
IF OBJECT_ID(N'dbo.CK_weak_counters') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_counters');
IF OBJECT_ID(N'dbo.CK_weak_quality') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_quality');
IF OBJECT_ID(N'dbo.CK_weak_reason') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_reason');
IF OBJECT_ID(N'dbo.CK_weak_detection_dates') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_detection_dates');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''user_weak_vocabularies.user_id'' WHERE EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies c LEFT JOIN dbo.users p ON c.user_id=p.id WHERE c.user_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''user_weak_vocabularies.flashcard_id'' WHERE EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies c LEFT JOIN dbo.flashcards p ON c.flashcard_id=p.id WHERE c.flashcard_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.weak_practice_sessions') AND type='PK') INSERT @Problems VALUES(N'PK',N'weak_practice_sessions missing primary key');
IF OBJECT_ID(N'dbo.FK_session_user') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_session_user');
IF OBJECT_ID(N'dbo.CK_weak_practice_sessions_type') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_practice_sessions_type');
IF OBJECT_ID(N'dbo.CK_session_status') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_session_status');
IF OBJECT_ID(N'dbo.CK_session_counters') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_session_counters');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''weak_practice_sessions.user_id'' WHERE EXISTS(SELECT 1 FROM dbo.weak_practice_sessions c LEFT JOIN dbo.users p ON c.user_id=p.id WHERE c.user_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.weak_practice_items') AND type='PK') INSERT @Problems VALUES(N'PK',N'weak_practice_items missing primary key');
IF OBJECT_ID(N'dbo.FK_item_session') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_item_session');
IF OBJECT_ID(N'dbo.FK_item_weak') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_item_weak');
IF OBJECT_ID(N'dbo.UQ_practice_item_order') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_practice_item_order');
IF OBJECT_ID(N'dbo.CK_weak_practice_items_type') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_practice_items_type');
IF OBJECT_ID(N'dbo.CK_item_order') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_item_order');
IF OBJECT_ID(N'dbo.CK_weak_practice_items_options_json') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_practice_items_options_json');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''weak_practice_items.session_id'' WHERE EXISTS(SELECT 1 FROM dbo.weak_practice_items c LEFT JOIN dbo.weak_practice_sessions p ON c.session_id=p.id WHERE c.session_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''weak_practice_items.weak_vocabulary_id'' WHERE EXISTS(SELECT 1 FROM dbo.weak_practice_items c LEFT JOIN dbo.user_weak_vocabularies p ON c.weak_vocabulary_id=p.id WHERE c.weak_vocabulary_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.weak_practice_attempts') AND type='PK') INSERT @Problems VALUES(N'PK',N'weak_practice_attempts missing primary key');
IF OBJECT_ID(N'dbo.FK_attempt_session') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_attempt_session');
IF OBJECT_ID(N'dbo.FK_attempt_item') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_attempt_item');
IF OBJECT_ID(N'dbo.FK_attempt_weak') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_attempt_weak');
IF OBJECT_ID(N'dbo.UQ_practice_attempt_item') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_practice_attempt_item');
IF OBJECT_ID(N'dbo.CK_weak_practice_attempts_type') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_weak_practice_attempts_type');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''weak_practice_attempts.session_id'' WHERE EXISTS(SELECT 1 FROM dbo.weak_practice_attempts c LEFT JOIN dbo.weak_practice_sessions p ON c.session_id=p.id WHERE c.session_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''weak_practice_attempts.item_id'' WHERE EXISTS(SELECT 1 FROM dbo.weak_practice_attempts c LEFT JOIN dbo.weak_practice_items p ON c.item_id=p.id WHERE c.item_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''weak_practice_attempts.user_weak_vocabulary_id'' WHERE EXISTS(SELECT 1 FROM dbo.weak_practice_attempts c LEFT JOIN dbo.user_weak_vocabularies p ON c.user_weak_vocabulary_id=p.id WHERE c.user_weak_vocabulary_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.ai_generation_gate') AND type='PK') INSERT @Problems VALUES(N'PK',N'ai_generation_gate missing primary key');
IF OBJECT_ID(N'dbo.CK_ai_gate_singleton') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_ai_gate_singleton');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.ai_generation_batches') AND type='PK') INSERT @Problems VALUES(N'PK',N'ai_generation_batches missing primary key');
IF OBJECT_ID(N'dbo.FK_ai_batch_user') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_ai_batch_user');
IF OBJECT_ID(N'dbo.FK_ai_batch_deck') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_ai_batch_deck');
IF OBJECT_ID(N'dbo.UQ_ai_user_request') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_ai_user_request');
IF OBJECT_ID(N'dbo.CK_ai_source') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_ai_source');
IF OBJECT_ID(N'dbo.CK_ai_status') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_ai_status');
IF OBJECT_ID(N'dbo.CK_ai_usage') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_ai_usage');
IF OBJECT_ID(N'dbo.CK_ai_expiry') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_ai_expiry');
IF OBJECT_ID(N'dbo.CK_ai_generation_batches_preview_json') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_ai_generation_batches_preview_json');
IF OBJECT_ID(N'dbo.CK_ai_generation_batches_commit_json') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_ai_generation_batches_commit_json');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''ai_generation_batches.user_id'' WHERE EXISTS(SELECT 1 FROM dbo.ai_generation_batches c LEFT JOIN dbo.users p ON c.user_id=p.id WHERE c.user_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''ai_generation_batches.deck_id'' WHERE EXISTS(SELECT 1 FROM dbo.ai_generation_batches c LEFT JOIN dbo.decks p ON c.deck_id=p.id WHERE c.deck_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.grammar_groups') AND type='PK') INSERT @Problems VALUES(N'PK',N'grammar_groups missing primary key');
IF OBJECT_ID(N'dbo.UQ_grammar_group_key') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_grammar_group_key');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.grammar_questions') AND type='PK') INSERT @Problems VALUES(N'PK',N'grammar_questions missing primary key');
IF OBJECT_ID(N'dbo.FK_questions_group') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_questions_group');
IF OBJECT_ID(N'dbo.CK_grammar_questions_payload_json') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing CK_grammar_questions_payload_json');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''grammar_questions.group_id'' WHERE EXISTS(SELECT 1 FROM dbo.grammar_questions c LEFT JOIN dbo.grammar_groups p ON c.group_id=p.id WHERE c.group_id IS NOT NULL AND p.id IS NULL);');
IF NOT EXISTS(SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.grammar_question_reports') AND type='PK') INSERT @Problems VALUES(N'PK',N'grammar_question_reports missing primary key');
IF OBJECT_ID(N'dbo.FK_reports_group') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing FK_reports_group');
IF OBJECT_ID(N'dbo.UQ_grammar_report_key') IS NULL INSERT @Problems VALUES(N'CONSTRAINT',N'Missing UQ_grammar_report_key');
INSERT @Problems EXEC(N'SELECT N''ORPHAN'',N''grammar_question_reports.group_id'' WHERE EXISTS(SELECT 1 FROM dbo.grammar_question_reports c LEFT JOIN dbo.grammar_groups p ON c.group_id=p.id WHERE c.group_id IS NOT NULL AND p.id IS NULL);');
INSERT @Problems SELECT N'CONSTRAINT',N'Disabled/untrusted '+name FROM sys.check_constraints WHERE parent_object_id IN(SELECT OBJECT_ID(N'dbo.'+name) FROM @Tables) AND(is_disabled=1 OR is_not_trusted=1);
INSERT @Problems SELECT N'FK',N'Disabled/untrusted '+name FROM sys.foreign_keys WHERE parent_object_id IN(SELECT OBJECT_ID(N'dbo.'+name) FROM @Tables) AND(is_disabled=1 OR is_not_trusted=1);
INSERT @Problems EXEC(N'SELECT N''AUTH'',N''Invalid role/auth identity/version'' WHERE EXISTS(SELECT 1 FROM dbo.users WHERE role NOT IN(''ROLE_ADMIN'',''ROLE_USER'') OR auth_identity IS NULL OR token_version<0);');
INSERT @Problems EXEC(N'SELECT N''AUTH'',N''Duplicate authentication identity'' WHERE EXISTS(SELECT 1 FROM dbo.users GROUP BY auth_identity HAVING COUNT(*)>1);');
INSERT @Problems EXEC(N'SELECT N''WEAK'',N''Invalid statistics/source flags'' WHERE EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies WHERE total_attempts<>correct_count+wrong_count OR mastery_score NOT BETWEEN 0 AND 100 OR correct_count<0 OR wrong_count<0 OR consecutive_wrong<0 OR consecutive_wrong>wrong_count OR(manual_marked=0 AND auto_detected=0));');
INSERT @Problems EXEC(N'SELECT N''WEAK'',N''Duplicate user/card'' WHERE EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies GROUP BY user_id,flashcard_id HAVING COUNT(*)>1);');
INSERT @Problems EXEC(N'SELECT N''SM2'',N''Invalid review state'' WHERE EXISTS(SELECT 1 FROM dbo.user_flashcard_reviews WHERE ease_factor<1.3 OR interval_days<0 OR repetition_count<0);');
INSERT @Problems EXEC(N'SELECT N''AI'',N''Invalid generation contract'' WHERE EXISTS(SELECT 1 FROM dbo.ai_generation_batches WHERE source NOT IN(''OPENAI'',''GEMINI'',''DEMO_LIBRARY'') OR status NOT IN(''PENDING'',''READY'',''FAILED'',''EXPIRED'',''COMMITTED'') OR input_tokens<0 OR output_tokens<0 OR provider_attempts NOT BETWEEN 0 AND 2);');
IF CHARINDEX(N'''GEMINI''',COALESCE(OBJECT_DEFINITION(OBJECT_ID(N'dbo.CK_ai_source')),N''))=0 INSERT @Problems VALUES(N'AI',N'CK_ai_source does not support GEMINI');
INSERT @Problems EXEC(N'SELECT N''JSON'',N''Invalid grammar payload'' WHERE EXISTS(SELECT 1 FROM dbo.grammar_questions WHERE payload_json IS NOT NULL AND ISJSON(payload_json)<>1);');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.users') AND name=N'UX_users_email' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled UX_users_email');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.users') AND name=N'UX_users_google_subject' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled UX_users_google_subject');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.users') AND name=N'IX_users_admin_search' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_users_admin_search');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.users') AND name=N'IX_users_locked_by' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_users_locked_by');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.admin_user_action_logs') AND name=N'IX_admin_logs_created' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_admin_logs_created');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.admin_user_action_logs') AND name=N'IX_admin_logs_target' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_admin_logs_target');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.admin_user_action_logs') AND name=N'IX_admin_logs_admin' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_admin_logs_admin');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.decks') AND name=N'IX_decks_public' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_decks_public');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.decks') AND name=N'IX_decks_owner' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_decks_owner');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.flashcards') AND name=N'IX_flashcards_deck' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_flashcards_deck');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.user_flashcard_reviews') AND name=N'IX_reviews_due' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_reviews_due');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.flashcard_study_events') AND name=N'IX_study_event_history' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_study_event_history');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.flashcard_study_events') AND name=N'IX_study_event_card' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_study_event_card');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.user_weak_vocabularies') AND name=N'IX_weak_user_active' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_weak_user_active');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.user_weak_vocabularies') AND name=N'IX_weak_flashcard' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_weak_flashcard');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.weak_practice_sessions') AND name=N'IX_sessions_user' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_sessions_user');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.weak_practice_items') AND name=N'IX_items_weak' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_items_weak');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.weak_practice_attempts') AND name=N'IX_attempts_weak' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_attempts_weak');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.weak_practice_attempts') AND name=N'IX_attempts_session' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_attempts_session');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ai_generation_batches') AND name=N'IX_ai_created' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_ai_created');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ai_generation_batches') AND name=N'IX_ai_user_created' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_ai_user_created');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ai_generation_batches') AND name=N'IX_ai_pending' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_ai_pending');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ai_generation_batches') AND name=N'IX_ai_expiry' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_ai_expiry');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ai_generation_batches') AND name=N'IX_ai_deck' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_ai_deck');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.grammar_questions') AND name=N'IX_grammar_questions_group' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_grammar_questions_group');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.grammar_questions') AND name=N'IX_grammar_questions_key' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_grammar_questions_key');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.grammar_question_reports') AND name=N'IX_grammar_reports_group' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_grammar_reports_group');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.grammar_question_reports') AND name=N'IX_grammar_reports_author' AND is_disabled=0) INSERT @Problems VALUES(N'INDEX',N'Missing/disabled IX_grammar_reports_author');
SELECT * FROM @Problems ORDER BY area,detail;
SELECT name,definition,is_disabled,is_not_trusted FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.ai_generation_batches');
SELECT role,locked,COUNT_BIG(*) user_count FROM dbo.users GROUP BY role,locked;
SELECT source,status,COUNT_BIG(*) batch_count FROM dbo.ai_generation_batches GROUP BY source,status;
IF EXISTS(SELECT 1 FROM @Problems) THROW 51501,'Verification failed; review diagnostics. No data was changed.',1;
PRINT 'SUCCESS: non-destructive database verification passed.';
