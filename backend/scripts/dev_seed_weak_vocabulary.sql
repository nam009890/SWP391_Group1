-- Development/test seed only. It does not run through Flyway.
-- Creates 90 idempotent weak-vocabulary records for existing demo user ID 1.
WITH demo_words(word) AS (
    SELECT unnest(ARRAY[
        'abandon','ability','achieve','adapt','adequate','advantage','affect','alternative','analyze','approach',
        'appropriate','assume','attempt','aware','benefit','challenge','circumstance','combine','communicate','compare',
        'complex','concentrate','consequence','consider','consistent','consume','context','contribute','convince','decline',
        'define','demonstrate','determine','develop','efficient','emphasize','encourage','environment','establish','estimate',
        'evaluate','evidence','expand','factor','feature','focus','function','generate','identify','impact',
        'improve','indicate','influence','maintain','major','method','occur','participate','perform','prevent',
        'principle','process','require','respond','significant','similar','specific','strategy','structure','sufficient',
        'support','tendency','theory','transfer','vary','access','account','apply','available','create',
        'culture','demand','design','effect','enable','increase','individual','issue','manage','research'
    ]::text[])
), numbered AS (
    SELECT word, row_number() OVER (ORDER BY word) AS n FROM demo_words
), inserted_vocabularies AS (
    INSERT INTO vocabularies (word, normalized_word, cefr_level)
    SELECT word, lower(word), (ARRAY['A1','A2','B1','B2','C1'])[1 + ((n - 1) % 5)]
    FROM numbered
    ON CONFLICT (normalized_word) DO NOTHING
)
INSERT INTO vocabulary_senses (vocabulary_id, part_of_speech, meaning_vi, pronunciation, sense_order)
SELECT v.id,
       (ARRAY['noun','verb','adjective','adverb','preposition'])[1 + ((numbered.n - 1) % 5)],
       'Nghĩa tiếng Việt minh họa của "' || numbered.word || '"',
       '/' || numbered.word || '/', 1
FROM numbered
JOIN vocabularies v ON v.normalized_word = numbered.word
ON CONFLICT (vocabulary_id, sense_order) DO NOTHING;

WITH demo_words(word) AS (
    SELECT unnest(ARRAY[
        'abandon','ability','achieve','adapt','adequate','advantage','affect','alternative','analyze','approach',
        'appropriate','assume','attempt','aware','benefit','challenge','circumstance','combine','communicate','compare',
        'complex','concentrate','consequence','consider','consistent','consume','context','contribute','convince','decline',
        'define','demonstrate','determine','develop','efficient','emphasize','encourage','environment','establish','estimate',
        'evaluate','evidence','expand','factor','feature','focus','function','generate','identify','impact',
        'improve','indicate','influence','maintain','major','method','occur','participate','perform','prevent',
        'principle','process','require','respond','significant','similar','specific','strategy','structure','sufficient',
        'support','tendency','theory','transfer','vary','access','account','apply','available','create',
        'culture','demand','design','effect','enable','increase','individual','issue','manage','research'
    ]::text[])
), numbered AS (
    SELECT word, row_number() OVER (ORDER BY word) AS n FROM demo_words
)
INSERT INTO vocabulary_examples (sense_id, example_text, translation_vi, example_order)
SELECT s.id, 'The learner reviewed the word "' || numbered.word || '" in a practice sentence.',
       'Người học ôn từ "' || numbered.word || '" trong một câu luyện tập.', 1
FROM numbered
JOIN vocabularies v ON v.normalized_word = numbered.word
JOIN vocabulary_senses s ON s.vocabulary_id = v.id AND s.sense_order = 1
ON CONFLICT (sense_id, example_order) DO NOTHING;

WITH demo_words(word, n) AS (
    SELECT word, row_number() OVER (ORDER BY word)
    FROM unnest(ARRAY[
        'abandon','ability','achieve','adapt','adequate','advantage','affect','alternative','analyze','approach',
        'appropriate','assume','attempt','aware','benefit','challenge','circumstance','combine','communicate','compare',
        'complex','concentrate','consequence','consider','consistent','consume','context','contribute','convince','decline',
        'define','demonstrate','determine','develop','efficient','emphasize','encourage','environment','establish','estimate',
        'evaluate','evidence','expand','factor','feature','focus','function','generate','identify','impact',
        'improve','indicate','influence','maintain','major','method','occur','participate','perform','prevent',
        'principle','process','require','respond','significant','similar','specific','strategy','structure','sufficient',
        'support','tendency','theory','transfer','vary','access','account','apply','available','create',
        'culture','demand','design','effect','enable','increase','individual','issue','manage','research'
    ]::text[]) AS word
)
INSERT INTO user_vocabularies (user_id, vocabulary_id, learning_status, is_manual_weak, mastery_score,
    total_attempts, correct_count, wrong_count, consecutive_wrong, weak_deleted)
SELECT u.id, v.id, 'WEAK', (d.n % 2 = 0), (d.n * 7) % 91,
       10 + (d.n % 10), (d.n * 3) % (11 + (d.n % 10)),
       (10 + (d.n % 10)) - ((d.n * 3) % (11 + (d.n % 10))), d.n % 6, false
FROM demo_words d
JOIN vocabularies v ON v.normalized_word = d.word
JOIN users u ON u.id = 1
ON CONFLICT (user_id, vocabulary_id) DO NOTHING;
