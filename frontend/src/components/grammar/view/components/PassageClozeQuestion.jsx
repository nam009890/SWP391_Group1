import React, { useState } from 'react';

const PassageClozeQuestion = ({ question, onAnswerResult }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);

  const blanks = question.blanks || {};

  const handleSelect = (blankKey, value) => {
    setAnswers(prev => ({ ...prev, [blankKey]: value }));
    if (submitted) setSubmitted(false);
  };

  const handleCheck = () => {
    const newResults = {};
    let allCorrect = true;

    Object.keys(blanks).forEach(key => {
      const userVal = (answers[key] || '').trim().toLowerCase();
      const targetVal = (blanks[key]?.correct_answer || '').trim().toLowerCase();
      const isFieldCorrect = userVal !== '' && userVal === targetVal;

      newResults[key] = {
        isCorrect: isFieldCorrect,
        userVal: answers[key] || '',
        expected: blanks[key]?.correct_answer || ''
      };

      if (!isFieldCorrect) allCorrect = false;
    });

    setResults(newResults);
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
    setResults({});
    setShowExplanation(false);
  };

  // Render đoạn văn chứa các chỗ trống {1}, {2}...
  const renderPassage = () => {
    const text = question.passage_text || '';
    const parts = text.split(/\{(\d+)\}/g);

    return (
      <div style={{
        fontSize: '17px',
        lineHeight: '2.1',
        color: 'var(--text-main)',
        textAlign: 'justify',
        padding: '24px 28px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '24px'
      }}>
        {parts.map((part, idx) => {
          if (idx % 2 === 1) {
            const blankKey = part;
            const blankConfig = blanks[blankKey] || {};
            const options = blankConfig.options || [];
            const result = results[blankKey];

            let borderStyle = '1px solid rgba(6, 182, 212, 0.4)';
            let bgStyle = 'rgba(6, 182, 212, 0.1)';

            if (submitted && result) {
              borderStyle = result.isCorrect ? '2px solid #10b981' : '2px solid #ef4444';
              bgStyle = result.isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
            }

            return (
              <span key={idx} style={{ display: 'inline-block', margin: '0 6px', verticalAlign: 'middle' }}>
                <select
                  value={answers[blankKey] || ''}
                  onChange={(e) => handleSelect(blankKey, e.target.value)}
                  disabled={submitted && result?.isCorrect}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: bgStyle,
                    border: borderStyle,
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <option value="" style={{ background: '#1e293b', color: '#94a3b8' }}>
                    ({blankKey}) -- Chọn từ ▼ --
                  </option>
                  {options.map((opt, optIdx) => (
                    <option key={optIdx} value={opt} style={{ background: '#0f172a', color: '#fff' }}>
                      ({blankKey}) {opt}
                    </option>
                  ))}
                </select>

                {submitted && result && !result.isCorrect && (
                  <span style={{
                    marginLeft: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    Đúng: {result.expected}
                  </span>
                )}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  const totalBlanks = Object.keys(blanks).length;
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;

  return (
    <div className="exercise-card glass-panel animate-fade-in" style={{ padding: '28px' }}>
      <div className="exercise-meta-tag" style={{ color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.35)', background: 'rgba(6, 182, 212, 0.12)' }}>
        📄 DẠNG: ĐOẠN VĂN ĐIỀN TỪ VÀO CHỖ TRỐNG
      </div>

      <div className="exercise-instruction" style={{ fontSize: '16px', marginBottom: '18px', color: 'var(--text-main)', fontWeight: 600 }}>
        {question.instruction || "Đọc đoạn văn sau và chọn từ thích hợp để điền vào mỗi chỗ trống:"}
      </div>

      {/* TIÊU ĐỀ BÀI ĐỌC */}
      {question.passage_title && (
        <h3 style={{
          fontSize: '20px',
          color: '#06b6d4',
          margin: '0 0 16px 0',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>📖</span> {question.passage_title}
        </h3>
      )}

      {/* NỘI DUNG ĐOẠN VĂN */}
      {renderPassage()}

      {/* BẢNG TỔNG KẾT TIẾN ĐỘ ĐIỀN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Đã điền: <strong style={{ color: '#06b6d4' }}>{answeredCount}</strong> / {totalBlanks} chỗ trống
        </span>
        {submitted && (
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '12px',
            background: Object.values(results).every(r => r.isCorrect) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: Object.values(results).every(r => r.isCorrect) ? '#10b981' : '#ef4444'
          }}>
            Kết quả: {Object.values(results).filter(r => r.isCorrect).length}/{totalBlanks} đúng
          </span>
        )}
      </div>

      {/* THANH ĐIỀU KHIỂN NÚT BẤM */}
      <div className="exercise-action-bar">
        <div className="action-buttons-group">
          <button
            className="btn btn-primary"
            onClick={handleCheck}
            disabled={answeredCount === 0}
            style={{ opacity: answeredCount === 0 ? 0.6 : 1, padding: '10px 24px' }}
          >
            Kiểm Tra Đáp Án
          </button>

          {submitted && (
            <button
              className="btn btn-glass"
              onClick={handleReset}
              style={{ padding: '10px 20px' }}
            >
              🔄 Làm lại đoạn văn
            </button>
          )}

          {submitted && (
            <button
              className="btn btn-glass"
              onClick={() => setShowExplanation(!showExplanation)}
              style={{ padding: '10px 20px' }}
            >
              {showExplanation ? "Ẩn giải thích" : "📖 Xem giải thích"}
            </button>
          )}
        </div>
      </div>

      {/* GIẢI THÍCH CHI TIẾT */}
      {submitted && showExplanation && question.explanation && (
        <div className="feedback-box correct-box animate-pop" style={{ marginTop: '20px' }}>
          <div className="feedback-header">
            <span className="feedback-icon">💡</span>
            <strong>Giải thích chi tiết các chỗ trống:</strong>
          </div>
          <div className="feedback-content" style={{ marginTop: '8px', lineHeight: '1.7' }}>
            <p>{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassageClozeQuestion;
