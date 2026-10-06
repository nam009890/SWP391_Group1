import React, { useState } from 'react';

const ReadingComprehensionQuestion = ({ question, onAnswerResult }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);

  const subQuestions = question.sub_questions || [];

  const handleSelectOption = (subId, option) => {
    if (submitted && Object.values(results).every(r => r.isCorrect)) return;
    setSelectedAnswers(prev => ({ ...prev, [subId]: option }));
    if (submitted) setSubmitted(false);
  };

  const handleCheck = () => {
    const newResults = {};
    let allCorrect = true;

    subQuestions.forEach(sub => {
      const userAns = (selectedAnswers[sub.id] || '').trim().toLowerCase();
      const targetAns = (sub.correct_answer || '').trim().toLowerCase();
      const isSubCorrect = userAns !== '' && userAns === targetAns;

      newResults[sub.id] = {
        isCorrect: isSubCorrect,
        userAns: selectedAnswers[sub.id] || '',
        expected: sub.correct_answer || ''
      };

      if (!isSubCorrect) allCorrect = false;
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
    setSelectedAnswers({});
    setSubmitted(false);
    setResults({});
    setShowExplanation(false);
  };

  const answeredCount = Object.keys(selectedAnswers).filter(k => selectedAnswers[k]).length;
  const correctCount = Object.values(results).filter(r => r.isCorrect).length;

  return (
    <div className="exercise-card glass-panel animate-fade-in" style={{ padding: '28px' }}>
      <div className="exercise-meta-tag" style={{ color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.35)', background: 'rgba(139, 92, 246, 0.12)' }}>
        📖 DẠNG: ĐOẠN VĂN ĐỌC HIỂU & TRẢ LỜI CÂU HỎI
      </div>

      <div className="exercise-instruction" style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-main)', fontWeight: 600 }}>
        {question.instruction || "Đọc kỹ đoạn văn sau và trả lời các câu hỏi bên dưới:"}
      </div>

      {/* BỐ CỤC CHIA 2 CỘT (SPLIT VIEW CHO DESKTOP) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* CỘT 1: ĐOẠN VĂN BẢN ĐỌC HIỂU */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '22px 24px',
          maxHeight: '520px',
          overflowY: 'auto'
        }}>
          {question.passage_title && (
            <h4 style={{
              margin: '0 0 14px 0',
              fontSize: '18px',
              color: '#8b5cf6',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📜</span> {question.passage_title}
            </h4>
          )}
          <div style={{
            fontSize: '16px',
            lineHeight: '1.85',
            color: 'var(--text-main)',
            textAlign: 'justify',
            whiteSpace: 'pre-line'
          }}>
            {question.passage_text}
          </div>
        </div>

        {/* CỘT 2: BỘ CÂU HỎI LIÊN QUAN ĐẾN ĐOẠN VĂN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
          {subQuestions.map((sub, sIdx) => {
            const userChoice = selectedAnswers[sub.id];
            const subRes = results[sub.id];

            return (
              <div
                key={sub.id || sIdx}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '12px',
                  lineHeight: '1.5'
                }}>
                  <span style={{ color: '#8b5cf6', marginRight: '6px' }}>Q{sIdx + 1}:</span>
                  {sub.question}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(sub.options || []).map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = userChoice === opt;
                    const isTargetCorrect = opt.trim().toLowerCase() === (sub.correct_answer || '').trim().toLowerCase();

                    let optBg = 'rgba(255, 255, 255, 0.03)';
                    let optBorder = '1px solid rgba(255, 255, 255, 0.08)';

                    if (submitted) {
                      if (isSelected) {
                        optBg = subRes?.isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                        optBorder = subRes?.isCorrect ? '2px solid #10b981' : '2px solid #ef4444';
                      } else if (isTargetCorrect) {
                        optBg = 'rgba(16, 185, 129, 0.15)';
                        optBorder = '2px dashed #10b981';
                      }
                    } else if (isSelected) {
                      optBg = 'rgba(139, 92, 246, 0.2)';
                      optBorder = '2px solid #8b5cf6';
                    }

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(sub.id, opt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: optBg,
                          border: optBorder,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          fontSize: '14px',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          fontWeight: 700,
                          fontSize: '12px'
                        }}>
                          {letter}
                        </span>
                        <span style={{ color: isSelected ? '#fff' : 'var(--text-main)', flex: 1 }}>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {submitted && subRes && !subRes.isCorrect && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                    ✓ Đáp án đúng: {sub.correct_answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* TỔNG KẾT & TIẾN ĐỘ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Đã chọn: <strong style={{ color: '#8b5cf6' }}>{answeredCount}</strong> / {subQuestions.length} câu hỏi
        </span>
        {submitted && (
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '12px',
            background: correctCount === subQuestions.length ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: correctCount === subQuestions.length ? '#10b981' : '#ef4444'
          }}>
            Điểm: {correctCount}/{subQuestions.length} câu đúng
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
            Kiểm Tra Bài Đọc
          </button>

          {submitted && (
            <button
              className="btn btn-glass"
              onClick={handleReset}
              style={{ padding: '10px 20px' }}
            >
              🔄 Làm lại bài đọc
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
            <strong>Giải thích chi tiết bài đọc hiểu:</strong>
          </div>
          <div className="feedback-content" style={{ marginTop: '8px', lineHeight: '1.7' }}>
            <p>{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingComprehensionQuestion;
