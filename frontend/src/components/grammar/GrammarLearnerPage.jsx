import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotTheErrorQuestion from './SpotTheErrorQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import { getStoredQuestions } from './grammarQuestionsData';
import { isCreatorUser } from './authHelper';
import './Grammar.css';

const GrammarLearnerPage = ({ user }) => {
  const navigate = useNavigate();
  const hasCreatorAccess = isCreatorUser(user);
  const [lessonData, setLessonData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answeredMap, setAnsweredMap] = useState({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    const data = getStoredQuestions();
    setLessonData(data);
  }, []);

  if (!lessonData || !lessonData.questions || lessonData.questions.length === 0) {
    return (
      <div className="grammar-container">
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Chưa có câu hỏi ngữ pháp nào</h2>
          <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>
            Hãy truy cập màn hình Quản trị để soạn và tạo câu hỏi mới.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/grammar/admin')}>
            Đến Màn Hình Soạn Câu Hỏi (Admin CMS)
          </button>
        </div>
      </div>
    );
  }

  const questions = lessonData.questions;
  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleAnswerResult = (isCorrect) => {
    // Only count score once per question index
    if (!answeredMap[currentIndex]) {
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      setAnsweredMap(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowCompletionModal(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setAnsweredMap({});
    setShowCompletionModal(false);
  };

  return (
    <div className="grammar-container animate-fade-in">
      {/* Top Banner & Fast Navigation */}
      <div className="grammar-header-banner glass-panel">
        <div className="grammar-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="mode-badge user-badge">👤 Học Viên (Learner UX)</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{lessonData.lesson_title}</span>
          </div>
          <h1>Luyện Tập Ngữ Pháp</h1>
          <p>Thực hành chỉ lỗi sai trong câu và điền vào ô trống với tương tác thông minh</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="banner-actions">
          <button className="btn btn-glass" onClick={() => navigate('/')}>
            🗂️ Về Flashcard
          </button>
          {hasCreatorAccess && (
            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #f43f5e, #8b5cf6)' }}
              onClick={() => navigate('/grammar/admin')}
            >
              🛠️ Soạn Câu Hỏi (Creator)
            </button>
          )}
        </div>
      </div>

      {/* Progress & Score Bar */}
      <div className="grammar-progress-box glass-panel">
        <div className="progress-info">
          <span>Câu hỏi {currentIndex + 1} / {questions.length}</span>
          <span>Điểm số: <strong style={{ color: '#38bdf8' }}>{score}</strong> / {questions.length}</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Render Active Question by Type */}
      {currentQuestion.type === 'SPOT_ERROR' ? (
        <SpotTheErrorQuestion
          key={currentQuestion.id || currentIndex}
          question={currentQuestion}
          onAnswerResult={handleAnswerResult}
        />
      ) : (
        <FillBlankQuestion
          key={currentQuestion.id || currentIndex}
          question={currentQuestion}
          onAnswerResult={handleAnswerResult}
        />
      )}

      {/* Bottom Step Controls */}
      <div className="step-controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <button
          className="btn btn-glass"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
        >
          ← Câu Trước
        </button>

        <div className="step-numbers-box" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: currentIndex === idx ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                background: answeredMap[idx] === 'correct' 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : answeredMap[idx] === 'incorrect' 
                  ? 'rgba(244, 63, 94, 0.3)' 
                  : currentIndex === idx 
                  ? 'rgba(6, 182, 212, 0.2)' 
                  : 'rgba(255,255,255,0.05)',
                color: currentIndex === idx ? '#38bdf8' : 'var(--text-main)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleNext}
        >
          {currentIndex === questions.length - 1 ? 'Hoàn Thành Bài Tập ➔' : 'Câu Tiếp Theo ➔'}
        </button>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '36px',
            textAlign: 'center',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '26px', marginBottom: '10px' }}>Chúc Mừng Bạn!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Bạn đã hoàn thành phiên luyện tập ngữ pháp này.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '20px',
              borderRadius: '16px',
              marginBottom: '28px'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Kết quả của bạn</div>
              <div style={{ fontSize: '38px', fontWeight: '800', color: '#38bdf8', marginTop: '6px' }}>
                {score} / {questions.length}
              </div>
              <div style={{ fontSize: '14px', marginTop: '4px', color: score === questions.length ? '#34d399' : '#f59e0b' }}>
                {score === questions.length ? '🌟 Hoàn hảo 100%!' : '💪 Hãy tiếp tục phát huy nhé!'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-glass" onClick={handleRestart}>
                🔄 Luyện Lại
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                🗂️ Về Bảng Điều Khiển
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarLearnerPage;
