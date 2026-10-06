import React, { useState } from 'react';

const ImageQuestion = ({ question, onAnswerResult }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const options = question.options || [];

  const handleSelect = (opt) => {
    if (submitted && isCorrect) return;
    setSelectedOption(opt);
    if (submitted && !isCorrect) setSubmitted(false);
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    const correct = selectedOption.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase();
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
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(false);
  };

  return (
    <div className="exercise-card glass-panel animate-fade-in" style={{ padding: '28px' }}>
      <div className="exercise-meta-tag" style={{ color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.35)', background: 'rgba(236, 72, 153, 0.12)' }}>
        🖼️ DẠNG: CÂU HỎI KÈM HÌNH ẢNH
      </div>

      <div className="exercise-instruction" style={{ fontSize: '16px', marginBottom: '18px', color: 'var(--text-main)', fontWeight: 600 }}>
        {question.instruction || "Quan sát hình ảnh bên dưới và chọn đáp án chính xác nhất:"}
      </div>

      {/* KHUNG HIỂN THỊ HÌNH ẢNH */}
      {question.image_url ? (
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'zoom-in'
            }}
            onClick={() => setIsZoomed(!isZoomed)}
            title="Nhấp để phóng to / thu nhỏ ảnh"
          >
            <img
              src={question.image_url}
              alt={question.image_caption || "Hình ảnh câu hỏi"}
              style={{
                maxWidth: '100%',
                maxHeight: isZoomed ? '600px' : '360px',
                objectFit: 'contain',
                display: 'block',
                transition: 'all 0.3s ease'
              }}
            />
            <span style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.65)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              backdropFilter: 'blur(4px)'
            }}>
              🔍 {isZoomed ? "Thu nhỏ" : "Phóng to"}
            </span>
          </div>
          {question.image_caption && (
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              📷 {question.image_caption}
            </p>
          )}
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px', border: '1px dashed rgba(255,255,255,0.2)' }}>
          <span style={{ fontSize: '32px' }}>🖼️</span>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>Chưa có đường dẫn ảnh cho câu hỏi này.</p>
        </div>
      )}

      {/* NỘI DUNG CÂU HỎI */}
      {question.question_text && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '20px',
          borderLeft: '4px solid #ec4899',
          fontSize: '17px',
          fontWeight: 600,
          color: 'var(--text-main)',
          lineHeight: '1.6'
        }}>
          {question.question_text}
        </div>
      )}

      {/* DANH SÁCH CÁC LỰA CHỌN ĐÁP ÁN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '22px' }}>
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D
          const isSelected = selectedOption === opt;
          const isTargetCorrect = opt.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase();

          let btnBg = 'rgba(255, 255, 255, 0.04)';
          let btnBorder = '1px solid rgba(255, 255, 255, 0.12)';
          let letterColor = 'var(--text-muted)';
          let textColor = 'var(--text-main)';

          if (submitted) {
            if (isSelected) {
              if (isCorrect) {
                btnBg = 'rgba(16, 185, 129, 0.2)';
                btnBorder = '2px solid #10b981';
                letterColor = '#10b981';
              } else {
                btnBg = 'rgba(239, 68, 68, 0.2)';
                btnBorder = '2px solid #ef4444';
                letterColor = '#ef4444';
              }
            } else if (isTargetCorrect) {
              btnBg = 'rgba(16, 185, 129, 0.15)';
              btnBorder = '2px dashed #10b981';
            }
          } else if (isSelected) {
            btnBg = 'rgba(236, 72, 153, 0.2)';
            btnBorder = '2px solid #ec4899';
            letterColor = '#ec4899';
            textColor = '#fff';
          }

          return (
            <div
              key={idx}
              onClick={() => handleSelect(opt)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: btnBg,
                border: btnBorder,
                cursor: (submitted && isCorrect) ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isSelected ? '#ec4899' : 'rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#fff' : letterColor,
                fontWeight: 700,
                fontSize: '14px',
                flexShrink: 0
              }}>
                {letter}
              </span>
              <span style={{ fontSize: '15px', color: textColor, fontWeight: isSelected ? 600 : 400, flex: 1 }}>
                {opt}
              </span>
              {submitted && isSelected && (
                <span>{isCorrect ? '✅' : '❌'}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* THANH ĐIỀU KHIỂN NÚT BẤM */}
      <div className="exercise-action-bar">
        <div className="action-buttons-group">
          {!isCorrect ? (
            <button
              className="btn btn-primary"
              onClick={handleCheck}
              disabled={!selectedOption}
              style={{ opacity: !selectedOption ? 0.6 : 1, padding: '10px 24px' }}
            >
              Kiểm Tra
            </button>
          ) : (
            <button
              className="btn btn-glass"
              onClick={handleReset}
              style={{ padding: '10px 20px' }}
            >
              🔄 Làm lại
            </button>
          )}

          {submitted && isCorrect && (
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
      {submitted && (showExplanation || !isCorrect) && (
        <div className={`feedback-box animate-pop ${isCorrect ? 'correct-box' : 'incorrect-box'}`} style={{ marginTop: '20px' }}>
          <div className="feedback-header">
            <span className="feedback-icon">{isCorrect ? '🎉' : '⚠️'}</span>
            <strong>{isCorrect ? 'Chính xác!' : 'Chưa chính xác'}</strong>
          </div>
          <div className="feedback-content" style={{ marginTop: '8px' }}>
            {!isCorrect && (
              <p>
                <strong>Đáp án đúng:</strong> <span style={{ color: '#10b981', fontWeight: 600 }}>{question.correct_answer}</span>
              </p>
            )}
            {question.explanation && (
              <p style={{ marginTop: '6px' }}>{question.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageQuestion;
