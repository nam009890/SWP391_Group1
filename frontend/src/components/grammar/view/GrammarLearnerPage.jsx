// =========================================================================================
// VIEW LAYER — GRAMMAR LEARNER PAGE (GIAO DIỆN HỌC VIÊN LÀM BÀI TẬP)
// =========================================================================================
// Cập nhật theo yêu cầu người dùng:
// 1. Khắc phục lỗi Header bị che/clip dưới thanh Navbar cố định (paddingTop chuẩn).
// 2. Đơn giản hóa màn hình danh sách bài: Chỉ hiển thị "Các bài tập hiện tại" và Tên bài
//    (ví dụ: Test 1, Test 2...), không cần phần lời chào hay chi tiết dài dòng.
// 3. Loại bỏ hoàn toàn phần Gợi ý (Hint).
// 4. Câu từ ngắn gọn, thân thiện, dễ hiểu cho người học.
// =========================================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotTheErrorQuestion from './components/SpotTheErrorQuestion';
import FillBlankQuestion from './components/FillBlankQuestion';
import ImageQuestion from './components/ImageQuestion';
import PassageClozeQuestion from './components/PassageClozeQuestion';
import ReadingComprehensionQuestion from './components/ReadingComprehensionQuestion';
import AudioListeningQuestion from './components/AudioListeningQuestion';
import PrintTestModal from './components/PrintTestModal';
import ReportQuestionModal from './components/ReportQuestionModal';
import { getStoredQuestions, fetchGrammarQuestions } from '../model/grammarQuestionsData';
import { getQuestionTypeInfo } from '../model/questionTypesRegistry';
import '../Grammar.css';

const GrammarLearnerPage = ({ user }) => {
  const navigate = useNavigate();

  // Danh sách các bài tập
  const [data, setData] = useState(() => getStoredQuestions());

  // Chế độ xem: 'GROUPS_LIST' (Xem danh sách bài) hoặc 'TEST_SESSION' (Làm bài)
  const [viewMode, setViewMode] = useState('GROUPS_LIST');

  // Bài tập đang được chọn
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  // Câu hỏi hiện tại
  const [currentIndex, setCurrentIndex] = useState(0);

  // Điểm số của từng bài: { [groupId]: number }
  const [scoreMap, setScoreMap] = useState({});

  // Trạng thái từng câu: { [`${groupId}_${idx}`]: 'correct' | 'incorrect' }
  const [answeredMap, setAnsweredMap] = useState({});

  // Modal kết quả khi làm xong bài
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Modal in đề thi / xuất PDF
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Modal báo lỗi câu hỏi gửi cho tác giả qua Gmail
  const [showReportModal, setShowReportModal] = useState(false);

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

  // Bắt đầu làm bài
  const handleStartTest = (index) => {
    setSelectedGroupIndex(index);
    setCurrentIndex(0);
    setViewMode('TEST_SESSION');
    setShowCompletionModal(false);
  };

  // Quay lại danh sách bài tập
  const handleBackToGroupsList = () => {
    setData(getStoredQuestions());
    setViewMode('GROUPS_LIST');
    setShowCompletionModal(false);
  };

  // Xử lý khi trả lời
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

  // Câu tiếp
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowCompletionModal(true);
    }
  };

  // Câu trước
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Làm lại bài này
  const handleRestartGroup = () => {
    setCurrentIndex(0);
    setScoreMap(prev => ({ ...prev, [currentGroup.id]: 0 }));
    setAnsweredMap(prev => {
      const next = { ...prev };
      questions.forEach((_, idx) => delete next[`${currentGroup.id}_${idx}`]);
      return next;
    });
    setShowCompletionModal(false);
  };

  // =========================================================================================
  // MÀN HÌNH 1: CÁC BÀI TẬP HIỆN TẠI (ĐƠN GIẢN HÓA THEO YÊU CẦU 3)
  // =========================================================================================
  if (viewMode === 'GROUPS_LIST') {
    return (
      <div
        className="grammar-container animate-fade-in"
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          paddingTop: 'calc(var(--nav-height, 70px) + 30px)',
          paddingBottom: '60px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}
      >
        {/* Thanh tiêu đề trên cùng */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              Các bài tập hiện tại
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Chọn bài tập để bắt đầu luyện tập:
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/grammar/create')}
              title="Tự tạo bài tập mới và chia sẻ lên bảng tin cộng đồng"
              style={{ fontWeight: 600 }}
            >
              Tạo bài tập mới
            </button>
            <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}>
              Trang chủ
            </button>
          </div>
        </div>

        {/* Lưới danh sách bài tập gọn gàng (kèm tên tác giả và số câu) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {groups.map((group, idx) => {
            const count = group.questions?.length || 0;
            const score = scoreMap[group.id];

            return (
              <div
                key={group.id || idx}
                className="glass-panel group-selection-card animate-fade-in"
                style={{
                  padding: '22px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onClick={() => handleStartTest(idx)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '19px', color: 'var(--primary)' }}>
                      {group.title}
                    </h3>
                    {score !== undefined && (
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}>
                        Đạt: {score}/{count}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {count} câu hỏi
                  </p>

                  {/* THÔNG TIN TÁC GIẢ BÀI TẬP */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                    <span>Tác giả: <strong style={{ color: 'var(--text-main)' }}>{group.author?.name || 'Cộng đồng'}</strong></span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTest(idx);
                  }}
                >
                  Bắt đầu làm bài
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================================
  // MÀN HÌNH 2: LÀM BÀI TẬP TRONG NHÓM ĐÃ CHỌN
  // =========================================================================================
  return (
    <div
      className="grammar-container animate-fade-in"
      style={{
        maxWidth: '850px',
        margin: '0 auto',
        paddingTop: 'calc(var(--nav-height, 70px) + 30px)',
        paddingBottom: '60px',
        paddingLeft: '20px',
        paddingRight: '20px'
      }}
    >
      {/* Thanh điều hướng */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          className="btn btn-glass btn-sm"
          onClick={handleBackToGroupsList}
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          Quay lại danh sách
        </button>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary)' }}>
            {currentGroup.title}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Câu {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-glass btn-sm"
            onClick={() => setShowReportModal(true)}
            title="Báo lỗi câu hỏi này cho tác giả"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            Báo lỗi
          </button>
          <button
            className="btn btn-glass btn-sm"
            onClick={() => setShowPrintModal(true)}
            title="Tải xuống đề thi để in hoặc lưu trữ"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            Tải xuống
          </button>
          <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}>
            Trang chủ
          </button>
        </div>
      </div>

      {/* Tiến độ và điểm số */}
      <div className="grammar-progress-box glass-panel" style={{ marginBottom: '20px' }}>
        <div className="progress-info">
          <span>
            Câu hỏi: <strong>{currentIndex + 1}</strong> / {questions.length}
            {currentQuestion?.title && (
              <span style={{ marginLeft: '8px', color: '#38bdf8' }}>
                • {currentQuestion.title}
              </span>
            )}
          </span>
          <span>
            Đúng: <strong style={{ color: '#10b981' }}>{currentScore}</strong> / {questions.length}
          </span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Hiển thị câu hỏi tương tác (Hỗ trợ toàn bộ các dạng bài) */}
      {(() => {
        if (!currentQuestion) {
          return (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <p>Bài tập này hiện chưa có câu hỏi.</p>
              <button className="btn btn-glass" onClick={handleBackToGroupsList}>
                ← Quay lại danh sách bài
              </button>
            </div>
          );
        }

        const qKey = currentQuestion.id || currentIndex;

        switch (currentQuestion.type) {
          case 'SPOT_ERROR':
            return (
              <SpotTheErrorQuestion
                key={qKey}
                question={currentQuestion}
                onAnswerResult={handleAnswerResult}
              />
            );
          case 'IMAGE_QUESTION':
            return (
              <ImageQuestion
                key={qKey}
                question={currentQuestion}
                onAnswerResult={handleAnswerResult}
              />
            );
          case 'PASSAGE_CLOZE':
            return (
              <PassageClozeQuestion
                key={qKey}
                question={currentQuestion}
                onAnswerResult={handleAnswerResult}
              />
            );
          case 'READING_COMPREHENSION':
            return (
              <ReadingComprehensionQuestion
                key={qKey}
                question={currentQuestion}
                onAnswerResult={handleAnswerResult}
              />
            );
          case 'AUDIO_LISTENING':
            return (
              <AudioListeningQuestion
                key={qKey}
                question={currentQuestion}
                onAnswerResult={handleAnswerResult}
              />
            );
          case 'FILL_BLANK_TEXT':
          case 'FILL_BLANK_DROPDOWN':
          case 'FILL_BLANK_CARDS':
          default:
            return (
              <FillBlankQuestion
                key={qKey}
                question={currentQuestion}
                onAnswerResult={handleAnswerResult}
              />
            );
        }
      })()}

      {/* Thanh chọn số câu (Căn giữa, đẹp mắt) */}
      <div className="step-controls-bar" style={{ marginTop: '24px' }}>
        <button
          className="btn btn-glass"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
        >
          ← Câu trước
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
                title={`Câu ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button className="btn btn-primary" onClick={handleNext}>
          {currentIndex === questions.length - 1 ? "Hoàn thành" : "Câu tiếp"}
        </button>
      </div>

      {/* Modal hoàn thành */}
      {showCompletionModal && (
        <div className="completion-modal-overlay">
          <div className="glass-panel completion-modal-card animate-pop">
            <h2>Hoàn thành {currentGroup.title}</h2>
            <p>Bạn đã hoàn thành tất cả câu hỏi trong bài tập này.</p>

            <div className="completion-score-badge">
              {currentScore} / {questions.length} câu đúng
            </div>

            <div className="completion-actions-row">
              <button className="btn btn-glass" onClick={handleRestartGroup}>
                Làm lại bài
              </button>
              <button
                className="btn btn-glass"
                onClick={() => setShowReportModal(true)}
              >
                Báo lỗi
              </button>
              <button className="btn btn-primary" onClick={handleBackToGroupsList}>
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal in đề thi / xuất PDF trong session làm bài */}
      {showPrintModal && (
        <PrintTestModal
          groups={groups}
          currentGroupId={currentGroup?.id}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Modal báo lỗi câu hỏi gửi Gmail cho tác giả */}
      {showReportModal && (
        <ReportQuestionModal
          question={currentQuestion}
          allQuestions={questions}
          group={currentGroup}
          user={user}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default GrammarLearnerPage;
