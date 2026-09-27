// ============================================================
// VIEW — Grammar Learner Page
// The student-facing page for practicing grammar exercises.
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotTheErrorQuestion from './components/SpotTheErrorQuestion';
import FillBlankQuestion from './components/FillBlankQuestion';
import { getStoredQuestions, fetchGrammarQuestions } from '../model/grammarQuestionsData';
import '../Grammar.css';

const GrammarLearnerPage = ({ user }) => {
  const navigate = useNavigate();
  const [lessonData, setLessonData] = useState(() => getStoredQuestions());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answeredMap, setAnsweredMap] = useState({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    fetchGrammarQuestions().then(data => {
      if (data && data.questions && data.questions.length > 0) {
        setLessonData(data);
      }
    });
  }, []);

  if (!lessonData || !lessonData.questions || lessonData.questions.length === 0) {
    return (
      <div className="grammar-container">
        <div className="glass-panel grammar-empty-state">
          <div className="empty-state-icon">📝</div>
          <h2>Chưa có câu hỏi ngữ pháp nào</h2>
          <p>Hãy truy cập màn hình Quản trị để soạn và tạo câu hỏi mới.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            ← Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  const questions = lessonData.questions;
  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleAnswerResult = (isCorrect) => {
    if (!answeredMap[currentIndex]) {
      if (isCorrect) setScore(prev => prev + 1);
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
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setAnsweredMap({});
    setShowCompletionModal(false);
  };

  return (
    <div className="grammar-container animate-fade-in">

      {/* Page Title Bar */}
      <div className="grammar-page-titlebar">
        <div className="grammar-title-left">
          <span className="grammar-lesson-badge">✏️ Luyện Tập Ngữ Pháp</span>
          <span className="grammar-lesson-subtitle">{lessonData.lesson_title}</span>
        </div>
        <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}>
          ← Quay Về
        </button>
      </div>

      {/* Progress & Score Bar */}
      <div className="grammar-progress-box glass-panel">
        <div className="progress-info">
          <span>
            Câu hỏi <strong>{currentIndex + 1}</strong> / {questions.length}
            {currentQuestion.title && <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontWeight: 400 }}>• {currentQuestion.title}</span>}
          </span>
          <span>Điểm số: <strong style={{ color: '#38bdf8' }}>{score}</strong> / {questions.length}</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Active Question */}
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

      {/* Step Navigation */}
      <div className="step-controls-bar">
        <button
          className="btn btn-glass"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
        >
          ← Câu Trước
        </button>

        <div className="step-numbers-box">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`step-num-btn ${currentIndex === idx ? 'active' : ''} ${answeredMap[idx] === 'correct' ? 'done-correct' : answeredMap[idx] === 'incorrect' ? 'done-incorrect' : ''}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleNext}>
          {currentIndex === questions.length - 1 ? 'Hoàn Thành ➔' : 'Câu Tiếp ➔'}
        </button>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="grammar-modal-overlay">
          <div className="grammar-modal-box glass-panel">
            <div className="modal-emoji">🎉</div>
            <h2>Chúc Mừng Bạn!</h2>
            <p className="modal-subtitle">Bạn đã hoàn thành phiên luyện tập ngữ pháp này.</p>

            <div className="modal-score-box">
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Kết quả của bạn</div>
              <div className="modal-score-value">{score} / {questions.length}</div>
              <div style={{ fontSize: '14px', marginTop: '4px', color: score === questions.length ? '#34d399' : '#f59e0b' }}>
                {score === questions.length ? '🌟 Hoàn hảo 100%!' : '💪 Hãy tiếp tục phát huy nhé!'}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-glass" onClick={handleRestart}>
                🔄 Luyện Lại
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                🗂️ Về Trang Chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarLearnerPage;
