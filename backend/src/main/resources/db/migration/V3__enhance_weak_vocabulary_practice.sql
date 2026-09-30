ALTER TABLE user_vocabularies
    ADD COLUMN weak_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN weak_deleted_at TIMESTAMPTZ,
    ADD COLUMN weak_note TEXT;

ALTER TABLE review_session_items
    ADD COLUMN options_json TEXT;

CREATE INDEX idx_user_vocabularies_weak_visible
    ON user_vocabularies (user_id, learning_status)
    WHERE weak_deleted = FALSE;
