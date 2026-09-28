-- DEVELOPMENT / DEMO ONLY. Run manually after Flyway V1 and V2 have completed.
INSERT INTO users (email, password_hash, full_name)
VALUES ('demo@evms.local', 'DEMO_NOT_FOR_LOGIN', 'EVMS Demo User')
ON CONFLICT ((LOWER(email))) DO NOTHING;

INSERT INTO vocabularies (word, normalized_word, cefr_level) VALUES
  ('abandon', 'abandon', 'B2'), ('maintain', 'maintain', 'B2'), ('significant', 'significant', 'B2'),
  ('achieve', 'achieve', 'B1'), ('environment', 'environment', 'B1')
ON CONFLICT (normalized_word) DO NOTHING;

INSERT INTO vocabulary_senses (vocabulary_id, part_of_speech, meaning_vi, pronunciation)
SELECT id, 'verb', 'từ bỏ', '/əˈbændən/' FROM vocabularies WHERE normalized_word = 'abandon'
ON CONFLICT (vocabulary_id, sense_order) DO NOTHING;
INSERT INTO vocabulary_senses (vocabulary_id, part_of_speech, meaning_vi, pronunciation)
SELECT id, 'verb', 'duy trì', '/meɪnˈteɪn/' FROM vocabularies WHERE normalized_word = 'maintain'
ON CONFLICT (vocabulary_id, sense_order) DO NOTHING;
INSERT INTO vocabulary_senses (vocabulary_id, part_of_speech, meaning_vi, pronunciation)
SELECT id, 'adjective', 'quan trọng, đáng kể', '/sɪɡˈnɪfɪkənt/' FROM vocabularies WHERE normalized_word = 'significant'
ON CONFLICT (vocabulary_id, sense_order) DO NOTHING;
INSERT INTO vocabulary_senses (vocabulary_id, part_of_speech, meaning_vi) SELECT id, 'verb', 'đạt được' FROM vocabularies WHERE normalized_word = 'achieve' ON CONFLICT (vocabulary_id, sense_order) DO NOTHING;
INSERT INTO vocabulary_senses (vocabulary_id, part_of_speech, meaning_vi) SELECT id, 'noun', 'môi trường' FROM vocabularies WHERE normalized_word = 'environment' ON CONFLICT (vocabulary_id, sense_order) DO NOTHING;

INSERT INTO vocabulary_examples (sense_id, example_text)
SELECT s.id, 'They decided to abandon the old plan.' FROM vocabulary_senses s JOIN vocabularies v ON v.id=s.vocabulary_id WHERE v.normalized_word='abandon'
ON CONFLICT (sense_id, example_order) DO NOTHING;
INSERT INTO vocabulary_examples (sense_id, example_text)
SELECT s.id, 'It is difficult to maintain good habits.' FROM vocabulary_senses s JOIN vocabularies v ON v.id=s.vocabulary_id WHERE v.normalized_word='maintain'
ON CONFLICT (sense_id, example_order) DO NOTHING;
INSERT INTO vocabulary_examples (sense_id, example_text)
SELECT s.id, 'The change is significant for the project.' FROM vocabulary_senses s JOIN vocabularies v ON v.id=s.vocabulary_id WHERE v.normalized_word='significant'
ON CONFLICT (sense_id, example_order) DO NOTHING;
INSERT INTO vocabulary_examples (sense_id, example_text)
SELECT s.id, 'She worked hard to achieve her goal.' FROM vocabulary_senses s JOIN vocabularies v ON v.id=s.vocabulary_id WHERE v.normalized_word='achieve'
ON CONFLICT (sense_id, example_order) DO NOTHING;
INSERT INTO vocabulary_examples (sense_id, example_text)
SELECT s.id, 'A clean environment benefits everyone.' FROM vocabulary_senses s JOIN vocabularies v ON v.id=s.vocabulary_id WHERE v.normalized_word='environment'
ON CONFLICT (sense_id, example_order) DO NOTHING;

INSERT INTO user_vocabularies (user_id, vocabulary_id, learning_status, mastery_score, total_attempts, correct_count, wrong_count, consecutive_wrong)
SELECT u.id, v.id, CASE v.normalized_word WHEN 'abandon' THEN 'WEAK' WHEN 'maintain' THEN 'WEAK' WHEN 'significant' THEN 'WEAK' WHEN 'achieve' THEN 'LEARNING' ELSE 'MASTERED' END,
  CASE v.normalized_word WHEN 'abandon' THEN 20 WHEN 'maintain' THEN 40 WHEN 'significant' THEN 50 WHEN 'achieve' THEN 60 ELSE 80 END,
  CASE WHEN v.normalized_word='abandon' THEN 5 ELSE 0 END, CASE WHEN v.normalized_word='abandon' THEN 1 ELSE 0 END,
  CASE WHEN v.normalized_word='abandon' THEN 4 ELSE 0 END, CASE WHEN v.normalized_word='abandon' THEN 2 ELSE 0 END
FROM users u CROSS JOIN vocabularies v WHERE u.email='demo@evms.local' AND v.normalized_word IN ('abandon','maintain','significant','achieve','environment')
ON CONFLICT (user_id, vocabulary_id) DO NOTHING;
