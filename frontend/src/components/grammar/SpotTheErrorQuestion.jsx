import React, { useState } from 'react';

const SpotTheErrorQuestion = ({ question, onAnswerResult }) => {
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelectToken = (tokenId) => {
    if (submitted && isCorrect) return; // Prevent changing after correct
    setSelectedTokenId(tokenId);
    // If was in error state, clicking allows re-try
    if (submitted && !isCorrect) {
      setSubmitted(false);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedTokenId) return;

    const correct = selectedTokenId === question.correct_token_id;
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      setShowExplanation(true);
      if (onAnswerResult) onAnswerResult(true);
    } else {
      if (onAnswerResult) onAnswerResult(false);
    }
  };

  const handleReset = () => {
    setSelectedTokenId(null);
    setSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
    setShowExplanation(false);
  };

  return (
    <div className="exercise-card glass-panel">
      <div className="exercise-meta-tag">
        🔍 DẠNG 1: CHỈ RA LỖI SAI TRONG CÂU
      </div>
      
      <div className="exercise-instruction">
        {question.instruction || "Chỉ ra lỗi sai trong câu sau bằng cách click vào từ/cụm từ bị sai:"}
      </div>

      {/* Interactive Sentence Tokens */}
      <div className="tokens-sentence-container">
        {question.tokens?.map((token) => {
          const isSelected = selectedTokenId === token.id;
          const isTargetErrorToken = token.id === question.correct_token_id;

          let statusClass = '';
          if (submitted) {
            if (isSelected) {
              statusClass = isCorrect ? 'correct' : 'incorrect';
            }
          } else if (isSelected) {
            statusClass = 'selected';
          }

          const isLocked = submitted && isCorrect;

          return (
            <span
              key={token.id}
              className={`token-chip ${statusClass} ${isLocked ? 'locked' : ''}`}
              onClick={() => handleSelectToken(token.id)}
              title="Click để chọn vị trí này"
            >
              {submitted && isCorrect && isTargetErrorToken ? (
                <>
                  <span className="strikethrough-error">{token.text}</span>
                  <span className="replacement-text">
                    ➔ {question.correction || 'went'}
                  </span>
                </>
              ) : (
                token.text
              )}
            </span>
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="exercise-action-bar">
        <div className="action-buttons-group">
          {!isCorrect ? (
            <button
              className="btn btn-primary"
              onClick={handleCheckAnswer}
              disabled={!selectedTokenId}
              style={{ opacity: !selectedTokenId ? 0.6 : 1 }}
            >
              Kiểm Tra
            </button>
          ) : (
            <button
              className="btn btn-glass"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? 'Ẩn Giải Thích' : 'Xem Giải Thích Chi Tiết'}
            </button>
          )}

          {question.hint && !isCorrect && (
            <button
              className="btn btn-glass"
              onClick={() => setShowHint(!showHint)}
            >
              💡 {showHint ? 'Ẩn Gợi Ý' : 'Xem Gợi Ý'}
            </button>
          )}

          {submitted && (
            <button className="btn btn-glass" onClick={handleReset}>
              🔄 Thử Lại
            </button>
          )}
        </div>

        {submitted && (
          <div style={{ fontSize: '15px', fontWeight: '600' }}>
            {isCorrect ? (
              <span style={{ color: '#34d399' }}>✓ Chính xác! Bạn đã tìm đúng lỗi sai.</span>
            ) : (
              <span style={{ color: '#fb7185' }}>✗ Chưa chính xác. Hãy chọn lại hoặc xem gợi ý.</span>
            )}
          </div>
        )}
      </div>

      {/* Hint Box */}
      {showHint && question.hint && (
        <div className="feedback-box hint-box">
          <div className="feedback-title">
            <span>💡 Gợi ý tư duy:</span>
          </div>
          <div className="feedback-content">{question.hint}</div>
        </div>
      )}

      {/* Explanation Box */}
      {showExplanation && (
        <div className="feedback-box success-box">
          <div className="feedback-title">
            <span>📚 Phân tích ngữ pháp chi tiết:</span>
            {question.error_type && (
              <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                {question.error_type}
              </span>
            )}
          </div>
          <div className="feedback-content" style={{ marginTop: '8px' }}>
            <p><strong>Lỗi sai:</strong> "{question.tokens?.find(t => t.id === question.correct_token_id)?.text}" ➔ <strong>Sửa thành:</strong> "{question.correction}"</p>
            <p style={{ marginTop: '6px' }}>{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotTheErrorQuestion;
