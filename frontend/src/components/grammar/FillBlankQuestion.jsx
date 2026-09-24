import React, { useState } from 'react';

const FillBlankQuestion = ({ question, onAnswerResult }) => {
  const isDropdown = question.type === 'FILL_BLANK_DROPDOWN';
  const isCards = question.type === 'FILL_BLANK_CARDS';
  const isText = question.type === 'FILL_BLANK_TEXT' || (!isDropdown && !isCards);

  // blanks is an object: { "1": { hint, accepted_answers } } or { "1": { options, correct_answer } }
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [blankResults, setBlankResults] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);

  const handleInputChange = (blankKey, value) => {
    setAnswers(prev => ({ ...prev, [blankKey]: value }));
    if (submitted) {
      setSubmitted(false);
    }
  };

  const normalizeString = (str, strictCase, ignoreWhitespace) => {
    if (!str) return '';
    let res = str;
    if (ignoreWhitespace) {
      res = res.trim().replace(/\s+/g, ' ');
    }
    if (!strictCase) {
      res = res.toLowerCase();
    }
    return res;
  };

  const handleCheckAnswer = () => {
    const results = {};
    let allCorrect = true;
    const blanks = question.blanks || {};
    const strictCase = question.validation?.strict_case ?? false;
    const ignoreWhitespace = question.validation?.ignore_extra_whitespace ?? true;

    Object.keys(blanks).forEach((key) => {
      const blankConfig = blanks[key];
      const userAnswer = answers[key] || '';
      const normalizedUser = normalizeString(userAnswer, strictCase, ignoreWhitespace);

      let isFieldCorrect = false;

      if (isDropdown || isCards) {
        const correctTarget = normalizeString(blankConfig.correct_answer, strictCase, ignoreWhitespace);
        isFieldCorrect = normalizedUser !== '' && normalizedUser === correctTarget;
      } else {
        // Text input: match any in accepted_answers
        const accepted = (blankConfig.accepted_answers || []).map(ans => 
          normalizeString(ans, strictCase, ignoreWhitespace)
        );
        isFieldCorrect = accepted.includes(normalizedUser);
      }

      results[key] = {
        isCorrect: isFieldCorrect,
        userAnswer,
        expected: blankConfig.correct_answer || (blankConfig.accepted_answers && blankConfig.accepted_answers[0]) || ''
      };

      if (!isFieldCorrect) {
        allCorrect = false;
      }
    });

    setBlankResults(results);
    setSubmitted(true);

    if (allCorrect) {
      setShowExplanation(true);
      if (onAnswerResult) onAnswerResult(true);
    } else {
      if (onAnswerResult) onAnswerResult(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setBlankResults({});
    setShowExplanation(false);
  };

  // Render the sentence with inline blanks parsed from template
  const renderSentence = () => {
    const template = question.template || '';
    // Regex splits by {1}, {2}, etc.
    const parts = template.split(/\{(\d+)\}/g);

    return (
      <div className="fill-blank-sentence">
        {parts.map((part, index) => {
          // If index is odd, it's a blank key (1, 2, ...)
          if (index % 2 === 1) {
            const blankKey = part;
            const blankConfig = question.blanks?.[blankKey] || {};
            const result = blankResults[blankKey];

            if (isCards) {
              // Option Cards mode placeholder
              const selectedVal = answers[blankKey];
              let cardClass = '';
              if (submitted && result) {
                cardClass = result.isCorrect ? 'correct' : 'incorrect';
              }
              return (
                <span key={index} className="inline-blank-wrapper">
                  <span className={`blank-placeholder-target ${cardClass}`}>
                    {selectedVal || `[ ___#${blankKey}___ ]`}
                  </span>
                  {submitted && result && !result.isCorrect && (
                    <span className="blank-correct-contrast">
                      Đúng: {result.expected}
                    </span>
                  )}
                </span>
              );
            }

            if (isDropdown) {
              // Inline Dropdown mode
              const options = blankConfig.options || [];
              let selectClass = '';
              if (submitted && result) {
                selectClass = result.isCorrect ? 'correct' : 'incorrect';
              }

              return (
                <span key={index} className="inline-blank-wrapper">
                  <select
                    className={`inline-select-dropdown ${selectClass}`}
                    value={answers[blankKey] || ''}
                    onChange={(e) => handleInputChange(blankKey, e.target.value)}
                    disabled={submitted && result?.isCorrect}
                  >
                    <option value="">-- Chọn đáp án ▼ --</option>
                    {options.map((opt, optIdx) => (
                      <option key={optIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {submitted && result && !result.isCorrect && (
                    <span className="blank-correct-contrast">
                      Đúng: {result.expected}
                    </span>
                  )}
                </span>
              );
            }

            // Text Input mode
            const currentVal = answers[blankKey] || '';
            const hint = blankConfig.hint;
            // Dynamic width computation
            const inputWidth = Math.max((currentVal.length || 0), (hint ? hint.length : 0), 5) + 3;

            let inputClass = '';
            if (submitted && result) {
              inputClass = result.isCorrect ? 'correct' : 'incorrect';
            }

            return (
              <span key={index} className="inline-blank-wrapper">
                <input
                  type="text"
                  className={`inline-blank-input ${inputClass}`}
                  style={{ width: `${inputWidth}ch` }}
                  value={currentVal}
                  placeholder={hint ? `(${hint})` : `...`}
                  onChange={(e) => handleInputChange(blankKey, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheckAnswer();
                  }}
                  disabled={submitted && result?.isCorrect}
                  autoComplete="off"
                  spellCheck="false"
                />
                {hint && !submitted && (
                  <span className="blank-hint-text">({hint})</span>
                )}
                {submitted && result && !result.isCorrect && (
                  <span className="blank-correct-contrast">
                    Đúng: {result.expected}
                  </span>
                )}
              </span>
            );
          }

          // Static text part
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  // If cards mode, render Option Cards (A, B, C, D) below sentence
  const renderCards = () => {
    if (!isCards) return null;
    const blankConfig = question.blanks?.["1"] || {};
    const options = blankConfig.options || [];
    const selectedAnswer = answers["1"];
    const result = blankResults["1"];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
      <div style={{ marginTop: '10px', marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Chọn 1 thẻ dưới đây để điền vào câu:
        </p>
        <div className="option-cards-grid">
          {options.map((opt, idx) => {
            const letter = letters[idx % letters.length];
            const isSelected = selectedAnswer === opt;

            let cardStatus = '';
            if (submitted && result) {
              if (isSelected) {
                cardStatus = result.isCorrect ? 'correct' : 'incorrect';
              } else if (opt.toLowerCase() === (blankConfig.correct_answer || '').toLowerCase()) {
                cardStatus = 'correct'; // Show the actual correct one too
              }
            } else if (isSelected) {
              cardStatus = 'selected';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`option-card-btn ${cardStatus} ${submitted && result?.isCorrect ? 'locked' : ''}`}
                onClick={() => handleInputChange("1", opt)}
              >
                <div className="option-badge-key">{letter}</div>
                <div style={{ fontSize: '17px', fontWeight: '600' }}>{opt}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const isAllAnswered = Object.keys(question.blanks || {}).every(
    (key) => answers[key] && answers[key].trim() !== ''
  );

  const isEntirelyCorrect = submitted && Object.keys(blankResults).length > 0 && 
    Object.values(blankResults).every(r => r.isCorrect);

  return (
    <div className="exercise-card glass-panel">
      <div className="exercise-meta-tag">
        {isText && "✍️ DẠNG 2A: ĐIỀN VÀO Ô TRỐNG (GÕ TỪ)"}
        {isDropdown && "🔽 DẠNG 2B: CHỌN ĐÁP ÁN (DANH SÁCH THẢ XUỐNG)"}
        {isCards && "🃏 DẠNG 2C: CHỌN THẺ ĐÁP ÁN (A, B, C, D)"}
      </div>

      <div className="exercise-instruction">
        {question.instruction || "Điền nội dung đúng vào các ô trống:"}
      </div>

      {/* Dynamic Sentence with Blanks */}
      {renderSentence()}

      {/* Option Cards if applicable */}
      {renderCards()}

      {/* Action Controls */}
      <div className="exercise-action-bar">
        <div className="action-buttons-group">
          {!isEntirelyCorrect ? (
            <button
              className="btn btn-primary"
              onClick={handleCheckAnswer}
              disabled={!isAllAnswered}
              style={{ opacity: !isAllAnswered ? 0.6 : 1 }}
            >
              Nộp Bài (Kiểm Tra)
            </button>
          ) : (
            <button
              className="btn btn-glass"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? 'Ẩn Phân Tích' : 'Phân Tích Đáp Án'}
            </button>
          )}

          {submitted && (
            <button className="btn btn-glass" onClick={handleReset}>
              🔄 Làm Lại
            </button>
          )}
        </div>

        {submitted && (
          <div style={{ fontSize: '15px', fontWeight: '600' }}>
            {isEntirelyCorrect ? (
              <span style={{ color: '#34d399' }}>✓ Xuất sắc! Tất cả các vị trí đều chính xác.</span>
            ) : (
              <span style={{ color: '#fb7185' }}>✗ Có vị trí chưa chính xác. Vui lòng đối chiếu với đáp án đúng màu xanh.</span>
            )}
          </div>
        )}
      </div>

      {/* Explanation Box */}
      {showExplanation && question.explanation && (
        <div className="feedback-box success-box">
          <div className="feedback-title">
            <span>📖 Phân tích ngữ pháp chi tiết:</span>
          </div>
          <div className="feedback-content">
            <p>{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillBlankQuestion;
