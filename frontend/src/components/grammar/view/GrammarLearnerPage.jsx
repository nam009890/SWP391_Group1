// ============================================================
// VIEW — Grammar Learner Page
// Supports hierarchical structure: Big Groups (Chủ Đề)
// with smaller questions in each group, clean alignment and navigation.
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotTheErrorQuestion from './components/SpotTheErrorQuestion';
import FillBlankQuestion from './components/FillBlankQuestion';
import { getStoredQuestions, fetchGrammarQuestions } from '../model/grammarQuestionsData';
import '../Grammar.css';

const GrammarLearnerPage = ({ user }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(() => getStoredQuestions());
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scoreMap, setScoreMap] = useState({}); // { [groupId]: number }
  const [answeredMap, setAnsweredMap] = useState({}); // { [`${groupId}_${idx}`]: 'correct' | 'incorrect' }
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    fetchGrammarQuestions().then(res => {
      if (res && Array.isArray(res.groups) && res.groups.length > 0) {
        setData(res);
      }
    });
  }, []);

  const groups = data.groups || [];
  const currentGroup = groups[selectedGroupIndex] || groups[0];
  const questions = currentGroup?.questions || [];
  const currentQuestion = questions[currentIndex];

  const currentScore = scoreMap[currentGroup?.id] || 0;
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const handleSelectGroup = (idx) => {
    setSelectedGroupIndex(idx);
    setCurrentIndex(0);
  };

  const handleAnswerResult = (isCorrect) => {
    const key = `${currentGroup.id}_${currentIndex}`;
    if (!answeredMap[key]) {
      if (isCorrect) {
        setScoreMap(prev => ({
          ...prev,
          [currentGroup.id]: (prev[currentGroup.id] || 0) + 1
        }));
      }
      setAnsweredMap(prev => ({ ...prev, [key]: isCorrect ? 'correct' : 'incorrect' }));
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

  const handleRestartGroup = () => {
    setCurrentIndex(0);
    setScoreMap(prev => ({ ...prev, [currentGroup.id]: 0 }));
    // Clear answers for this group
    setAnsweredMap(prev => {
      const next = { ...prev };
      questions.forEach((_, idx) => delete next[`${currentGroup.id}_${idx}`]);
      return next;
    });
    setShowCompletionModal(false);
  };

  const handleNextGroup = () => {
    if (selectedGroupIndex < groups.length - 1) {
      setSelectedGroupIndex(selectedGroupIndex + 1);
      setCurrentIndex(0);
      setShowCompletionModal(false);
    } else {
      setShowCompletionModal(false);
    }
  };

  if (!currentGroup || questions.length === 0) {
    return (
      <div className="grammar-container">
        <div className="glass-panel grammar-empty-state">
          <div className="empty-state-icon">📝</div>
          <h2>Chưa có câu hỏi ngữ pháp nào</h2>
          <p>Hãy truy cập màn hình Quản trị để tạo nhóm bài tập và câu hỏi mới.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            ← Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-container animate-fade-in">

      {/* Page Title Bar */}
      <div className="grammar-page-titlebar">
        <div className="grammar-title-left">
          <span className="grammar-lesson-badge">✏️ Luyện Tập Ngữ Pháp</span>
          <span className="grammar-lesson-subtitle">{data.lesson_title || "Ngữ Pháp Tiếng Anh"}</span>
        </div>
        <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}>
          ← Quay Về
        </button>
      </div>

      {/* BIG GROUPS / CHỦ ĐỀ SELECTOR (1 Nhóm Lớn Chứa Các Câu Nhỏ) */}
      <div className="grammar-groups-nav">
        <div className="grammar-groups-header">
          <span className="grammar-groups-title">
            📚 Chọn Nhóm Bài Tập / Chủ Đề ({groups.length} Nhóm Lớn)
          </span>
        </div>
        <div className="grammar-groups-grid">
          {groups.map((group, idx) => (
            <div
              key={group.id || idx}
              className={`group-tab-card ${selectedGroupIndex === idx ? 'active' : ''}`}
              onClick={() => handleSelectGroup(idx)}
            >
              <div className="group-card-icon">{group.icon || "📘"}</div>
              <div className="group-card-info">
                <h4>{group.title}</h4>
                <p>{group.description}</p>
                <span className="group-card-badge">
                  {group.questions?.length || 0} câu hỏi
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Group Banner & Progress */}
      <div className="active-group-banner glass-panel">
        <div className="active-group-label">
          <span>{currentGroup.icon || "📘"}</span>
          <span>{currentGroup.title}</span>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Tiến độ nhóm: <strong>{currentIndex + 1}</strong> / {questions.length} câu
        </span>
      </div>

      {/* Progress & Score Bar */}
      <div className="grammar-progress-box glass-panel">
        <div className="progress-info">
          <span>
            Câu hỏi <strong>{currentIndex + 1}</strong> / {questions.length}
            {currentQuestion?.title && (
              <span style={{ marginLeft: '10px', color: '#38bdf8', fontWeight: 600 }}>
                • {currentQuestion.title}
              </span>
            )}
          </span>
          <span>
            Điểm số nhóm: <strong style={{ color: '#10b981' }}>{currentScore}</strong> / {questions.length}
          </span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Active Question Widget */}
      {currentQuestion && (
        currentQuestion.type === 'SPOT_ERROR' ? (
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
        )
      )}

      {/* Step Navigation Controls (Correctly Aligned) */}
      <div className="step-controls-bar">
        <button
          className="btn btn-glass"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
        >
          ← Câu Trước
        </button>

        <div className="step-numbers-box">
          {questions.map((_, idx) => {
            const key = `${currentGroup.id}_${idx}`;
            const state = answeredMap[key];
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`step-num-btn ${currentIndex === idx ? 'active' : ''} ${state === 'correct' ? 'done-correct' : state === 'incorrect' ? 'done-incorrect' : ''}`}
                title={`Chuyển đến câu ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button className="btn btn-primary" onClick={handleNext}>
          {currentIndex === questions.length - 1 ? 'Hoàn Thành Nhóm ➔' : 'Câu Tiếp ➔'}
        </button>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="grammar-modal-overlay">
          <div className="grammar-modal-box">
            <div className="modal-emoji">🎉</div>
            <h2>Hoàn Thành Nhóm Bài Tập!</h2>
            <p className="modal-subtitle">{currentGroup.title}</p>
            
            <div className="modal-score-box">
              <span>Điểm số đạt được:</span>
              <div className="modal-score-value">
                {currentScore} / {questions.length}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-glass" onClick={handleRestartGroup}>
                🔄 Làm Lại Nhóm Này
              </button>
              {selectedGroupIndex < groups.length - 1 ? (
                <button className="btn btn-primary" onClick={handleNextGroup}>
                  Sang Nhóm Tiếp Theo ➔
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                  ✓ Hoàn Tất Về Trang Chủ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GrammarLearnerPage;
