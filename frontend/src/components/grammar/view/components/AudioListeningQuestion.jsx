import React, { useState, useRef, useEffect } from 'react';

const AudioListeningQuestion = ({ question, onAnswerResult }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listenCount, setListenCount] = useState(0);

  const audioRef = useRef(null);
  const options = question.options || [];

  // Hỗ trợ Web Speech API nếu không có file âm thanh trực tiếp
  const playSpeechSynthesis = () => {
    if ('speechSynthesis' in window && question.transcript) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(question.transcript);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Tốc độ vừa phải cho người học
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        setListenCount(prev => prev + 1);
      };
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTogglePlay = () => {
    if (question.audio_url) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
            setListenCount(prev => prev + 1);
          }).catch(() => {
            playSpeechSynthesis();
          });
        }
      }
    } else if (question.transcript) {
      if (isPlaying) {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
      } else {
        playSpeechSynthesis();
      }
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
      <div className="exercise-meta-tag">
        Dạng bài: Nghe audio trả lời câu hỏi
      </div>

      <div className="exercise-instruction" style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-main)', fontWeight: 600 }}>
        {question.instruction || "Nghe đoạn ghi âm bên dưới và chọn câu trả lời chính xác:"}
      </div>

      {/* KHUNG TRÌNH PHÁT AUDIO HIỆN ĐẠI */}
      <div style={{
        padding: '20px 24px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(0, 0, 0, 0.4))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#f59e0b',
              color: '#000',
              border: 'none',
              fontSize: '22px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            {isPlaying ? "⏸️" : "▶️"}
          </button>

          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
              {isPlaying ? "Đang phát đoạn âm thanh..." : "Bấm nút Play để nghe đoạn băng"}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {question.audio_url ? "Âm thanh gốc • Chuẩn bản xứ" : "Phát âm AI tiếng Anh chuẩn (Text-to-Speech)"}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '10px' }}>
          Đã nghe: <strong style={{ color: '#f59e0b' }}>{listenCount}</strong> lần
        </div>

        {question.audio_url && (
          <audio
            ref={audioRef}
            src={question.audio_url}
            onEnded={() => setIsPlaying(false)}
            onError={() => {}}
            style={{ display: 'none' }}
          />
        )}
      </div>

      {/* CÂU HỎI NGHE HIỂU */}
      {question.question_text && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '20px',
          borderLeft: '4px solid #f59e0b',
          fontSize: '17px',
          fontWeight: 600,
          color: 'var(--text-main)',
          lineHeight: '1.6'
        }}>
          {question.question_text}
        </div>
      )}

      {/* CÁC LỰA CHỌN ĐÁP ÁN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '22px' }}>
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
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
            btnBg = 'rgba(245, 158, 11, 0.2)';
            btnBorder = '2px solid #f59e0b';
            letterColor = '#f59e0b';
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
                background: isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#000' : letterColor,
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
                <span style={{ color: isCorrect ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                  {isCorrect ? '✓' : '✗'}
                </span>
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
              Làm lại câu nghe
            </button>
          )}

          {submitted && isCorrect && (
            <button
              className="btn btn-glass"
              onClick={() => setShowExplanation(!showExplanation)}
              style={{ padding: '10px 20px' }}
            >
              {showExplanation ? "Ẩn giải thích & Lời thoại" : "Xem lời thoại & Giải thích"}
            </button>
          )}
        </div>
      </div>

      {/* GIẢI THÍCH CHI TIẾT & TRANSCRIPT LỜI THOẠI */}
      {submitted && (showExplanation || !isCorrect) && (
        <div className={`feedback-box animate-pop ${isCorrect ? 'correct-box' : 'incorrect-box'}`} style={{ marginTop: '20px' }}>
          <div className="feedback-header">
            <strong>{isCorrect ? 'Chính xác!' : 'Chưa chính xác'}</strong>
          </div>
          <div className="feedback-content" style={{ marginTop: '8px' }}>
            {!isCorrect && (
              <p>
                <strong>Đáp án đúng:</strong> <span style={{ color: '#10b981', fontWeight: 600 }}>{question.correct_answer}</span>
              </p>
            )}

            {question.transcript && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Lời thoại gốc (Transcript):
                </span>
                <span style={{ fontStyle: 'italic', color: 'var(--text-main)' }}>"{question.transcript}"</span>
              </div>
            )}

            {question.explanation && (
              <p style={{ marginTop: '10px' }}>{question.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioListeningQuestion;
