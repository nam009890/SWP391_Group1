-- =====================================================
-- EVMS / StudyE - APPLICATION TABLE RESET
-- WARNING: Deletes all data in the 15 application tables in demo_db.
-- Back up important data first. Local development only, never production.
-- Does not create, alter or drop any database. Preserves database collation.
-- SQL Server 2016+ / SSMS. Run the ENTIRE reviewed file.
-- =====================================================
SET NOEXEC OFF;
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO
USE [demo_db];
GO
PRINT 'START: rebuilding application tables and demo data in demo_db.';
IF DB_NAME() <> N'demo_db' OR @@TRANCOUNT <> 0
BEGIN
    THROW 51100,'Select existing demo_db and run the whole file outside a transaction.',1;
END;

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
-- Drop children before parents. External dependencies cause rollback, not deletion.
    DROP TABLE IF EXISTS dbo.weak_practice_attempts;
    DROP TABLE IF EXISTS dbo.weak_practice_items;
    DROP TABLE IF EXISTS dbo.weak_practice_sessions;
    DROP TABLE IF EXISTS dbo.user_weak_vocabularies;
    DROP TABLE IF EXISTS dbo.flashcard_study_events;
    DROP TABLE IF EXISTS dbo.user_flashcard_reviews;
    DROP TABLE IF EXISTS dbo.ai_generation_batches;
    DROP TABLE IF EXISTS dbo.flashcards;
    DROP TABLE IF EXISTS dbo.admin_user_action_logs;
    DROP TABLE IF EXISTS dbo.grammar_question_reports;
    DROP TABLE IF EXISTS dbo.grammar_questions;
    DROP TABLE IF EXISTS dbo.grammar_groups;
    DROP TABLE IF EXISTS dbo.ai_generation_gate;
    DROP TABLE IF EXISTS dbo.decks;
    DROP TABLE IF EXISTS dbo.users;
    -- Keep the transaction open across GO; failed seeds restore the old tables.
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
-- Separate batch: compile new columns only AFTER old tables have been dropped.
IF DB_NAME() <> N'demo_db' OR @@TRANCOUNT <> 1 OR XACT_STATE() <> 1
BEGIN
    THROW 51100,'Reset did not start successfully. Run the ENTIRE file, not a selected batch.',1;
END;
SET XACT_ABORT ON;
SET NOCOUNT ON;
BEGIN TRY
-- All schema, seeds and acceptance checks commit together.
-- UTC defaults; DATETIME2(6) matches the current SQLServerDialect metadata.

CREATE TABLE dbo.users (
    id BIGINT IDENTITY(1,1) NOT NULL,
    auth_identity VARCHAR(36) NOT NULL CONSTRAINT DF_users_auth_identity DEFAULT CONVERT(VARCHAR(36),NEWID()),
    demo_account BIT NOT NULL CONSTRAINT DF_users_demo_account DEFAULT 0,
    avatar_url NVARCHAR(255) NULL,
    bio NVARCHAR(500) NULL,
    created_at DATETIME2(6) NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
    email NVARCHAR(255) NULL,
    last_login_at DATETIME2(6) NULL,
    locked BIT NOT NULL CONSTRAINT DF_users_locked DEFAULT 0,
    locked_at DATETIME2(6) NULL,
    locked_by BIGINT NULL,
    locked_reason NVARCHAR(500) NULL,
    name NVARCHAR(255) NULL,
    password NVARCHAR(255) NULL,
    provider NVARCHAR(255) NULL CONSTRAINT DF_users_provider DEFAULT N'LOCAL',
    provider_id NVARCHAR(255) NULL,
    role NVARCHAR(255) NULL CONSTRAINT DF_users_role DEFAULT N'ROLE_USER',
    token_version BIGINT NOT NULL CONSTRAINT DF_users_token_version DEFAULT 0,
    updated_at DATETIME2(6) NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_users PRIMARY KEY (id),
    CONSTRAINT UQ_users_auth_identity UNIQUE(auth_identity),
    CONSTRAINT FK_users_locked_by FOREIGN KEY (locked_by) REFERENCES dbo.users(id),
    CONSTRAINT CK_users_role CHECK (role IN ('ROLE_USER','ROLE_ADMIN')),
    CONSTRAINT CK_users_provider CHECK (provider IN ('LOCAL','GOOGLE')),
    CONSTRAINT CK_users_token_version CHECK (token_version >= 0)
);

CREATE TABLE dbo.admin_user_action_logs (
    id BIGINT IDENTITY(1,1) NOT NULL,
    action VARCHAR(20) NOT NULL,
    admin_id BIGINT NOT NULL,
    created_at DATETIME2(6) NOT NULL CONSTRAINT DF_admin_user_action_logs_created_at DEFAULT SYSUTCDATETIME(),
    reason NVARCHAR(500) NULL,
    target_user_id BIGINT NOT NULL,
    CONSTRAINT PK_admin_user_action_logs PRIMARY KEY (id),
    CONSTRAINT FK_admin_logs_admin FOREIGN KEY (admin_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_admin_logs_target FOREIGN KEY (target_user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_admin_logs_action CHECK (action IN ('LOCK_USER','UNLOCK_USER'))
);

CREATE TABLE dbo.decks (
    id BIGINT IDENTITY(1,1) NOT NULL,
    created_at DATETIME2(6) NOT NULL CONSTRAINT DF_decks_created_at DEFAULT SYSUTCDATETIME(),
    deleted BIT NOT NULL CONSTRAINT DF_decks_deleted DEFAULT 0,
    description NVARCHAR(MAX) NULL,
    name NVARCHAR(255) NULL,
    owner_id BIGINT NULL,
    updated_at DATETIME2(6) NOT NULL CONSTRAINT DF_decks_updated_at DEFAULT SYSUTCDATETIME(),
    visibility VARCHAR(7) NOT NULL CONSTRAINT DF_decks_visibility DEFAULT 'PUBLIC',
    CONSTRAINT PK_decks PRIMARY KEY (id),
    CONSTRAINT FK_decks_owner FOREIGN KEY (owner_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_decks_visibility CHECK (visibility IN ('PUBLIC','PRIVATE'))
);

CREATE TABLE dbo.flashcards (
    id BIGINT IDENTITY(1,1) NOT NULL,
    deck_id BIGINT NULL,
    example_sentence NVARCHAR(MAX) NULL,
    meaning NVARCHAR(255) NULL,
    phonetic NVARCHAR(255) NULL,
    vocabulary NVARCHAR(255) NULL,
    CONSTRAINT PK_flashcards PRIMARY KEY (id),
    CONSTRAINT FK_flashcards_deck FOREIGN KEY (deck_id) REFERENCES dbo.decks(id)
);

CREATE TABLE dbo.user_flashcard_reviews (
    id BIGINT IDENTITY(1,1) NOT NULL,
    ease_factor FLOAT(53) NOT NULL CONSTRAINT DF_user_flashcard_reviews_ease_factor DEFAULT 2.5,
    flashcard_id BIGINT NULL,
    interval_days INT NOT NULL CONSTRAINT DF_user_flashcard_reviews_interval_days DEFAULT 0,
    next_review_date DATETIME2(6) NULL,
    repetition_count INT NOT NULL CONSTRAINT DF_user_flashcard_reviews_repetition_count DEFAULT 0,
    user_id BIGINT NULL,
    CONSTRAINT PK_user_flashcard_reviews PRIMARY KEY (id),
    CONSTRAINT FK_reviews_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_reviews_flashcard FOREIGN KEY (flashcard_id) REFERENCES dbo.flashcards(id),
    CONSTRAINT UQ_review_user_card UNIQUE (user_id,flashcard_id),
    CONSTRAINT CK_review_counters CHECK (repetition_count >= 0 AND interval_days >= 0 AND ease_factor >= 1.3)
);

CREATE TABLE dbo.flashcard_study_events (
    id BIGINT IDENTITY(1,1) NOT NULL,
    confident_recall BIT NOT NULL CONSTRAINT DF_flashcard_study_events_confident_recall DEFAULT 0,
    flashcard_id BIGINT NOT NULL,
    quality INT NOT NULL,
    request_id VARCHAR(36) NOT NULL,
    response_json NVARCHAR(MAX) NULL,
    reviewed_at DATETIME2(6) NOT NULL CONSTRAINT DF_flashcard_study_events_reviewed_at DEFAULT SYSUTCDATETIME(),
    user_id BIGINT NOT NULL,
    CONSTRAINT PK_flashcard_study_events PRIMARY KEY (id),
    CONSTRAINT FK_study_event_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_study_event_flashcard FOREIGN KEY (flashcard_id) REFERENCES dbo.flashcards(id),
    CONSTRAINT UQ_study_event_user_request UNIQUE (user_id,request_id),
    CONSTRAINT CK_study_event_quality CHECK (quality IN (1,3,4,5)),
    CONSTRAINT CK_study_event_confident CHECK ((quality IN (4,5) AND confident_recall=1) OR (quality IN (1,3) AND confident_recall=0)),
    CONSTRAINT CK_flashcard_study_events_response_json CHECK (response_json IS NULL OR ISJSON(response_json)=1)
);

CREATE TABLE dbo.user_weak_vocabularies (
    id BIGINT IDENTITY(1,1) NOT NULL,
    auto_detected BIT NOT NULL CONSTRAINT DF_user_weak_vocabularies_auto_detected DEFAULT 0,
    consecutive_wrong INT NOT NULL CONSTRAINT DF_user_weak_vocabularies_consecutive_wrong DEFAULT 0,
    correct_count INT NOT NULL CONSTRAINT DF_user_weak_vocabularies_correct_count DEFAULT 0,
    created_at DATETIME2(6) NOT NULL CONSTRAINT DF_user_weak_vocabularies_created_at DEFAULT SYSUTCDATETIME(),
    detection_reason VARCHAR(40) NULL,
    first_detected_at DATETIME2(6) NULL,
    flashcard_id BIGINT NOT NULL,
    last_detected_at DATETIME2(6) NULL,
    last_practiced_at DATETIME2(6) NULL,
    last_study_quality INT NULL,
    manual_marked BIT NOT NULL CONSTRAINT DF_user_weak_vocabularies_manual_marked DEFAULT 0,
    mastery_score INT NOT NULL CONSTRAINT DF_user_weak_vocabularies_mastery_score DEFAULT 0,
    total_attempts INT NOT NULL CONSTRAINT DF_user_weak_vocabularies_total_attempts DEFAULT 0,
    updated_at DATETIME2(6) NOT NULL CONSTRAINT DF_user_weak_vocabularies_updated_at DEFAULT SYSUTCDATETIME(),
    user_id BIGINT NOT NULL,
    weak_deleted BIT NOT NULL CONSTRAINT DF_user_weak_vocabularies_weak_deleted DEFAULT 0,
    weak_deleted_at DATETIME2(6) NULL,
    weak_note NVARCHAR(MAX) NULL,
    wrong_count INT NOT NULL CONSTRAINT DF_user_weak_vocabularies_wrong_count DEFAULT 0,
    CONSTRAINT PK_user_weak_vocabularies PRIMARY KEY (id),
    CONSTRAINT FK_weak_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_weak_flashcard FOREIGN KEY (flashcard_id) REFERENCES dbo.flashcards(id),
    CONSTRAINT UQ_weak_user_flashcard UNIQUE (user_id,flashcard_id),
    CONSTRAINT CK_weak_mastery CHECK (mastery_score BETWEEN 0 AND 100),
    CONSTRAINT CK_weak_counters CHECK (total_attempts >= 0 AND correct_count >= 0 AND wrong_count >= 0 AND consecutive_wrong >= 0 AND consecutive_wrong <= wrong_count AND total_attempts=correct_count+wrong_count),
    CONSTRAINT CK_weak_quality CHECK (last_study_quality IN (1,3,4,5)),
    CONSTRAINT CK_weak_reason CHECK (detection_reason IN ('MANUAL_MARK','STUDY_FORGOT','STUDY_HARD_REPEAT','STUDY_LOW_RECALL','PRACTICE_CONSECUTIVE_WRONG','PRACTICE_LOW_ACCURACY','LEGACY_AUTO')),
    CONSTRAINT CK_weak_detection_dates CHECK (first_detected_at IS NULL OR last_detected_at IS NULL OR first_detected_at <= last_detected_at)
);

CREATE TABLE dbo.weak_practice_sessions (
    id BIGINT IDENTITY(1,1) NOT NULL,
    completed_at DATETIME2(6) NULL,
    correct_answers INT NOT NULL CONSTRAINT DF_weak_practice_sessions_correct_answers DEFAULT 0,
    question_type VARCHAR(255) NULL,
    started_at DATETIME2(6) NULL,
    status VARCHAR(255) NULL CONSTRAINT DF_weak_practice_sessions_status DEFAULT 'IN_PROGRESS',
    total_questions INT NOT NULL CONSTRAINT DF_weak_practice_sessions_total_questions DEFAULT 0,
    user_id BIGINT NOT NULL,
    wrong_answers INT NOT NULL CONSTRAINT DF_weak_practice_sessions_wrong_answers DEFAULT 0,
    CONSTRAINT PK_weak_practice_sessions PRIMARY KEY (id),
    CONSTRAINT FK_session_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT CK_weak_practice_sessions_type CHECK (question_type IN ('FILL_BLANK','MULTIPLE_CHOICE','WORD_TO_MEANING','MEANING_TO_WORD')),
    CONSTRAINT CK_session_status CHECK (status IN ('IN_PROGRESS','COMPLETED')),
    CONSTRAINT CK_session_counters CHECK (total_questions >= 0 AND correct_answers >= 0 AND wrong_answers >= 0 AND correct_answers+wrong_answers <= total_questions)
);

CREATE TABLE dbo.weak_practice_items (
    id BIGINT IDENTITY(1,1) NOT NULL,
    answered BIT NOT NULL CONSTRAINT DF_weak_practice_items_answered DEFAULT 0,
    answered_at DATETIME2(6) NULL,
    correct_answer NVARCHAR(255) NULL,
    item_order INT NOT NULL,
    options_json NVARCHAR(MAX) NULL,
    question_content NVARCHAR(MAX) NULL,
    question_type VARCHAR(255) NULL,
    session_id BIGINT NOT NULL,
    weak_vocabulary_id BIGINT NOT NULL,
    CONSTRAINT PK_weak_practice_items PRIMARY KEY (id),
    CONSTRAINT FK_item_session FOREIGN KEY (session_id) REFERENCES dbo.weak_practice_sessions(id),
    CONSTRAINT FK_item_weak FOREIGN KEY (weak_vocabulary_id) REFERENCES dbo.user_weak_vocabularies(id),
    CONSTRAINT UQ_practice_item_order UNIQUE (session_id,item_order),
    CONSTRAINT CK_weak_practice_items_type CHECK (question_type IN ('FILL_BLANK','MULTIPLE_CHOICE','WORD_TO_MEANING','MEANING_TO_WORD')),
    CONSTRAINT CK_item_order CHECK (item_order >= 0),
    CONSTRAINT CK_weak_practice_items_options_json CHECK (options_json IS NULL OR ISJSON(options_json)=1)
);

CREATE TABLE dbo.weak_practice_attempts (
    id BIGINT IDENTITY(1,1) NOT NULL,
    attempted_at DATETIME2(6) NULL CONSTRAINT DF_weak_practice_attempts_attempted_at DEFAULT SYSUTCDATETIME(),
    correct BIT NOT NULL CONSTRAINT DF_weak_practice_attempts_correct DEFAULT 0,
    correct_answer NVARCHAR(255) NULL,
    item_id BIGINT NOT NULL,
    question_content NVARCHAR(MAX) NULL,
    question_type VARCHAR(255) NULL,
    session_id BIGINT NOT NULL,
    user_answer NVARCHAR(MAX) NULL,
    user_weak_vocabulary_id BIGINT NOT NULL,
    CONSTRAINT PK_weak_practice_attempts PRIMARY KEY (id),
    CONSTRAINT FK_attempt_session FOREIGN KEY (session_id) REFERENCES dbo.weak_practice_sessions(id),
    CONSTRAINT FK_attempt_item FOREIGN KEY (item_id) REFERENCES dbo.weak_practice_items(id),
    CONSTRAINT FK_attempt_weak FOREIGN KEY (user_weak_vocabulary_id) REFERENCES dbo.user_weak_vocabularies(id),
    CONSTRAINT UQ_practice_attempt_item UNIQUE (item_id),
    CONSTRAINT CK_weak_practice_attempts_type CHECK (question_type IN ('FILL_BLANK','MULTIPLE_CHOICE','WORD_TO_MEANING','MEANING_TO_WORD'))
);

CREATE TABLE dbo.ai_generation_gate (
    id BIGINT NOT NULL,
    CONSTRAINT PK_ai_generation_gate PRIMARY KEY (id),
    CONSTRAINT CK_ai_gate_singleton CHECK (id=1)
);

CREATE TABLE dbo.ai_generation_batches (
    id VARCHAR(36) NOT NULL,
    commit_fingerprint VARCHAR(64) NULL,
    commit_json NVARCHAR(MAX) NULL,
    created_at DATETIME2(6) NOT NULL CONSTRAINT DF_ai_generation_batches_created_at DEFAULT SYSUTCDATETIME(),
    deck_id BIGINT NOT NULL,
    expires_at DATETIME2(6) NOT NULL,
    failure_code VARCHAR(60) NULL,
    failure_status INT NULL,
    input_tokens BIGINT NULL,
    lease_until DATETIME2(6) NOT NULL,
    output_tokens BIGINT NULL,
    preview_json NVARCHAR(MAX) NULL,
    prompt_version VARCHAR(40) NOT NULL,
    provider_attempts INT NULL,
    request_fingerprint VARCHAR(64) NOT NULL,
    request_id VARCHAR(36) NOT NULL,
    source VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT PK_ai_generation_batches PRIMARY KEY (id),
    CONSTRAINT FK_ai_batch_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
    CONSTRAINT FK_ai_batch_deck FOREIGN KEY (deck_id) REFERENCES dbo.decks(id),
    CONSTRAINT UQ_ai_user_request UNIQUE (user_id,request_id),
    -- Persisted AiGenerationSource only; DISABLED is never stored as a batch.
    CONSTRAINT CK_ai_source CHECK (source IN ('OPENAI','GEMINI','DEMO_LIBRARY')),
    -- Keep synchronized with AiGenerationStatus and the AI V3 constraint migration.
    CONSTRAINT CK_ai_status CHECK (status IN ('PENDING','READY','FAILED','EXPIRED','COMMITTED')),
    CONSTRAINT CK_ai_usage CHECK ((input_tokens IS NULL OR input_tokens >= 0) AND (output_tokens IS NULL OR output_tokens >= 0) AND (provider_attempts IS NULL OR provider_attempts BETWEEN 0 AND 2)),
    CONSTRAINT CK_ai_expiry CHECK (expires_at >= created_at),
    CONSTRAINT CK_ai_generation_batches_preview_json CHECK (preview_json IS NULL OR ISJSON(preview_json)=1),
    CONSTRAINT CK_ai_generation_batches_commit_json CHECK (commit_json IS NULL OR ISJSON(commit_json)=1)
);

CREATE TABLE dbo.grammar_groups (
    id BIGINT IDENTITY(1,1) NOT NULL,
    author_email NVARCHAR(255) NULL,
    author_name NVARCHAR(255) NULL,
    created_at DATETIME2(6) NULL CONSTRAINT DF_grammar_groups_created_at DEFAULT SYSUTCDATETIME(),
    description NVARCHAR(MAX) NULL,
    group_key NVARCHAR(100) NOT NULL,
    icon NVARCHAR(50) NULL,
    title NVARCHAR(255) NOT NULL,
    updated_at DATETIME2(6) NULL CONSTRAINT DF_grammar_groups_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_grammar_groups PRIMARY KEY (id),
    CONSTRAINT UQ_grammar_group_key UNIQUE (group_key)
);

CREATE TABLE dbo.grammar_questions (
    id BIGINT IDENTITY(1,1) NOT NULL,
    correct_token_id INT NULL,
    correction NVARCHAR(255) NULL,
    created_at DATETIME2(6) NULL CONSTRAINT DF_grammar_questions_created_at DEFAULT SYSUTCDATETIME(),
    error_type NVARCHAR(255) NULL,
    explanation NVARCHAR(MAX) NULL,
    group_id BIGINT NULL,
    hint NVARCHAR(500) NULL,
    instruction NVARCHAR(MAX) NULL,
    payload_json NVARCHAR(MAX) NULL,
    question_key NVARCHAR(100) NULL,
    question_type VARCHAR(50) NOT NULL,
    title NVARCHAR(255) NULL,
    updated_at DATETIME2(6) NULL CONSTRAINT DF_grammar_questions_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_grammar_questions PRIMARY KEY (id),
    CONSTRAINT FK_questions_group FOREIGN KEY (group_id) REFERENCES dbo.grammar_groups(id) ON DELETE CASCADE,
    CONSTRAINT CK_grammar_questions_payload_json CHECK (payload_json IS NULL OR ISJSON(payload_json)=1)
);

CREATE TABLE dbo.grammar_question_reports (
    id BIGINT IDENTITY(1,1) NOT NULL,
    author_email NVARCHAR(255) NULL,
    author_name NVARCHAR(255) NULL,
    created_at DATETIME2(6) NULL CONSTRAINT DF_grammar_question_reports_created_at DEFAULT SYSUTCDATETIME(),
    description NVARCHAR(MAX) NULL,
    error_type NVARCHAR(255) NULL,
    group_id BIGINT NULL,
    question_key NVARCHAR(100) NULL,
    question_title NVARCHAR(255) NULL,
    report_key NVARCHAR(100) NOT NULL,
    reporter_email NVARCHAR(255) NULL,
    reporter_name NVARCHAR(255) NULL,
    status NVARCHAR(50) NULL CONSTRAINT DF_grammar_question_reports_status DEFAULT N'PENDING',
    CONSTRAINT PK_grammar_question_reports PRIMARY KEY (id),
    CONSTRAINT FK_reports_group FOREIGN KEY (group_id) REFERENCES dbo.grammar_groups(id) ON DELETE CASCADE,
    CONSTRAINT UQ_grammar_report_key UNIQUE (report_key)
);

-- Query, ownership, audit, history and quota indexes. Unique constraints already index their keys.
CREATE UNIQUE INDEX UX_users_email ON dbo.users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX UX_users_google_subject ON dbo.users(provider_id) WHERE provider=N'GOOGLE' AND provider_id IS NOT NULL;
CREATE INDEX IX_users_admin_search ON dbo.users(locked,role,created_at DESC) INCLUDE(name,email);
CREATE INDEX IX_users_locked_by ON dbo.users(locked_by) WHERE locked_by IS NOT NULL;
CREATE INDEX IX_admin_logs_created ON dbo.admin_user_action_logs(created_at DESC,id DESC);
CREATE INDEX IX_admin_logs_target ON dbo.admin_user_action_logs(target_user_id,created_at DESC);
CREATE INDEX IX_admin_logs_admin ON dbo.admin_user_action_logs(admin_id,created_at DESC);
CREATE INDEX IX_decks_public ON dbo.decks(visibility,deleted,created_at DESC);
CREATE INDEX IX_decks_owner ON dbo.decks(owner_id,deleted,created_at DESC);
CREATE INDEX IX_flashcards_deck ON dbo.flashcards(deck_id,id);
CREATE INDEX IX_reviews_due ON dbo.user_flashcard_reviews(user_id,next_review_date,flashcard_id);
CREATE INDEX IX_study_event_history ON dbo.flashcard_study_events(user_id,flashcard_id,id DESC) INCLUDE(quality,confident_recall);
CREATE INDEX IX_study_event_card ON dbo.flashcard_study_events(flashcard_id);
CREATE INDEX IX_weak_user_active ON dbo.user_weak_vocabularies(user_id,weak_deleted,mastery_score,id);
CREATE INDEX IX_weak_flashcard ON dbo.user_weak_vocabularies(flashcard_id);
CREATE INDEX IX_sessions_user ON dbo.weak_practice_sessions(user_id,started_at DESC);
CREATE INDEX IX_items_weak ON dbo.weak_practice_items(weak_vocabulary_id);
CREATE INDEX IX_attempts_weak ON dbo.weak_practice_attempts(user_weak_vocabulary_id,attempted_at DESC);
CREATE INDEX IX_attempts_session ON dbo.weak_practice_attempts(session_id);
CREATE INDEX IX_ai_created ON dbo.ai_generation_batches(created_at);
CREATE INDEX IX_ai_user_created ON dbo.ai_generation_batches(user_id,created_at);
CREATE INDEX IX_ai_pending ON dbo.ai_generation_batches(user_id,status,lease_until);
CREATE INDEX IX_ai_expiry ON dbo.ai_generation_batches(status,expires_at);
CREATE INDEX IX_ai_deck ON dbo.ai_generation_batches(deck_id);
CREATE INDEX IX_grammar_questions_group ON dbo.grammar_questions(group_id);
CREATE INDEX IX_grammar_questions_key ON dbo.grammar_questions(question_key) WHERE question_key IS NOT NULL;
CREATE INDEX IX_grammar_reports_group ON dbo.grammar_question_reports(group_id);
CREATE INDEX IX_grammar_reports_author ON dbo.grammar_question_reports(author_email,status,created_at DESC);

-- LOCAL DEMO ONLY: user-approved public demo credentials; never deploy these accounts.
-- admin@studye.test: AdminDemo@123; learner1/learner2: LearnerDemo@123;
-- locked@studye.test: LockedDemo@123 (locked; Admin can unlock).
-- No fake OpenAI batch or invented Study/SM-2 history.
DECLARE @Now DATETIME2(6)=SYSUTCDATETIME(), @Created DATETIME2(6)=DATEADD(DAY,-14,SYSUTCDATETIME());
DECLARE @UserIds TABLE(id BIGINT);
INSERT dbo.users(email,name,password,provider,role,demo_account,created_at,updated_at)
OUTPUT inserted.id INTO @UserIds
VALUES(N'learner1@studye.test',N'Demo Learner One',N'$2a$10$YNFbDw//VNK2CmHWmPHRqukQavQ70eZBY9SrCDIAjFu.mtVHaNfIy',N'LOCAL',N'ROLE_USER',1,@Created,@Created);
DECLARE @DemoUser BIGINT=(SELECT id FROM @UserIds);
INSERT dbo.users(email,name,password,provider,role,demo_account,locked,locked_at,locked_reason,created_at,updated_at)
VALUES
 (N'admin@studye.test',N'StudyE Administrator',N'$2a$10$B5jGfuBjXinzWtPumtwNwu5dLhwAz/AOuZuDc.UMCNsJl6kXS65gm',N'LOCAL',N'ROLE_ADMIN',1,0,NULL,NULL,@Created,@Created),
 (N'learner2@studye.test',N'Demo Learner Two',N'$2a$10$YNFbDw//VNK2CmHWmPHRqukQavQ70eZBY9SrCDIAjFu.mtVHaNfIy',N'LOCAL',N'ROLE_USER',1,0,NULL,NULL,@Created,@Created),
 (N'locked@studye.test',N'Locked Demo User',N'$2a$10$ocmhrhZJTQHIatfRRV187.mVnVKA1HqpfFdfUEzFzk0NNUbgodH7S',N'LOCAL',N'ROLE_USER',1,1,@Created,N'Local demo: locked account',@Created,@Created);
DECLARE @DeckIds TABLE(id BIGINT,name NVARCHAR(255));
INSERT dbo.decks(name,description,owner_id,visibility,created_at,updated_at)
OUTPUT inserted.id,inserted.name INTO @DeckIds VALUES
 (N'Everyday English',N'Từ vựng giao tiếp hằng ngày',@DemoUser,'PUBLIC',@Created,@Created),
 (N'Academic English',N'Từ vựng học thuật',@DemoUser,'PUBLIC',@Created,@Created),
 (N'Travel',N'Từ vựng du lịch',@DemoUser,'PUBLIC',@Created,@Created),
 (N'Weak Vocabulary Demo',N'Từ vựng mẫu để thử luyện tập và bộ lọc từ cần ôn.',@DemoUser,'PRIVATE',@Created,@Created);
DECLARE @WeakDeck BIGINT=(SELECT id FROM @DeckIds WHERE name=N'Weak Vocabulary Demo');
INSERT dbo.flashcards(deck_id,vocabulary,meaning,phonetic,example_sentence)
SELECT d.id,v.word,v.meaning,v.ipa,v.example FROM (VALUES
 (N'Everyday English',N'hello',N'xin chào',N'/həˈləʊ/',N'Say hello when you meet a friend.'),
 (N'Everyday English',N'learn',N'học',N'/lɜːn/',N'We learn something new every day.'),
 (N'Academic English',N'research',N'nghiên cứu',N'/rɪˈsɜːtʃ/',N'Research requires careful evidence.'),
 (N'Academic English',N'analysis',N'phân tích',N'/əˈnæləsɪs/',N'Good analysis makes the report clear.'),
 (N'Travel',N'passport',N'hộ chiếu',N'/ˈpɑːspɔːt/',N'Keep your passport in a safe place.'),
 (N'Travel',N'journey',N'chuyến đi',N'/ˈdʒɜːni/',N'The journey begins at dawn.')
)v(deck_name,word,meaning,ipa,example) JOIN @DeckIds d ON d.name=v.deck_name;
DECLARE @Words TABLE(seed_no INT PRIMARY KEY,profile_id INT,word NVARCHAR(255),meaning NVARCHAR(255),phonetic NVARCHAR(255),example_sentence NVARCHAR(MAX));
INSERT @Words VALUES
 (1,1,N'abandon',N'từ bỏ',N'/əˈbændən/',N'They had to abandon the trip because of heavy snow.'),
 (2,1,N'ability',N'khả năng',N'/əˈbɪləti/',N'Her ability to explain difficult ideas makes her a good teacher.'),
 (3,1,N'achieve',N'đạt được',N'/əˈtʃiːv/',N'You can achieve your goals through regular practice.'),
 (4,1,N'adapt',N'thích nghi',N'/əˈdæpt/',N'Plants must adapt to changes in their environment.'),
 (5,1,N'adequate',N'đầy đủ',N'/ˈædɪkwət/',N'The room has adequate space for twenty students.'),
 (6,1,N'advantage',N'lợi thế',N'/ədˈvɑːntɪdʒ/',N'Living near the station is a clear advantage.'),
 (7,1,N'affect',N'ảnh hưởng',N'/əˈfekt/',N'Lack of sleep can affect your concentration.'),
 (8,1,N'alternative',N'phương án thay thế',N'/ɔːlˈtɜːnətɪv/',N'Cycling is a healthy alternative to driving.'),
 (9,1,N'analyze',N'phân tích',N'/ˈænəlaɪz/',N'We need to analyze the results before making a decision.'),
 (10,1,N'approach',N'cách tiếp cận',N'/əˈprəʊtʃ/',N'This approach makes the problem easier to solve.'),
 (11,2,N'appropriate',N'phù hợp',N'/əˈprəʊpriət/',N'Please wear appropriate clothing for the weather.'),
 (12,2,N'assume',N'giả định',N'/əˈsjuːm/',N'Do not assume that everyone agrees with you.'),
 (13,2,N'attempt',N'cố gắng',N'/əˈtempt/',N'Her first attempt to solve the puzzle was successful.'),
 (14,2,N'aware',N'nhận thức',N'/əˈweə/',N'We are aware of the risks involved.'),
 (15,2,N'benefit',N'lợi ích',N'/ˈbenɪfɪt/',N'Regular exercise has a lasting benefit for your health.'),
 (16,2,N'challenge',N'thách thức',N'/ˈtʃælɪndʒ/',N'Learning a new language can be an exciting challenge.'),
 (17,2,N'circumstance',N'hoàn cảnh',N'/ˈsɜːkəmstæns/',N'We will help you in any circumstance.'),
 (18,2,N'combine',N'kết hợp',N'/kəmˈbaɪn/',N'You can combine these two ingredients in a bowl.'),
 (19,2,N'communicate',N'giao tiếp',N'/kəˈmjuːnɪkeɪt/',N'They communicate with their relatives by phone.'),
 (20,2,N'compare',N'so sánh',N'/kəmˈpeə/',N'Please compare the prices before you buy a ticket.'),
 (21,3,N'complex',N'phức tạp',N'/ˈkɒmpleks/',N'The engineer explained a complex problem clearly.'),
 (22,3,N'concentrate',N'tập trung',N'/ˈkɒnsəntreɪt/',N'I find it easier to concentrate in a quiet room.'),
 (23,3,N'consequence',N'hậu quả',N'/ˈkɒnsɪkwəns/',N'The delay was a consequence of the storm.'),
 (24,3,N'consider',N'xem xét',N'/kənˈsɪdə/',N'We should consider every option carefully.'),
 (25,3,N'consistent',N'nhất quán',N'/kənˈsɪstənt/',N'Her work has been consistent throughout the year.'),
 (26,3,N'consume',N'tiêu thụ',N'/kənˈsjuːm/',N'These machines consume less electricity.'),
 (27,3,N'context',N'ngữ cảnh',N'/ˈkɒntekst/',N'You can often guess a word from its context.'),
 (28,3,N'contribute',N'đóng góp',N'/kənˈtrɪbjuːt/',N'Everyone can contribute to the class discussion.'),
 (29,3,N'convince',N'thuyết phục',N'/kənˈvɪns/',N'The evidence helped convince the committee.'),
 (30,3,N'decline',N'suy giảm',N'/dɪˈklaɪn/',N'There has been a steady decline in air pollution.'),
 (31,4,N'define',N'định nghĩa',N'/dɪˈfaɪn/',N'Please define the key terms in your report.'),
 (32,4,N'demonstrate',N'chứng minh',N'/ˈdemənstreɪt/',N'The teacher will demonstrate how the machine works.'),
 (33,4,N'determine',N'xác định',N'/dɪˈtɜːmɪn/',N'The test will determine your current language level.'),
 (34,4,N'develop',N'phát triển',N'/dɪˈveləp/',N'Reading widely helps children develop their vocabulary.'),
 (35,4,N'efficient',N'hiệu quả',N'/ɪˈfɪʃənt/',N'The new system is more efficient than the old one.'),
 (36,4,N'emphasize',N'nhấn mạnh',N'/ˈemfəsaɪz/',N'The report will emphasize the need for clean water.'),
 (37,4,N'encourage',N'khuyến khích',N'/ɪnˈkʌrɪdʒ/',N'We encourage students to ask questions.'),
 (38,4,N'environment',N'môi trường',N'/ɪnˈvaɪrənmənt/',N'Trees help protect the natural environment.'),
 (39,4,N'establish',N'thiết lập',N'/ɪˈstæblɪʃ/',N'The researchers hope to establish a clear link.'),
 (40,4,N'estimate',N'ước tính',N'/ˈestɪmeɪt/',N'Can you estimate the cost of the repairs?'),
 (41,5,N'evaluate',N'đánh giá',N'/ɪˈvæljueɪt/',N'We will evaluate the project at the end of the month.'),
 (42,5,N'evidence',N'bằng chứng',N'/ˈevɪdəns/',N'There is strong evidence to support this conclusion.'),
 (43,5,N'expand',N'mở rộng',N'/ɪkˈspænd/',N'The company plans to expand its training program.'),
 (44,5,N'factor',N'yếu tố',N'/ˈfæktə/',N'Cost is an important factor in our decision.'),
 (45,5,N'feature',N'đặc điểm',N'/ˈfiːtʃə/',N'The most useful feature is the built-in dictionary.'),
 (46,5,N'focus',N'tập trung',N'/ˈfəʊkəs/',N'Try to focus on one task at a time.'),
 (47,5,N'function',N'chức năng',N'/ˈfʌŋkʃən/',N'The main function of this button is to save your work.'),
 (48,5,N'generate',N'tạo ra',N'/ˈdʒenəreɪt/',N'Solar panels generate electricity from sunlight.'),
 (49,5,N'identify',N'xác định',N'/aɪˈdentɪfaɪ/',N'Can you identify the bird in this picture?'),
 (50,5,N'impact',N'tác động',N'/ˈɪmpækt/',N'The new library has had a positive impact on the town.'),
 (51,6,N'improve',N'cải thiện',N'/ɪmˈpruːv/',N'Daily practice will improve your pronunciation.'),
 (52,6,N'indicate',N'chỉ ra',N'/ˈɪndɪkeɪt/',N'Dark clouds may indicate that rain is coming.'),
 (53,6,N'influence',N'ảnh hưởng',N'/ˈɪnfluəns/',N'A good teacher can influence a student for life.'),
 (54,6,N'maintain',N'duy trì',N'/meɪnˈteɪn/',N'Regular exercise helps maintain good health.'),
 (55,6,N'major',N'chủ yếu',N'/ˈmeɪdʒə/',N'Transport is a major concern for local residents.'),
 (56,6,N'method',N'phương pháp',N'/ˈmeθəd/',N'This method works well for small groups.'),
 (57,6,N'occur',N'xảy ra',N'/əˈkɜː/',N'Mistakes often occur when people rush.'),
 (58,6,N'participate',N'tham gia',N'/pɑːˈtɪsɪpeɪt/',N'Every student can participate in the discussion.'),
 (59,6,N'perform',N'thực hiện',N'/pəˈfɔːm/',N'The musicians will perform at the school concert.'),
 (60,6,N'prevent',N'ngăn chặn',N'/prɪˈvent/',N'Washing your hands can prevent the spread of germs.'),
 (61,7,N'principle',N'nguyên tắc',N'/ˈprɪnsəpəl/',N'Fairness is an important principle in our classroom.'),
 (62,7,N'process',N'quy trình',N'/ˈprəʊses/',N'Learning a language is a gradual process.'),
 (63,7,N'require',N'yêu cầu',N'/rɪˈkwaɪə/',N'These plants require plenty of sunlight.'),
 (64,7,N'respond',N'phản hồi',N'/rɪˈspɒnd/',N'Please respond to the invitation by Friday.'),
 (65,7,N'significant',N'đáng kể',N'/sɪɡˈnɪfɪkənt/',N'The treatment led to a significant improvement.'),
 (66,7,N'similar',N'tương tự',N'/ˈsɪmɪlə/',N'The two buildings have a similar design.'),
 (67,7,N'specific',N'cụ thể',N'/spəˈsɪfɪk/',N'Please give a specific example to support your answer.'),
 (68,7,N'strategy',N'chiến lược',N'/ˈstrætədʒi/',N'Our strategy is to practice a little every day.'),
 (69,7,N'structure',N'cấu trúc',N'/ˈstrʌktʃə/',N'The essay has a clear structure.'),
 (70,7,N'sufficient',N'đủ',N'/səˈfɪʃənt/',N'We have sufficient time to finish the task.'),
 (71,8,N'support',N'hỗ trợ',N'/səˈpɔːt/',N'Her friends offered support during a difficult week.'),
 (72,8,N'tendency',N'xu hướng',N'/ˈtendənsi/',N'He has a tendency to speak too quickly.'),
 (73,8,N'theory',N'lý thuyết',N'/ˈθɪəri/',N'The experiment supports the scientist''s theory.'),
 (74,8,N'transfer',N'chuyển giao',N'/trænsˈfɜː/',N'You can transfer the files to another computer.'),
 (75,8,N'vary',N'thay đổi',N'/ˈveəri/',N'Prices vary from one shop to another.'),
 (76,8,N'accept',N'chấp nhận',N'/əkˈsept/',N'I am happy to accept your invitation.'),
 (77,8,N'access',N'truy cập',N'/ˈækses/',N'All students have access to the library.'),
 (78,8,N'accurate',N'chính xác',N'/ˈækjərət/',N'The report provides accurate information.'),
 (79,8,N'acquire',N'tiếp thu',N'/əˈkwaɪə/',N'Children acquire new words through conversation.'),
 (80,8,N'beneficial',N'có lợi',N'/benɪˈfɪʃəl/',N'Regular reading is beneficial for language learners.');
DECLARE @CardIds TABLE(id BIGINT,word NVARCHAR(255));
INSERT dbo.flashcards(deck_id,vocabulary,meaning,phonetic,example_sentence)
OUTPUT inserted.id,inserted.vocabulary INTO @CardIds
SELECT @WeakDeck,word,meaning,phonetic,example_sentence FROM @Words;
-- Each profile covers ten words. Patterns replay real +/-20 mastery rules.
-- Legacy AUTO dates are unknown: NULL, not invented historical Study events.
DECLARE @Profiles TABLE(id INT PRIMARY KEY,manual BIT,automatic BIT,answers VARCHAR(10),deleted BIT);
INSERT @Profiles VALUES (1,1,0,'',0),(2,1,0,'CCC',0),(3,1,0,'WW',0),(4,1,0,'WCW',0),
 (5,0,1,'WWCC',0),(6,1,1,'CCCCC',0),(7,1,0,'CCCC',0),(8,1,0,'CCCWW',1);
INSERT dbo.user_weak_vocabularies(user_id,flashcard_id,manual_marked,auto_detected,detection_reason,weak_note,created_at,updated_at)
SELECT @DemoUser,c.id,p.manual,p.automatic,CASE WHEN p.automatic=1 THEN 'LEGACY_AUTO' ELSE 'MANUAL_MARK' END,
 NULL,@Created,@Created
FROM @Words w JOIN @CardIds c ON c.word=w.word JOIN @Profiles p ON p.id=w.profile_id;
DECLARE @Plan TABLE(n INT PRIMARY KEY,weak_id BIGINT,word NVARCHAR(255),meaning NVARCHAR(255),correct BIT,at_time DATETIME2(6));
INSERT @Plan
SELECT CONVERT(INT,ROW_NUMBER() OVER(ORDER BY w.seed_no,s.step)),u.id,w.word,w.meaning,
 CONVERT(BIT,CASE WHEN SUBSTRING(p.answers,s.step,1)='C' THEN 1 ELSE 0 END),
 DATEADD(MINUTE,w.seed_no*10+s.step,DATEADD(DAY,-3,@Now))
FROM @Words w JOIN @Profiles p ON p.id=w.profile_id JOIN @CardIds c ON c.word=w.word
JOIN dbo.user_weak_vocabularies u ON u.flashcard_id=c.id AND u.user_id=@DemoUser
CROSS JOIN (VALUES(1),(2),(3),(4),(5))s(step) WHERE s.step <= LEN(p.answers);
DECLARE @n INT=1,@nMax INT=(SELECT COUNT(*) FROM @Plan),@WeakId BIGINT,@Word NVARCHAR(255),@Meaning NVARCHAR(255),@Correct BIT,@At DATETIME2(6),@Session BIGINT,@Item BIGINT,@Reason VARCHAR(40);
WHILE @n <= @nMax
BEGIN
 SELECT @WeakId=weak_id,@Word=word,@Meaning=meaning,@Correct=correct,@At=at_time FROM @Plan WHERE n=@n;
 INSERT dbo.weak_practice_sessions(user_id,question_type,status,started_at,completed_at,total_questions,correct_answers,wrong_answers)
 VALUES(@DemoUser,'MEANING_TO_WORD','COMPLETED',DATEADD(SECOND,-30,@At),@At,1,CONVERT(INT,@Correct),1-CONVERT(INT,@Correct));
 SET @Session=CONVERT(BIGINT,SCOPE_IDENTITY());
 INSERT dbo.weak_practice_items(session_id,weak_vocabulary_id,item_order,question_type,question_content,correct_answer,answered,answered_at)
 VALUES(@Session,@WeakId,0,'MEANING_TO_WORD',@Meaning,@Word,1,@At);
 SET @Item=CONVERT(BIGINT,SCOPE_IDENTITY());
 INSERT dbo.weak_practice_attempts(session_id,item_id,user_weak_vocabulary_id,question_type,question_content,user_answer,correct_answer,correct,attempted_at)
 VALUES(@Session,@Item,@WeakId,'MEANING_TO_WORD',@Meaning,CASE WHEN @Correct=1 THEN @Word ELSE N'I do not know' END,@Word,@Correct,@At);
 UPDATE dbo.user_weak_vocabularies SET total_attempts=total_attempts+1,correct_count=correct_count+CONVERT(INT,@Correct),
 wrong_count=wrong_count+1-CONVERT(INT,@Correct),consecutive_wrong=CASE WHEN @Correct=1 THEN 0 ELSE consecutive_wrong+1 END,
 mastery_score=CASE WHEN @Correct=1 THEN CASE WHEN mastery_score+20>100 THEN 100 ELSE mastery_score+20 END ELSE CASE WHEN mastery_score<20 THEN 0 ELSE mastery_score-20 END END,
 last_practiced_at=@At,updated_at=@At WHERE id=@WeakId;
 SET @Reason=NULL;
 SELECT @Reason=CASE WHEN consecutive_wrong>=2 THEN 'PRACTICE_CONSECUTIVE_WRONG' WHEN total_attempts>=3 AND correct_count*100.0/total_attempts<60 THEN 'PRACTICE_LOW_ACCURACY' END
 FROM dbo.user_weak_vocabularies WHERE id=@WeakId;
 IF @Reason IS NOT NULL
 UPDATE dbo.user_weak_vocabularies SET first_detected_at=CASE WHEN auto_detected=0 AND first_detected_at IS NULL THEN @At ELSE first_detected_at END,
 auto_detected=1,detection_reason=@Reason,last_detected_at=@At WHERE id=@WeakId;
 SET @n=@n+1;
END;
UPDATE u SET weak_deleted=1,weak_deleted_at=DATEADD(MINUTE,1,u.last_practiced_at),updated_at=DATEADD(MINUTE,1,u.last_practiced_at)
FROM dbo.user_weak_vocabularies u JOIN @CardIds c ON c.id=u.flashcard_id JOIN @Words w ON w.word=c.word JOIN @Profiles p ON p.id=w.profile_id WHERE p.deleted=1;
INSERT dbo.ai_generation_gate(id) VALUES(1);
-- AI batches empty: quotas/candidates are represented by batches and JSON snapshots,
-- serialized through singleton gate 1, as implemented by AiGenerationStore.

-- Grammar: preserve the thirteen original questions; add cards mode coverage.

INSERT dbo.grammar_groups (group_key, title, description, icon, author_name, author_email) VALUES
 (N'group_test_01', N'Test 1', N'Bài kiểm tra tổng hợp: Thì Quá khứ, Hiện tại đơn, Menu thả xuống', N'', N'StudyE Official', N'learner1@studye.test'),
 (N'group_test_02', N'Test 2', N'Bài kiểm tra chuyên đề: Câu điều kiện loại 1 & loại 2', N'', N'StudyE Official', N'learner1@studye.test'),
 (N'group_test_03', N'Test 3', N'Bài kiểm tra: Giới từ, Cụm tính từ và Cấu trúc thường gặp', N'', N'StudyE Official', N'learner1@studye.test'),
 (N'group_test_04', N'Test 4', N'Bài kiểm tra nâng cao: Hình ảnh, Đoạn văn điền từ, Đọc hiểu văn bản & Nghe bằng giọng đọc trình duyệt', N'', N'StudyE Official', N'learner1@studye.test');

-- 8.2. Insert Questions for Test 1
INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, correct_token_id, correction, error_type, hint, explanation)
SELECT 
    g.id,
    N'cau_1_tim_loi_sai',
    N'Câu 1: Tìm Lỗi Sai - Thì Quá Khứ Đơn',
    N'SPOT_ERROR',
    N'Chỉ ra từ bị sai trong câu sau:',
    N'{"tokens":[{"id":1,"text":"She"},{"id":2,"text":"go"},{"id":3,"text":"to school"},{"id":4,"text":"yesterday."}]}',
    2,
    N'went',
    N'Thì quá khứ đơn / Tương hợp thời gian',
    N'Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu (yesterday).',
    N'Vì có trạng từ ''yesterday'' nên động từ ''go'' phải chia ở thì quá khứ đơn là ''went''.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_01';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_2_hien_tai_don',
    N'Câu 2: Điền Từ - Thì Hiện Tại Đơn',
    N'FILL_BLANK_TEXT',
    N'Hoàn thành câu bằng cách điền từ thích hợp:',
    N'{"template":"She usually {1} up early and {2} jogging.","blanks":{"1":{"hint":"wake","accepted_answers":["wakes"]},"2":{"hint":"go","accepted_answers":["goes"]}},"validation":{"strict_case":false,"ignore_extra_whitespace":true}}',
    N'Thì Hiện tại đơn: Diễn tả thói quen lặp đi lặp lại với chủ ngữ ngôi thứ ba số ít (She).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_01';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_3_chon_gioi_tu',
    N'Câu 3: Chọn Từ Trắc Nghiệm - Hiện Tại Hoàn Thành',
    N'FILL_BLANK_DROPDOWN',
    N'Chọn từ thích hợp từ danh sách thả xuống:',
    N'{"template":"They have lived in Vietnam {1} 3 years.","blanks":{"1":{"options":["for","since","from","during"],"correct_answer":"for"}}}',
    N'Dùng ''for'' đi kèm với một khoảng thời gian (3 years) trong thì Hiện tại hoàn thành.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_01';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_4_chon_the_dap_an',
    N'Câu 4: Chọn Từ Thả Xuống - Hiện Tại Hoàn Thành Tiếp Diễn',
    N'FILL_BLANK_DROPDOWN',
    N'Chọn từ thích hợp từ danh sách thả xuống:',
    N'{"template":"She has been living here {1} 2015.","blanks":{"1":{"options":["since","for","from","during"],"correct_answer":"since"}}}',
    N'Dùng ''Since'' đi kèm với mốc thời gian xác định trong quá khứ (2015) trong thì Hiện tại hoàn thành tiếp diễn.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_01';

-- 8.3. Insert Questions for Test 2
INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_cond_1',
    N'Câu 1: Điền Động Từ - Câu Điều Kiện Loại 2',
    N'FILL_BLANK_TEXT',
    N'Điền dạng đúng của động từ trong ngoặc:',
    N'{"template":"If I {1} enough money, I {2} a new house.","blanks":{"1":{"hint":"have","accepted_answers":["had"]},"2":{"hint":"buy","accepted_answers":["would buy","''d buy"]}},"validation":{"strict_case":false,"ignore_extra_whitespace":true}}',
    N'Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_02';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, correct_token_id, correction, error_type, hint, explanation)
SELECT 
    g.id,
    N'cau_cond_2',
    N'Câu 2: Tìm Lỗi Sai - Mệnh Đề If Loại 1',
    N'SPOT_ERROR',
    N'Chỉ ra từ bị sai trong câu điều kiện sau:',
    N'{"tokens":[{"id":1,"text":"If"},{"id":2,"text":"it"},{"id":3,"text":"will rain"},{"id":4,"text":"tomorrow,"},{"id":5,"text":"we will stay home."}]}',
    3,
    N'rains',
    N'Câu điều kiện loại 1 / Mệnh đề If',
    N'Mệnh đề If loại 1 không dùng ''will''.',
    N'Trong câu điều kiện loại 1, mệnh đề If chia thì Hiện tại đơn (''rains''), không dùng ''will rain''.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_02';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_cond_3',
    N'Câu 3: Chọn Từ Trắc Nghiệm - Câu Điều Kiện Loại 0',
    N'FILL_BLANK_DROPDOWN',
    N'Chọn từ đúng diễn tả chân lý hiển nhiên:',
    N'{"template":"If you heat ice, it {1}.","blanks":{"1":{"options":["melts","will melt","melted","would melt"],"correct_answer":"melts"}}}',
    N'Câu điều kiện loại 0 diễn tả sự thật hiển nhiên: Cả 2 vế đều dùng thì Hiện tại đơn (heat / melts).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_02';

-- 8.4. Insert Questions for Test 3
INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_prep_1',
    N'Câu 1: Chọn Từ Thả Xuống - Giới Từ Đi Kèm Tính Từ',
    N'FILL_BLANK_DROPDOWN',
    N'Chọn từ thích hợp từ danh sách thả xuống:',
    N'{"template":"They are interested {1} learning English online.","blanks":{"1":{"options":["in","on","at","with"],"correct_answer":"in"}}}',
    N'Cấu trúc cố định: ''to be interested in something'' (thích thú, quan tâm đến điều gì).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_03';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_prep_2',
    N'Câu 2: Điền Giới Từ - Giới Từ Chỉ Thời Gian',
    N'FILL_BLANK_TEXT',
    N'Điền giới từ chỉ thời gian thích hợp:',
    N'{"template":"The meeting starts {1} 9:00 AM {2} Monday.","blanks":{"1":{"hint":"giờ giấc","accepted_answers":["at"]},"2":{"hint":"thứ trong tuần","accepted_answers":["on"]}},"validation":{"strict_case":false,"ignore_extra_whitespace":true}}',
    N'Dùng ''at'' trước mốc giờ cụ thể (at 9:00 AM) và ''on'' trước ngày/thứ trong tuần (on Monday).'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_03';

-- 8.5. Insert Questions for Test 4 (Multimedia & Reading)
INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_img_1',
    N'Câu 1: Quan sát hình ảnh lớp học',
    N'IMAGE_QUESTION',
    N'Quan sát hình minh hoạ bên dưới và chọn câu miêu tả chính xác nhất:',
    N'{"image_url":"/demo/classroom.svg","image_caption":"Hoạt động trong lớp học hiện đại","question_text":"What are the students and teacher doing in the classroom?","options":["The teacher is explaining the lesson while students listen attentively.","The students are taking an exam in complete silence.","Everyone is playing outdoor sports in the school yard.","The teacher is writing a letter at the desk alone."],"correct_answer":"The teacher is explaining the lesson while students listen attentively."}',
    N'Hình minh hoạ cho thấy giáo viên đang giải thích bài học và học sinh chú ý lắng nghe.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_04';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_cloze_1',
    N'Câu 2: Đoạn văn điền từ về Lợi ích đọc sách',
    N'PASSAGE_CLOZE',
    N'Đọc đoạn văn sau và chọn từ thích hợp cho mỗi chỗ trống:',
    N'{"passage_title":"The Benefits of Regular Reading","passage_text":"Reading books every day helps expand your vocabulary and improve your focus. It {1} you to learn new ideas and understand different cultures. Furthermore, developing a reading habit at an early age {2} proven to enhance critical thinking skills.","blanks":{"1":{"options":["allows","forces","forbids","stops"],"correct_answer":"allows"},"2":{"options":["has been","have been","was being","is having"],"correct_answer":"has been"}}}',
    N'[1] ''allows'' mang nghĩa tạo điều kiện / cho phép. [2] ''developing a reading habit'' là danh động từ số ít nên chia ''has been proven''.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_04';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_reading_1',
    N'Câu 3: Đọc hiểu - Trí Tuệ Nhân Tạo (AI)',
    N'READING_COMPREHENSION',
    N'Đọc kỹ đoạn văn sau và trả lời các câu hỏi bên dưới:',
    N'{"passage_title":"Artificial Intelligence in Everyday Life","passage_text":"Artificial Intelligence (AI) is rapidly transforming how we live and work. From virtual assistants on smartphones to personalized recommendations on streaming services, AI algorithms analyze vast amounts of data to provide convenient solutions. However, experts remind us that ethical guidelines are essential to ensure user privacy and data security.","sub_questions":[{"id":"sub_1","question":"What is one application of AI mentioned in the passage?","options":["Spacecraft manual navigation","Personalized recommendations on streaming services","Traditional postal mail delivery","Printing physical textbooks"],"correct_answer":"Personalized recommendations on streaming services"},{"id":"sub_2","question":"Why do experts emphasize ethical guidelines for AI?","options":["To completely stop technological advancement","To ensure user privacy and data security","To increase the prices of smartphones","To make algorithms run slower"],"correct_answer":"To ensure user privacy and data security"}]}',
    N'Đoạn văn nhấn mạnh ứng dụng thực tiễn của AI (gợi ý nội dung) và sự cần thiết của quy chuẩn đạo đức nhằm bảo vệ quyền riêng tư người dùng.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_04';

INSERT dbo.grammar_questions (group_id, question_key, title, question_type, instruction, payload_json, explanation)
SELECT 
    g.id,
    N'cau_audio_1',
    N'Câu 4: Nghe thông báo sân bay (giọng đọc trình duyệt)',
    N'AUDIO_LISTENING',
    N'Nhấn phát để nghe trình duyệt đọc thông báo sân bay rồi chọn đáp án:',
    N'{"audio_url":null,"transcript":"Good morning passengers! Flight VN382 to Da Nang is now boarding at Gate 4. Please have your boarding passes and identity cards ready.","question_text":"Which flight is currently boarding according to the announcement?","options":["Flight VN382 to Da Nang at Gate 4","Flight VN120 to Hanoi at Gate 2","Flight QH555 to Nha Trang at Gate 10","Flight VJ888 to Phu Quoc at Gate 7"],"correct_answer":"Flight VN382 to Da Nang at Gate 4"}',
    N'Thông báo ghi rõ: ''Flight VN382 to Da Nang is now boarding at Gate 4''.'
FROM dbo.grammar_groups g WHERE g.group_key = N'group_test_04';


INSERT dbo.grammar_questions(group_id,question_key,title,question_type,instruction,payload_json,explanation)
SELECT id,N'cau_cards_1',N'Chọn thẻ: Hiện tại đơn',N'FILL_BLANK_CARDS',N'Chọn thẻ thích hợp.',
 N'{"template":"She {1} English every day.","blanks":{"1":{"options":["studies","study","studied","studying"],"correct_answer":"studies"}}}',N'Chủ ngữ She dùng studies ở thì hiện tại đơn.'
FROM dbo.grammar_groups WHERE group_key=N'group_test_01';

-- =====================================================
-- ACCEPTANCE CHECKS: failures THROW before the schema/seed transaction commits.
-- Manifest deliberately independent of sys catalogs: detects omitted structures.
-- =====================================================
DECLARE @ExpectedTables TABLE(name SYSNAME PRIMARY KEY,expected_rows BIGINT);
INSERT @ExpectedTables VALUES
 (N'users',4),
 (N'admin_user_action_logs',0),
 (N'decks',4),
 (N'flashcards',86),
 (N'user_flashcard_reviews',0),
 (N'flashcard_study_events',0),
 (N'user_weak_vocabularies',80),
 (N'weak_practice_sessions',260),
 (N'weak_practice_items',260),
 (N'weak_practice_attempts',260),
 (N'ai_generation_gate',1),
 (N'ai_generation_batches',0),
 (N'grammar_groups',4),
 (N'grammar_questions',14),
 (N'grammar_question_reports',0);
IF EXISTS(SELECT 1 FROM @ExpectedTables WHERE OBJECT_ID(N'dbo.'+name,N'U') IS NULL)
 THROW 51100,'Missing or unexpected application tables.',1;
DECLARE @ExpectedColumns TABLE(table_name SYSNAME,column_name SYSNAME,type_name SYSNAME,max_length SMALLINT,scale_value TINYINT,nullable BIT,identity_value BIT,has_default BIT,PRIMARY KEY(table_name,column_name));
INSERT @ExpectedColumns VALUES
 (N'users',N'id',N'bigint',8,0,0,1,0),
 (N'users',N'auth_identity',N'varchar',36,0,0,0,1),
 (N'users',N'demo_account',N'bit',1,0,0,0,1),
 (N'users',N'avatar_url',N'nvarchar',510,0,1,0,0),
 (N'users',N'bio',N'nvarchar',1000,0,1,0,0),
 (N'users',N'created_at',N'datetime2',8,6,0,0,1),
 (N'users',N'email',N'nvarchar',510,0,1,0,0),
 (N'users',N'last_login_at',N'datetime2',8,6,1,0,0),
 (N'users',N'locked',N'bit',1,0,0,0,1),
 (N'users',N'locked_at',N'datetime2',8,6,1,0,0),
 (N'users',N'locked_by',N'bigint',8,0,1,0,0),
 (N'users',N'locked_reason',N'nvarchar',1000,0,1,0,0),
 (N'users',N'name',N'nvarchar',510,0,1,0,0),
 (N'users',N'password',N'nvarchar',510,0,1,0,0),
 (N'users',N'provider',N'nvarchar',510,0,1,0,1),
 (N'users',N'provider_id',N'nvarchar',510,0,1,0,0),
 (N'users',N'role',N'nvarchar',510,0,1,0,1),
 (N'users',N'token_version',N'bigint',8,0,0,0,1),
 (N'users',N'updated_at',N'datetime2',8,6,0,0,1),
 (N'admin_user_action_logs',N'id',N'bigint',8,0,0,1,0),
 (N'admin_user_action_logs',N'action',N'varchar',20,0,0,0,0),
 (N'admin_user_action_logs',N'admin_id',N'bigint',8,0,0,0,0),
 (N'admin_user_action_logs',N'created_at',N'datetime2',8,6,0,0,1),
 (N'admin_user_action_logs',N'reason',N'nvarchar',1000,0,1,0,0),
 (N'admin_user_action_logs',N'target_user_id',N'bigint',8,0,0,0,0),
 (N'decks',N'id',N'bigint',8,0,0,1,0),
 (N'decks',N'created_at',N'datetime2',8,6,0,0,1),
 (N'decks',N'deleted',N'bit',1,0,0,0,1),
 (N'decks',N'description',N'nvarchar',-1,0,1,0,0),
 (N'decks',N'name',N'nvarchar',510,0,1,0,0),
 (N'decks',N'owner_id',N'bigint',8,0,1,0,0),
 (N'decks',N'updated_at',N'datetime2',8,6,0,0,1),
 (N'decks',N'visibility',N'varchar',7,0,0,0,1),
 (N'flashcards',N'id',N'bigint',8,0,0,1,0),
 (N'flashcards',N'deck_id',N'bigint',8,0,1,0,0),
 (N'flashcards',N'example_sentence',N'nvarchar',-1,0,1,0,0),
 (N'flashcards',N'meaning',N'nvarchar',510,0,1,0,0),
 (N'flashcards',N'phonetic',N'nvarchar',510,0,1,0,0),
 (N'flashcards',N'vocabulary',N'nvarchar',510,0,1,0,0),
 (N'user_flashcard_reviews',N'id',N'bigint',8,0,0,1,0),
 (N'user_flashcard_reviews',N'ease_factor',N'float',8,0,0,0,1),
 (N'user_flashcard_reviews',N'flashcard_id',N'bigint',8,0,1,0,0),
 (N'user_flashcard_reviews',N'interval_days',N'int',4,0,0,0,1),
 (N'user_flashcard_reviews',N'next_review_date',N'datetime2',8,6,1,0,0),
 (N'user_flashcard_reviews',N'repetition_count',N'int',4,0,0,0,1),
 (N'user_flashcard_reviews',N'user_id',N'bigint',8,0,1,0,0),
 (N'flashcard_study_events',N'id',N'bigint',8,0,0,1,0),
 (N'flashcard_study_events',N'confident_recall',N'bit',1,0,0,0,1),
 (N'flashcard_study_events',N'flashcard_id',N'bigint',8,0,0,0,0),
 (N'flashcard_study_events',N'quality',N'int',4,0,0,0,0),
 (N'flashcard_study_events',N'request_id',N'varchar',36,0,0,0,0),
 (N'flashcard_study_events',N'response_json',N'nvarchar',-1,0,1,0,0),
 (N'flashcard_study_events',N'reviewed_at',N'datetime2',8,6,0,0,1),
 (N'flashcard_study_events',N'user_id',N'bigint',8,0,0,0,0),
 (N'user_weak_vocabularies',N'id',N'bigint',8,0,0,1,0),
 (N'user_weak_vocabularies',N'auto_detected',N'bit',1,0,0,0,1),
 (N'user_weak_vocabularies',N'consecutive_wrong',N'int',4,0,0,0,1),
 (N'user_weak_vocabularies',N'correct_count',N'int',4,0,0,0,1),
 (N'user_weak_vocabularies',N'created_at',N'datetime2',8,6,0,0,1),
 (N'user_weak_vocabularies',N'detection_reason',N'varchar',40,0,1,0,0),
 (N'user_weak_vocabularies',N'first_detected_at',N'datetime2',8,6,1,0,0),
 (N'user_weak_vocabularies',N'flashcard_id',N'bigint',8,0,0,0,0),
 (N'user_weak_vocabularies',N'last_detected_at',N'datetime2',8,6,1,0,0),
 (N'user_weak_vocabularies',N'last_practiced_at',N'datetime2',8,6,1,0,0),
 (N'user_weak_vocabularies',N'last_study_quality',N'int',4,0,1,0,0),
 (N'user_weak_vocabularies',N'manual_marked',N'bit',1,0,0,0,1),
 (N'user_weak_vocabularies',N'mastery_score',N'int',4,0,0,0,1),
 (N'user_weak_vocabularies',N'total_attempts',N'int',4,0,0,0,1),
 (N'user_weak_vocabularies',N'updated_at',N'datetime2',8,6,0,0,1),
 (N'user_weak_vocabularies',N'user_id',N'bigint',8,0,0,0,0),
 (N'user_weak_vocabularies',N'weak_deleted',N'bit',1,0,0,0,1),
 (N'user_weak_vocabularies',N'weak_deleted_at',N'datetime2',8,6,1,0,0),
 (N'user_weak_vocabularies',N'weak_note',N'nvarchar',-1,0,1,0,0),
 (N'user_weak_vocabularies',N'wrong_count',N'int',4,0,0,0,1),
 (N'weak_practice_sessions',N'id',N'bigint',8,0,0,1,0),
 (N'weak_practice_sessions',N'completed_at',N'datetime2',8,6,1,0,0),
 (N'weak_practice_sessions',N'correct_answers',N'int',4,0,0,0,1),
 (N'weak_practice_sessions',N'question_type',N'varchar',255,0,1,0,0),
 (N'weak_practice_sessions',N'started_at',N'datetime2',8,6,1,0,0),
 (N'weak_practice_sessions',N'status',N'varchar',255,0,1,0,1),
 (N'weak_practice_sessions',N'total_questions',N'int',4,0,0,0,1),
 (N'weak_practice_sessions',N'user_id',N'bigint',8,0,0,0,0),
 (N'weak_practice_sessions',N'wrong_answers',N'int',4,0,0,0,1),
 (N'weak_practice_items',N'id',N'bigint',8,0,0,1,0),
 (N'weak_practice_items',N'answered',N'bit',1,0,0,0,1),
 (N'weak_practice_items',N'answered_at',N'datetime2',8,6,1,0,0),
 (N'weak_practice_items',N'correct_answer',N'nvarchar',510,0,1,0,0),
 (N'weak_practice_items',N'item_order',N'int',4,0,0,0,0),
 (N'weak_practice_items',N'options_json',N'nvarchar',-1,0,1,0,0),
 (N'weak_practice_items',N'question_content',N'nvarchar',-1,0,1,0,0),
 (N'weak_practice_items',N'question_type',N'varchar',255,0,1,0,0),
 (N'weak_practice_items',N'session_id',N'bigint',8,0,0,0,0),
 (N'weak_practice_items',N'weak_vocabulary_id',N'bigint',8,0,0,0,0),
 (N'weak_practice_attempts',N'id',N'bigint',8,0,0,1,0),
 (N'weak_practice_attempts',N'attempted_at',N'datetime2',8,6,1,0,1),
 (N'weak_practice_attempts',N'correct',N'bit',1,0,0,0,1),
 (N'weak_practice_attempts',N'correct_answer',N'nvarchar',510,0,1,0,0),
 (N'weak_practice_attempts',N'item_id',N'bigint',8,0,0,0,0),
 (N'weak_practice_attempts',N'question_content',N'nvarchar',-1,0,1,0,0),
 (N'weak_practice_attempts',N'question_type',N'varchar',255,0,1,0,0),
 (N'weak_practice_attempts',N'session_id',N'bigint',8,0,0,0,0),
 (N'weak_practice_attempts',N'user_answer',N'nvarchar',-1,0,1,0,0),
 (N'weak_practice_attempts',N'user_weak_vocabulary_id',N'bigint',8,0,0,0,0),
 (N'ai_generation_gate',N'id',N'bigint',8,0,0,0,0),
 (N'ai_generation_batches',N'id',N'varchar',36,0,0,0,0),
 (N'ai_generation_batches',N'commit_fingerprint',N'varchar',64,0,1,0,0),
 (N'ai_generation_batches',N'commit_json',N'nvarchar',-1,0,1,0,0),
 (N'ai_generation_batches',N'created_at',N'datetime2',8,6,0,0,1),
 (N'ai_generation_batches',N'deck_id',N'bigint',8,0,0,0,0),
 (N'ai_generation_batches',N'expires_at',N'datetime2',8,6,0,0,0),
 (N'ai_generation_batches',N'failure_code',N'varchar',60,0,1,0,0),
 (N'ai_generation_batches',N'failure_status',N'int',4,0,1,0,0),
 (N'ai_generation_batches',N'input_tokens',N'bigint',8,0,1,0,0),
 (N'ai_generation_batches',N'lease_until',N'datetime2',8,6,0,0,0),
 (N'ai_generation_batches',N'output_tokens',N'bigint',8,0,1,0,0),
 (N'ai_generation_batches',N'preview_json',N'nvarchar',-1,0,1,0,0),
 (N'ai_generation_batches',N'prompt_version',N'varchar',40,0,0,0,0),
 (N'ai_generation_batches',N'provider_attempts',N'int',4,0,1,0,0),
 (N'ai_generation_batches',N'request_fingerprint',N'varchar',64,0,0,0,0),
 (N'ai_generation_batches',N'request_id',N'varchar',36,0,0,0,0),
 (N'ai_generation_batches',N'source',N'varchar',20,0,0,0,0),
 (N'ai_generation_batches',N'status',N'varchar',20,0,0,0,0),
 (N'ai_generation_batches',N'user_id',N'bigint',8,0,0,0,0),
 (N'grammar_groups',N'id',N'bigint',8,0,0,1,0),
 (N'grammar_groups',N'author_email',N'nvarchar',510,0,1,0,0),
 (N'grammar_groups',N'author_name',N'nvarchar',510,0,1,0,0),
 (N'grammar_groups',N'created_at',N'datetime2',8,6,1,0,1),
 (N'grammar_groups',N'description',N'nvarchar',-1,0,1,0,0),
 (N'grammar_groups',N'group_key',N'nvarchar',200,0,0,0,0),
 (N'grammar_groups',N'icon',N'nvarchar',100,0,1,0,0),
 (N'grammar_groups',N'title',N'nvarchar',510,0,0,0,0),
 (N'grammar_groups',N'updated_at',N'datetime2',8,6,1,0,1),
 (N'grammar_questions',N'id',N'bigint',8,0,0,1,0),
 (N'grammar_questions',N'correct_token_id',N'int',4,0,1,0,0),
 (N'grammar_questions',N'correction',N'nvarchar',510,0,1,0,0),
 (N'grammar_questions',N'created_at',N'datetime2',8,6,1,0,1),
 (N'grammar_questions',N'error_type',N'nvarchar',510,0,1,0,0),
 (N'grammar_questions',N'explanation',N'nvarchar',-1,0,1,0,0),
 (N'grammar_questions',N'group_id',N'bigint',8,0,1,0,0),
 (N'grammar_questions',N'hint',N'nvarchar',1000,0,1,0,0),
 (N'grammar_questions',N'instruction',N'nvarchar',-1,0,1,0,0),
 (N'grammar_questions',N'payload_json',N'nvarchar',-1,0,1,0,0),
 (N'grammar_questions',N'question_key',N'nvarchar',200,0,1,0,0),
 (N'grammar_questions',N'question_type',N'varchar',50,0,0,0,0),
 (N'grammar_questions',N'title',N'nvarchar',510,0,1,0,0),
 (N'grammar_questions',N'updated_at',N'datetime2',8,6,1,0,1),
 (N'grammar_question_reports',N'id',N'bigint',8,0,0,1,0),
 (N'grammar_question_reports',N'author_email',N'nvarchar',510,0,1,0,0),
 (N'grammar_question_reports',N'author_name',N'nvarchar',510,0,1,0,0),
 (N'grammar_question_reports',N'created_at',N'datetime2',8,6,1,0,1),
 (N'grammar_question_reports',N'description',N'nvarchar',-1,0,1,0,0),
 (N'grammar_question_reports',N'error_type',N'nvarchar',510,0,1,0,0),
 (N'grammar_question_reports',N'group_id',N'bigint',8,0,1,0,0),
 (N'grammar_question_reports',N'question_key',N'nvarchar',200,0,1,0,0),
 (N'grammar_question_reports',N'question_title',N'nvarchar',510,0,1,0,0),
 (N'grammar_question_reports',N'report_key',N'nvarchar',200,0,0,0,0),
 (N'grammar_question_reports',N'reporter_email',N'nvarchar',510,0,1,0,0),
 (N'grammar_question_reports',N'reporter_name',N'nvarchar',510,0,1,0,0),
 (N'grammar_question_reports',N'status',N'nvarchar',100,0,1,0,1);
IF EXISTS(SELECT 1 FROM @ExpectedColumns e LEFT JOIN sys.columns c ON c.object_id=OBJECT_ID(N'dbo.'+e.table_name) AND c.name COLLATE DATABASE_DEFAULT=e.column_name COLLATE DATABASE_DEFAULT
 LEFT JOIN sys.types t ON t.user_type_id=c.user_type_id
 WHERE c.column_id IS NULL OR t.name COLLATE DATABASE_DEFAULT<>e.type_name COLLATE DATABASE_DEFAULT OR c.max_length<>e.max_length OR c.scale<>e.scale_value
 OR c.is_nullable<>e.nullable OR c.is_identity<>e.identity_value OR CASE WHEN c.default_object_id=0 THEN 0 ELSE 1 END<>e.has_default)
 OR (SELECT COUNT(*) FROM @ExpectedColumns)<>(SELECT COUNT(*) FROM sys.columns c JOIN sys.tables t ON t.object_id=c.object_id WHERE t.schema_id=SCHEMA_ID(N'dbo') AND t.is_ms_shipped=0 AND EXISTS(SELECT 1 FROM @ExpectedTables e WHERE t.name COLLATE DATABASE_DEFAULT=e.name COLLATE DATABASE_DEFAULT))
 THROW 51101,'Column type, length, scale, nullability, identity or default mismatch.',1;
DECLARE @ExpectedConstraints TABLE(table_name SYSNAME,name SYSNAME PRIMARY KEY,type_code CHAR(2));
INSERT @ExpectedConstraints VALUES
 (N'users',N'PK_users','PK'),
 (N'users',N'UQ_users_auth_identity','UQ'),
 (N'users',N'FK_users_locked_by','F'),
 (N'users',N'CK_users_role','C'),
 (N'users',N'CK_users_provider','C'),
 (N'users',N'CK_users_token_version','C'),
 (N'admin_user_action_logs',N'PK_admin_user_action_logs','PK'),
 (N'admin_user_action_logs',N'FK_admin_logs_admin','F'),
 (N'admin_user_action_logs',N'FK_admin_logs_target','F'),
 (N'admin_user_action_logs',N'CK_admin_logs_action','C'),
 (N'decks',N'PK_decks','PK'),
 (N'decks',N'FK_decks_owner','F'),
 (N'decks',N'CK_decks_visibility','C'),
 (N'flashcards',N'PK_flashcards','PK'),
 (N'flashcards',N'FK_flashcards_deck','F'),
 (N'user_flashcard_reviews',N'PK_user_flashcard_reviews','PK'),
 (N'user_flashcard_reviews',N'FK_reviews_user','F'),
 (N'user_flashcard_reviews',N'FK_reviews_flashcard','F'),
 (N'user_flashcard_reviews',N'UQ_review_user_card','UQ'),
 (N'user_flashcard_reviews',N'CK_review_counters','C'),
 (N'flashcard_study_events',N'PK_flashcard_study_events','PK'),
 (N'flashcard_study_events',N'FK_study_event_user','F'),
 (N'flashcard_study_events',N'FK_study_event_flashcard','F'),
 (N'flashcard_study_events',N'UQ_study_event_user_request','UQ'),
 (N'flashcard_study_events',N'CK_study_event_quality','C'),
 (N'flashcard_study_events',N'CK_study_event_confident','C'),
 (N'flashcard_study_events',N'CK_flashcard_study_events_response_json','C'),
 (N'user_weak_vocabularies',N'PK_user_weak_vocabularies','PK'),
 (N'user_weak_vocabularies',N'FK_weak_user','F'),
 (N'user_weak_vocabularies',N'FK_weak_flashcard','F'),
 (N'user_weak_vocabularies',N'UQ_weak_user_flashcard','UQ'),
 (N'user_weak_vocabularies',N'CK_weak_mastery','C'),
 (N'user_weak_vocabularies',N'CK_weak_counters','C'),
 (N'user_weak_vocabularies',N'CK_weak_quality','C'),
 (N'user_weak_vocabularies',N'CK_weak_reason','C'),
 (N'user_weak_vocabularies',N'CK_weak_detection_dates','C'),
 (N'weak_practice_sessions',N'PK_weak_practice_sessions','PK'),
 (N'weak_practice_sessions',N'FK_session_user','F'),
 (N'weak_practice_sessions',N'CK_weak_practice_sessions_type','C'),
 (N'weak_practice_sessions',N'CK_session_status','C'),
 (N'weak_practice_sessions',N'CK_session_counters','C'),
 (N'weak_practice_items',N'PK_weak_practice_items','PK'),
 (N'weak_practice_items',N'FK_item_session','F'),
 (N'weak_practice_items',N'FK_item_weak','F'),
 (N'weak_practice_items',N'UQ_practice_item_order','UQ'),
 (N'weak_practice_items',N'CK_weak_practice_items_type','C'),
 (N'weak_practice_items',N'CK_item_order','C'),
 (N'weak_practice_items',N'CK_weak_practice_items_options_json','C'),
 (N'weak_practice_attempts',N'PK_weak_practice_attempts','PK'),
 (N'weak_practice_attempts',N'FK_attempt_session','F'),
 (N'weak_practice_attempts',N'FK_attempt_item','F'),
 (N'weak_practice_attempts',N'FK_attempt_weak','F'),
 (N'weak_practice_attempts',N'UQ_practice_attempt_item','UQ'),
 (N'weak_practice_attempts',N'CK_weak_practice_attempts_type','C'),
 (N'ai_generation_gate',N'PK_ai_generation_gate','PK'),
 (N'ai_generation_gate',N'CK_ai_gate_singleton','C'),
 (N'ai_generation_batches',N'PK_ai_generation_batches','PK'),
 (N'ai_generation_batches',N'FK_ai_batch_user','F'),
 (N'ai_generation_batches',N'FK_ai_batch_deck','F'),
 (N'ai_generation_batches',N'UQ_ai_user_request','UQ'),
 (N'ai_generation_batches',N'CK_ai_source','C'),
 (N'ai_generation_batches',N'CK_ai_status','C'),
 (N'ai_generation_batches',N'CK_ai_usage','C'),
 (N'ai_generation_batches',N'CK_ai_expiry','C'),
 (N'ai_generation_batches',N'CK_ai_generation_batches_preview_json','C'),
 (N'ai_generation_batches',N'CK_ai_generation_batches_commit_json','C'),
 (N'grammar_groups',N'PK_grammar_groups','PK'),
 (N'grammar_groups',N'UQ_grammar_group_key','UQ'),
 (N'grammar_questions',N'PK_grammar_questions','PK'),
 (N'grammar_questions',N'FK_questions_group','F'),
 (N'grammar_questions',N'CK_grammar_questions_payload_json','C'),
 (N'grammar_question_reports',N'PK_grammar_question_reports','PK'),
 (N'grammar_question_reports',N'FK_reports_group','F'),
 (N'grammar_question_reports',N'UQ_grammar_report_key','UQ');
IF EXISTS(SELECT 1 FROM @ExpectedConstraints e LEFT JOIN sys.objects o ON o.parent_object_id=OBJECT_ID(N'dbo.'+e.table_name) AND o.name COLLATE DATABASE_DEFAULT=e.name COLLATE DATABASE_DEFAULT AND o.type COLLATE DATABASE_DEFAULT=e.type_code COLLATE DATABASE_DEFAULT WHERE o.object_id IS NULL)
 OR EXISTS(SELECT 1 FROM sys.foreign_keys f WHERE (is_disabled=1 OR is_not_trusted=1) AND EXISTS(SELECT 1 FROM @ExpectedTables e WHERE f.parent_object_id=OBJECT_ID(N'dbo.'+e.name)))
 OR EXISTS(SELECT 1 FROM sys.check_constraints c WHERE (is_disabled=1 OR is_not_trusted=1) AND EXISTS(SELECT 1 FROM @ExpectedTables e WHERE c.parent_object_id=OBJECT_ID(N'dbo.'+e.name)))
 THROW 51102,'Missing, disabled or untrusted constraints.',1;
-- Constraint names alone cannot detect the legacy CK_ai_source that rejected GEMINI.
DECLARE @AiSourceCheck NVARCHAR(MAX)=COALESCE(OBJECT_DEFINITION(OBJECT_ID(N'dbo.CK_ai_source')),N'');
DECLARE @AiStatusCheck NVARCHAR(MAX)=COALESCE(OBJECT_DEFINITION(OBJECT_ID(N'dbo.CK_ai_status')),N'');
IF EXISTS(SELECT 1 FROM (VALUES(N'''OPENAI'''),(N'''GEMINI'''),(N'''DEMO_LIBRARY''')) required(value)
    WHERE CHARINDEX(required.value,@AiSourceCheck)=0)
 THROW 51117,'AI source CHECK does not include all current providers.',1;
IF EXISTS(SELECT 1 FROM (VALUES(N'''PENDING'''),(N'''READY'''),(N'''FAILED'''),(N'''EXPIRED'''),(N'''COMMITTED''')) required(value)
    WHERE CHARINDEX(required.value,@AiStatusCheck)=0)
 THROW 51118,'AI status CHECK does not include all current batch states.',1;
DECLARE @ExpectedIndexes TABLE(table_name SYSNAME,name SYSNAME,unique_value BIT,filtered BIT,PRIMARY KEY(table_name,name));
INSERT @ExpectedIndexes VALUES
 (N'users',N'UX_users_email',1,1),
 (N'users',N'UX_users_google_subject',1,1),
 (N'users',N'IX_users_admin_search',0,0),
 (N'users',N'IX_users_locked_by',0,1),
 (N'admin_user_action_logs',N'IX_admin_logs_created',0,0),
 (N'admin_user_action_logs',N'IX_admin_logs_target',0,0),
 (N'admin_user_action_logs',N'IX_admin_logs_admin',0,0),
 (N'decks',N'IX_decks_public',0,0),
 (N'decks',N'IX_decks_owner',0,0),
 (N'flashcards',N'IX_flashcards_deck',0,0),
 (N'user_flashcard_reviews',N'IX_reviews_due',0,0),
 (N'flashcard_study_events',N'IX_study_event_history',0,0),
 (N'flashcard_study_events',N'IX_study_event_card',0,0),
 (N'user_weak_vocabularies',N'IX_weak_user_active',0,0),
 (N'user_weak_vocabularies',N'IX_weak_flashcard',0,0),
 (N'weak_practice_sessions',N'IX_sessions_user',0,0),
 (N'weak_practice_items',N'IX_items_weak',0,0),
 (N'weak_practice_attempts',N'IX_attempts_weak',0,0),
 (N'weak_practice_attempts',N'IX_attempts_session',0,0),
 (N'ai_generation_batches',N'IX_ai_created',0,0),
 (N'ai_generation_batches',N'IX_ai_user_created',0,0),
 (N'ai_generation_batches',N'IX_ai_pending',0,0),
 (N'ai_generation_batches',N'IX_ai_expiry',0,0),
 (N'ai_generation_batches',N'IX_ai_deck',0,0),
 (N'grammar_questions',N'IX_grammar_questions_group',0,0),
 (N'grammar_questions',N'IX_grammar_questions_key',0,1),
 (N'grammar_question_reports',N'IX_grammar_reports_group',0,0),
 (N'grammar_question_reports',N'IX_grammar_reports_author',0,0);
IF EXISTS(SELECT 1 FROM @ExpectedIndexes e LEFT JOIN sys.indexes i ON i.object_id=OBJECT_ID(N'dbo.'+e.table_name) AND i.name COLLATE DATABASE_DEFAULT=e.name COLLATE DATABASE_DEFAULT
 WHERE i.index_id IS NULL OR i.is_disabled=1 OR i.is_unique<>e.unique_value OR i.has_filter<>e.filtered)
 THROW 51103,'Missing or invalid query indexes.',1;
-- Validate every FK against actual rows (including nullable/self references).
IF EXISTS(SELECT 1 FROM dbo.users child LEFT JOIN dbo.users parent ON parent.id=child.locked_by WHERE child.locked_by IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: users.locked_by.',1;
IF EXISTS(SELECT 1 FROM dbo.admin_user_action_logs child LEFT JOIN dbo.users parent ON parent.id=child.admin_id WHERE child.admin_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: admin_user_action_logs.admin_id.',1;
IF EXISTS(SELECT 1 FROM dbo.admin_user_action_logs child LEFT JOIN dbo.users parent ON parent.id=child.target_user_id WHERE child.target_user_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: admin_user_action_logs.target_user_id.',1;
IF EXISTS(SELECT 1 FROM dbo.decks child LEFT JOIN dbo.users parent ON parent.id=child.owner_id WHERE child.owner_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: decks.owner_id.',1;
IF EXISTS(SELECT 1 FROM dbo.flashcards child LEFT JOIN dbo.decks parent ON parent.id=child.deck_id WHERE child.deck_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: flashcards.deck_id.',1;
IF EXISTS(SELECT 1 FROM dbo.user_flashcard_reviews child LEFT JOIN dbo.users parent ON parent.id=child.user_id WHERE child.user_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: user_flashcard_reviews.user_id.',1;
IF EXISTS(SELECT 1 FROM dbo.user_flashcard_reviews child LEFT JOIN dbo.flashcards parent ON parent.id=child.flashcard_id WHERE child.flashcard_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: user_flashcard_reviews.flashcard_id.',1;
IF EXISTS(SELECT 1 FROM dbo.flashcard_study_events child LEFT JOIN dbo.users parent ON parent.id=child.user_id WHERE child.user_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: flashcard_study_events.user_id.',1;
IF EXISTS(SELECT 1 FROM dbo.flashcard_study_events child LEFT JOIN dbo.flashcards parent ON parent.id=child.flashcard_id WHERE child.flashcard_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: flashcard_study_events.flashcard_id.',1;
IF EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies child LEFT JOIN dbo.users parent ON parent.id=child.user_id WHERE child.user_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: user_weak_vocabularies.user_id.',1;
IF EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies child LEFT JOIN dbo.flashcards parent ON parent.id=child.flashcard_id WHERE child.flashcard_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: user_weak_vocabularies.flashcard_id.',1;
IF EXISTS(SELECT 1 FROM dbo.weak_practice_sessions child LEFT JOIN dbo.users parent ON parent.id=child.user_id WHERE child.user_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: weak_practice_sessions.user_id.',1;
IF EXISTS(SELECT 1 FROM dbo.weak_practice_items child LEFT JOIN dbo.weak_practice_sessions parent ON parent.id=child.session_id WHERE child.session_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: weak_practice_items.session_id.',1;
IF EXISTS(SELECT 1 FROM dbo.weak_practice_items child LEFT JOIN dbo.user_weak_vocabularies parent ON parent.id=child.weak_vocabulary_id WHERE child.weak_vocabulary_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: weak_practice_items.weak_vocabulary_id.',1;
IF EXISTS(SELECT 1 FROM dbo.weak_practice_attempts child LEFT JOIN dbo.weak_practice_sessions parent ON parent.id=child.session_id WHERE child.session_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: weak_practice_attempts.session_id.',1;
IF EXISTS(SELECT 1 FROM dbo.weak_practice_attempts child LEFT JOIN dbo.weak_practice_items parent ON parent.id=child.item_id WHERE child.item_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: weak_practice_attempts.item_id.',1;
IF EXISTS(SELECT 1 FROM dbo.weak_practice_attempts child LEFT JOIN dbo.user_weak_vocabularies parent ON parent.id=child.user_weak_vocabulary_id WHERE child.user_weak_vocabulary_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: weak_practice_attempts.user_weak_vocabulary_id.',1;
IF EXISTS(SELECT 1 FROM dbo.ai_generation_batches child LEFT JOIN dbo.users parent ON parent.id=child.user_id WHERE child.user_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: ai_generation_batches.user_id.',1;
IF EXISTS(SELECT 1 FROM dbo.ai_generation_batches child LEFT JOIN dbo.decks parent ON parent.id=child.deck_id WHERE child.deck_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: ai_generation_batches.deck_id.',1;
IF EXISTS(SELECT 1 FROM dbo.grammar_questions child LEFT JOIN dbo.grammar_groups parent ON parent.id=child.group_id WHERE child.group_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: grammar_questions.group_id.',1;
IF EXISTS(SELECT 1 FROM dbo.grammar_question_reports child LEFT JOIN dbo.grammar_groups parent ON parent.id=child.group_id WHERE child.group_id IS NOT NULL AND parent.id IS NULL) THROW 51104,'Orphan reference: grammar_question_reports.group_id.',1;
DECLARE @Counts TABLE(table_name SYSNAME PRIMARY KEY,actual_rows BIGINT);
INSERT @Counts
SELECT N'users',COUNT_BIG(*) FROM dbo.users
UNION ALL
SELECT N'admin_user_action_logs',COUNT_BIG(*) FROM dbo.admin_user_action_logs
UNION ALL
SELECT N'decks',COUNT_BIG(*) FROM dbo.decks
UNION ALL
SELECT N'flashcards',COUNT_BIG(*) FROM dbo.flashcards
UNION ALL
SELECT N'user_flashcard_reviews',COUNT_BIG(*) FROM dbo.user_flashcard_reviews
UNION ALL
SELECT N'flashcard_study_events',COUNT_BIG(*) FROM dbo.flashcard_study_events
UNION ALL
SELECT N'user_weak_vocabularies',COUNT_BIG(*) FROM dbo.user_weak_vocabularies
UNION ALL
SELECT N'weak_practice_sessions',COUNT_BIG(*) FROM dbo.weak_practice_sessions
UNION ALL
SELECT N'weak_practice_items',COUNT_BIG(*) FROM dbo.weak_practice_items
UNION ALL
SELECT N'weak_practice_attempts',COUNT_BIG(*) FROM dbo.weak_practice_attempts
UNION ALL
SELECT N'ai_generation_gate',COUNT_BIG(*) FROM dbo.ai_generation_gate
UNION ALL
SELECT N'ai_generation_batches',COUNT_BIG(*) FROM dbo.ai_generation_batches
UNION ALL
SELECT N'grammar_groups',COUNT_BIG(*) FROM dbo.grammar_groups
UNION ALL
SELECT N'grammar_questions',COUNT_BIG(*) FROM dbo.grammar_questions
UNION ALL
SELECT N'grammar_question_reports',COUNT_BIG(*) FROM dbo.grammar_question_reports;
IF EXISTS(SELECT 1 FROM @ExpectedTables e JOIN @Counts c ON c.table_name=e.name WHERE c.actual_rows<>e.expected_rows)
 THROW 51105,'Unexpected demo record counts.',1;
IF EXISTS(SELECT 1 FROM dbo.users WHERE token_version<>0 OR provider<>N'LOCAL' OR demo_account<>1 OR password IS NULL)
 OR (SELECT COUNT(*) FROM dbo.users WHERE email=N'admin@studye.test' AND role=N'ROLE_ADMIN' AND locked=0)<>1
 OR (SELECT COUNT(*) FROM dbo.users WHERE email IN(N'learner1@studye.test',N'learner2@studye.test') AND role=N'ROLE_USER' AND locked=0)<>2
 OR (SELECT COUNT(*) FROM dbo.users WHERE email=N'locked@studye.test' AND role=N'ROLE_USER' AND locked=1)<>1
 OR EXISTS(SELECT 1 FROM dbo.decks WHERE owner_id IS NULL OR owner_id<>@DemoUser OR deleted<>0)
 OR (SELECT COUNT(*) FROM dbo.decks WHERE visibility='PUBLIC')<>3
 THROW 51106,'Unsafe demo account or invalid deck ownership/visibility.',1;
IF EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies WHERE total_attempts<>correct_count+wrong_count
 OR total_attempts<0 OR correct_count<0 OR wrong_count<0 OR consecutive_wrong<0 OR consecutive_wrong>wrong_count
 OR mastery_score NOT BETWEEN 0 AND 100 OR (manual_marked=0 AND auto_detected=0)
 OR detection_reason IS NULL OR (auto_detected=0 AND detection_reason<>'MANUAL_MARK')
 OR (auto_detected=1 AND detection_reason='MANUAL_MARK')
 OR (weak_deleted=1 AND weak_deleted_at IS NULL) OR (weak_deleted=0 AND weak_deleted_at IS NOT NULL)
 OR last_study_quality IS NOT NULL OR created_at>updated_at OR last_practiced_at>@Now
 OR (first_detected_at IS NOT NULL AND (last_detected_at IS NULL OR first_detected_at>last_detected_at)))
 THROW 51107,'Inconsistent weak counters, source, dates or metadata.',1;
IF (SELECT COUNT(*) FROM dbo.user_weak_vocabularies WHERE weak_deleted=0)<>70
 OR (SELECT COUNT(*) FROM dbo.user_weak_vocabularies WHERE manual_marked=1 AND auto_detected=0)<>30
 OR (SELECT COUNT(*) FROM dbo.user_weak_vocabularies WHERE manual_marked=0 AND auto_detected=1)<>10
 OR (SELECT COUNT(*) FROM dbo.user_weak_vocabularies WHERE manual_marked=1 AND auto_detected=1)<>40
 THROW 51108,'Missing source or soft-delete seed coverage.',1;
IF EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies GROUP BY user_id,flashcard_id HAVING COUNT_BIG(*)>1)
 OR EXISTS(SELECT 1 FROM dbo.user_flashcard_reviews GROUP BY user_id,flashcard_id HAVING COUNT_BIG(*)>1)
 OR EXISTS(SELECT 1 FROM dbo.flashcard_study_events GROUP BY user_id,request_id HAVING COUNT_BIG(*)>1)
 OR EXISTS(SELECT 1 FROM dbo.ai_generation_batches GROUP BY user_id,request_id HAVING COUNT_BIG(*)>1)
 OR EXISTS(SELECT 1 FROM dbo.weak_practice_attempts GROUP BY item_id HAVING COUNT_BIG(*)>1)
 THROW 51109,'Duplicate learning state or idempotency key.',1;
-- Independently calculated expected state for the eight ten-word profiles.
DECLARE @ExpectedState TABLE(profile_id INT PRIMARY KEY,total INT,correct INT,wrong INT,streak INT,mastery INT,reason VARCHAR(40));
INSERT @ExpectedState VALUES (1,0,0,0,0,0,'MANUAL_MARK'),(2,3,3,0,0,60,'MANUAL_MARK'),
 (3,2,0,2,2,0,'PRACTICE_CONSECUTIVE_WRONG'),(4,3,1,2,1,0,'PRACTICE_LOW_ACCURACY'),
 (5,4,2,2,0,40,'PRACTICE_LOW_ACCURACY'),(6,5,5,0,0,100,'LEGACY_AUTO'),
 (7,4,4,0,0,80,'MANUAL_MARK'),(8,5,3,2,2,20,'PRACTICE_CONSECUTIVE_WRONG');
IF EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies u JOIN @CardIds c ON c.id=u.flashcard_id JOIN @Words w ON w.word=c.word JOIN @ExpectedState e ON e.profile_id=w.profile_id
 WHERE u.total_attempts<>e.total OR u.correct_count<>e.correct OR u.wrong_count<>e.wrong OR u.consecutive_wrong<>e.streak OR u.mastery_score<>e.mastery OR u.detection_reason<>e.reason)
 THROW 51110,'Practice replay does not match the expected final state.',1;
IF EXISTS(SELECT 1 FROM dbo.user_weak_vocabularies u OUTER APPLY(
 SELECT COUNT_BIG(*) AS total,COALESCE(SUM(CONVERT(INT,a.correct)),0) AS correct,MAX(a.attempted_at) AS last_at
 FROM dbo.weak_practice_attempts a WHERE a.user_weak_vocabulary_id=u.id) s
 WHERE u.total_attempts<>s.total OR u.correct_count<>s.correct OR u.wrong_count<>s.total-s.correct
 OR (s.total=0 AND u.last_practiced_at IS NOT NULL) OR (s.total>0 AND (u.last_practiced_at IS NULL OR u.last_practiced_at<>s.last_at))
 OR (u.weak_deleted=1 AND u.weak_deleted_at<=s.last_at))
 THROW 51111,'Weak counters disagree with practice history.',1;
IF EXISTS(SELECT 1 FROM dbo.weak_practice_sessions s OUTER APPLY(SELECT COUNT_BIG(*) total FROM dbo.weak_practice_items i WHERE i.session_id=s.id)i
 OUTER APPLY(SELECT COUNT_BIG(*) total,COALESCE(SUM(CONVERT(INT,a.correct)),0) correct FROM dbo.weak_practice_attempts a WHERE a.session_id=s.id)a
 WHERE s.status<>'COMPLETED' OR s.total_questions<>i.total OR s.total_questions<>a.total OR s.correct_answers<>a.correct
 OR s.wrong_answers<>a.total-a.correct OR s.started_at IS NULL OR s.completed_at IS NULL OR s.completed_at<s.started_at OR s.completed_at>@Now)
 THROW 51112,'Practice session totals or timestamps disagree.',1;
IF EXISTS(SELECT 1 FROM dbo.weak_practice_attempts a JOIN dbo.weak_practice_items i ON i.id=a.item_id
 JOIN dbo.weak_practice_sessions s ON s.id=a.session_id JOIN dbo.user_weak_vocabularies u ON u.id=a.user_weak_vocabulary_id
 WHERE a.session_id<>i.session_id OR a.user_weak_vocabulary_id<>i.weak_vocabulary_id OR s.user_id<>u.user_id
 OR i.answered<>1 OR i.answered_at IS NULL OR i.answered_at<>a.attempted_at OR a.attempted_at<s.started_at OR a.attempted_at>s.completed_at
 OR a.question_type<>i.question_type OR a.correct_answer<>i.correct_answer OR a.question_content<>i.question_content
 OR (a.correct=1 AND a.user_answer<>a.correct_answer) OR (a.correct=0 AND a.user_answer=a.correct_answer))
 OR EXISTS(SELECT 1 FROM dbo.weak_practice_items i LEFT JOIN dbo.weak_practice_attempts a ON a.item_id=i.id WHERE a.id IS NULL)
 THROW 51113,'Practice answer snapshots, ownership or item relationships disagree.',1;
IF EXISTS(SELECT 1 FROM dbo.grammar_questions WHERE payload_json IS NULL OR ISJSON(payload_json)<>1)
 OR EXISTS(SELECT 1 FROM dbo.weak_practice_items WHERE options_json IS NOT NULL AND ISJSON(options_json)<>1)
 OR EXISTS(SELECT 1 FROM dbo.flashcard_study_events WHERE response_json IS NOT NULL AND ISJSON(response_json)<>1)
 OR EXISTS(SELECT 1 FROM dbo.ai_generation_batches WHERE (preview_json IS NOT NULL AND ISJSON(preview_json)<>1) OR (commit_json IS NOT NULL AND ISJSON(commit_json)<>1))
 THROW 51114,'Malformed JSON.',1;
IF (SELECT COUNT(DISTINCT question_type) FROM dbo.grammar_questions)<>8
 OR EXISTS(SELECT 1 FROM dbo.grammar_questions q CROSS APPLY OPENJSON(q.payload_json,'$.blanks') b
 WHERE JSON_VALUE(b.value,'$.correct_answer') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM OPENJSON(b.value,'$.options') opt WHERE opt.value=JSON_VALUE(b.value,'$.correct_answer')))
 OR EXISTS(SELECT 1 FROM dbo.grammar_questions q WHERE JSON_VALUE(q.payload_json,'$.correct_answer') IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM OPENJSON(q.payload_json,'$.options') opt WHERE opt.value=JSON_VALUE(q.payload_json,'$.correct_answer')))
 OR EXISTS(SELECT 1 FROM dbo.grammar_questions q CROSS APPLY OPENJSON(q.payload_json,'$.sub_questions') sub
 WHERE JSON_VALUE(sub.value,'$.correct_answer') IS NULL OR NOT EXISTS(
 SELECT 1 FROM OPENJSON(sub.value,'$.options') opt WHERE opt.value=JSON_VALUE(sub.value,'$.correct_answer')))
 THROW 51115,'Grammar seed coverage or answer options invalid.',1;
IF EXISTS(SELECT 1 FROM dbo.flashcards WHERE vocabulary IS NULL OR meaning IS NULL OR example_sentence IS NULL OR CHARINDEX(vocabulary,example_sentence)=0)
 THROW 51116,'Missing vocabulary meanings or usable example sentences.',1;
COMMIT TRANSACTION;
SELECT DB_NAME() AS database_name,N'COMMITTED' AS reset_status;
SELECT email,role,locked AS is_locked FROM dbo.users ORDER BY email;
SELECT c.table_name,c.actual_rows,e.expected_rows FROM @Counts c JOIN @ExpectedTables e ON e.name=c.table_name ORDER BY c.table_name;
SELECT CASE WHEN manual_marked=1 AND auto_detected=1 THEN 'BOTH' WHEN auto_detected=1 THEN 'AUTO' ELSE 'MANUAL' END AS detection_source,
 weak_deleted,COUNT(*) AS weak_rows,MIN(mastery_score) AS min_mastery,MAX(mastery_score) AS max_mastery
FROM dbo.user_weak_vocabularies GROUP BY manual_marked,auto_detected,weak_deleted;
SELECT (SELECT COUNT(*) FROM @ExpectedColumns) AS verified_columns,(SELECT COUNT(*) FROM @ExpectedConstraints) AS verified_constraints,
 (SELECT COUNT(*) FROM @ExpectedIndexes) AS verified_query_indexes;
PRINT 'SUCCESS: demo_db application tables rebuilt; all structure and seed acceptance checks passed.';
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
 THROW;
END CATCH;
GO
-- Catch a batch compilation failure that bypassed TRY/CATCH. Never leave a reset open.
IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRANSACTION;
    THROW 51117,'Reset was not committed; previous tables were restored. Review preceding errors.',1;
END;
GO
