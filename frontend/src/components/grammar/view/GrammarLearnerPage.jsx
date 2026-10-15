// =========================================================================================
// VIEW LAYER — GRAMMAR LEARNER PAGE (GIAO DIỆN HỌC VIÊN LÀM BÀI TẬP & QUẢN LÝ BÀI TẬP)
// =========================================================================================
// 1. Khắc phục lỗi Header bị che/clip dưới thanh Navbar cố định (paddingTop chuẩn).
// 2. Tích hợp tab "Tất cả bài tập", "Bài tập của tôi" và "Hòm thư báo lỗi" ngay ngoài màn hình chính.
// 3. Tính điểm chính xác cho từng câu hỏi khi hoàn thành bài tập (currentScore / questions.length).
// 4. Loại bỏ trùng lặp dạng bài thẻ đáp án (chỉ dùng menu thả xuống chuẩn).
// =========================================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotTheErrorQuestion from './components/SpotTheErrorQuestion';
import FillBlankQuestion from './components/FillBlankQuestion';
import ImageQuestion from './components/ImageQuestion';
import PassageClozeQuestion from './components/PassageClozeQuestion';
import ReadingComprehensionQuestion from './components/ReadingComprehensionQuestion';
import AudioListeningQuestion from './components/AudioListeningQuestion';
import PrintTestModal from './components/PrintTestModal';
import ReportQuestionModal from './components/ReportQuestionModal';
import {
  fetchGrammarQuestions,
  resolveQuestionReport,
  deleteGrammarQuestionFromBackend,
  deleteGrammarGroupInBackend,
  EMPTY_GRAMMAR_DATA
} from '../model/grammarQuestionsData';
import { getQuestionTypeInfo, countQuestionTypesInGroup } from '../model/questionTypesRegistry';
import '../Grammar.css';

const GrammarLearnerPage = ({ user }) => {
  const navigate = useNavigate();

  // Dữ liệu danh sách bài tập từ Database
  const [data, setData] = useState(EMPTY_GRAMMAR_DATA);
  const [loading, setLoading] = useState(true);

  // Chế độ xem: 'GROUPS_LIST' (Xem danh sách bài) hoặc 'TEST_SESSION' (Làm bài)
  const [viewMode, setViewMode] = useState('GROUPS_LIST');

  // Tab ngoài trang chính: 'ALL_TESTS' | 'MY_TESTS' | 'REPORTS_INBOX'
  const [learnerTab, setLearnerTab] = useState('ALL_TESTS');

  // Bài tập đang được chọn
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  // Câu hỏi hiện tại
  const [currentIndex, setCurrentIndex] = useState(0);

  // Điểm số đã lưu của từng bài: { [groupId]: number }
  const [scoreMap, setScoreMap] = useState({});

  // Trạng thái từng câu: { [`${groupId}_${idx}`]: 'correct' | 'incorrect' }
  const [answeredMap, setAnsweredMap] = useState({});

  // Modal kết quả khi làm xong bài
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Modal in đề thi / xuất PDF
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Modal báo lỗi câu hỏi gửi cho tác giả qua Gmail
  const [showReportModal, setShowReportModal] = useState(false);

  // Thông báo toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Lấy thông tin người dùng đang đăng nhập
  const storedUserStr = localStorage.getItem('user');
  let loggedInUser = null;
  try {
    loggedInUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  } catch (e) {
    loggedInUser = null;
  }
  const userEmail = (user?.email || loggedInUser?.email || '').toLowerCase().trim();
  const userName = (user?.name || loggedInUser?.name || 'Cộng đồng').trim();

  useEffect(() => {
    setLoading(true);
    fetchGrammarQuestions().then(res => {
      if (res && Array.isArray(res.groups)) {
        setData(res);
      }
      setLoading(false);
    });
  }, []);

  const groups = data.groups || [];
  const currentGroup = groups[selectedGroupIndex] || groups[0];
  const questions = currentGroup?.questions || [];
  const currentQuestion = questions[currentIndex];

  // Danh sách các bài tập do người dùng hiện tại tạo ra
  const myGroups = groups.filter(g => {
    const authorEmail = (g.author?.email || '').toLowerCase().trim();
    const authorName = (g.author?.name || '').toLowerCase().trim();
    if (userEmail && authorEmail === userEmail) return true;
    if (userName && authorName === userName) return true;
    return false;
  });

  // Toàn bộ báo cáo lỗi từ các bài tập của người dùng (hoặc tất cả bài)
  const allReports = groups.flatMap(g =>
    (g.reports || []).map(r => ({ ...r, groupTitle: g.title, groupId: g.id }))
  );
  const openReportsCount = allReports.filter(r => r.status === 'OPEN').length;

  // Tính điểm số chính xác dựa trên answeredMap
  const currentScore = useMemo(() => {
    if (!currentGroup || !questions || questions.length === 0) return 0;
    return questions.reduce((acc, _, idx) => {
      return acc + (answeredMap[`${currentGroup.id}_${idx}`] === 'correct' ? 1 : 0);
    }, 0);
  }, [currentGroup, questions, answeredMap]);

  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  // Bắt đầu làm bài
  const handleStartTest = (index) => {
    setSelectedGroupIndex(index);
    setCurrentIndex(0);
    setViewMode('TEST_SESSION');
    setShowCompletionModal(false);
  };

  // Quay lại danh sách bài tập (nạp lại dữ liệu mới nhất từ Database)
  const handleBackToGroupsList = () => {
    fetchGrammarQuestions().then(res => {
      if (res && Array.isArray(res.groups)) {
        setData(res);
      }
    });
    setViewMode('GROUPS_LIST');
    setShowCompletionModal(false);
  };

  // Xử lý khi người học kiểm tra đáp án
  const handleAnswerResult = (isCorrect) => {
    const key = `${currentGroup?.id}_${currentIndex}`;
    setAnsweredMap(prev => ({
      ...prev,
      [key]: isCorrect ? 'correct' : 'incorrect'
    }));
  };

  // Câu tiếp hoặc Hoàn thành
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Lưu lại kết quả bài test vào scoreMap
      setScoreMap(prev => ({
        ...prev,
        [currentGroup.id]: currentScore
      }));
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
    setAnsweredMap(prev => {
      const next = { ...prev };
      questions.forEach((_, idx) => delete next[`${currentGroup.id}_${idx}`]);
      return next;
    });
    setScoreMap(prev => ({ ...prev, [currentGroup.id]: 0 }));
    setShowCompletionModal(false);
  };

  // Đánh dấu đã xử lý báo lỗi
  const handleResolveReport = (groupId, reportId) => {
    const updated = resolveQuestionReport(groupId, reportId);
    setData(updated);
    showToast("Đã đánh dấu báo cáo đã được giải quyết!");
  };

  // Mở tab Gmail để phản hồi trực tiếp cho học viên đã báo lỗi
  const handleReplyReportViaGmail = (rep) => {
    const subject = `[StudyE - Phản hồi từ tác giả] Bài tập: ${rep.testTitle} - ${rep.questionTitle}`;
    const body = `Xin chào ${rep.reporterName || 'bạn'},\n\nMình là tác giả bài tập "${rep.testTitle}" trên StudyE. Cảm ơn bạn rất nhiều vì đã báo lỗi cho câu hỏi "${rep.questionTitle}".\n\nMình đã kiểm tra lại và cập nhật câu hỏi theo góp ý của bạn.\n\nChúc bạn học tập thật tốt trên StudyE nhé!\n\nThân ái,`;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(rep.reporterEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Xóa nhóm bài tập
  const handleDeleteGroup = (groupId, groupTitle) => {
    if (groups.length <= 1) {
      showToast("Không thể xóa nhóm bài tập duy nhất còn lại!");
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${groupTitle}" cùng toàn bộ câu hỏi bên trong?`)) {
      const updatedGroups = groups.filter(g => g.id !== groupId);
      const updatedData = { ...data, groups: updatedGroups };
      setData(updatedData);
      deleteGrammarGroupInBackend(groupId);
      showToast(`Đã xóa bài tập "${groupTitle}".`);
    }
  };

  // Xóa câu hỏi trong nhóm bài tập
  const handleDeleteQuestion = (groupId, questionId, questionTitle) => {
    if (window.confirm(`Bạn có chắc muốn xóa câu hỏi "${questionTitle}"?`)) {
      const updatedGroups = groups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            questions: (g.questions || []).filter(q => q.id !== questionId)
          };
        }
        return g;
      });
      const updatedData = { ...data, groups: updatedGroups };
      setData(updatedData);
      deleteGrammarQuestionFromBackend(questionId);
      showToast("Đã xóa câu hỏi khỏi bài tập!");
    }
  };

  // =========================================================================================
  // MÀN HÌNH 1: DANH SÁCH BÀI TẬP & QUẢN LÝ (GROUPS_LIST)
  // =========================================================================================
  if (viewMode === 'GROUPS_LIST') {
    return (
      <div
        className="grammar-container animate-fade-in"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          paddingTop: 'calc(var(--nav-height, 70px) + 30px)',
          paddingBottom: '60px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: '#10b981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 9999,
            fontWeight: 600,
            fontSize: '14px'
          }}>
            {toastMessage}
          </div>
        )}

        {/* Thanh tiêu đề trên cùng */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              Bài tập ngữ pháp
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              Luyện tập củng cố ngữ pháp tiếng Anh qua các bài tập tương tác:
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

        {/* THANH TAB ĐIỀU HƯỚNG: TẤT CẢ BÀI TẬP, BÀI TẬP CỦA TÔI, HỘP THƯ BÁO LỖI */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${learnerTab === 'ALL_TESTS' ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setLearnerTab('ALL_TESTS')}
            style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
          >
            Các bài tập hiện tại
          </button>
          <button
            className={`btn ${learnerTab === 'MY_TESTS' ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setLearnerTab('MY_TESTS')}
            style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
          >
            Bài tập của tôi ({myGroups.length} bài)
          </button>
          <button
            className={`btn ${learnerTab === 'REPORTS_INBOX' ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setLearnerTab('REPORTS_INBOX')}
            style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Hòm thư báo lỗi</span>
            {openReportsCount > 0 && (
              <span style={{ padding: '2px 6px', borderRadius: '10px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                {openReportsCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: TẤT CẢ BÀI TẬP HIỆN TẠI (TỪ DATABASE) */}
        {learnerTab === 'ALL_TESTS' && (
          loading ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Đang tải danh sách bài tập từ cơ sở dữ liệu...
            </div>
          ) : groups.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '16px', marginBottom: '16px' }}>Chưa có bài tập ngữ pháp nào trong cơ sở dữ liệu.</p>
              <button className="btn btn-primary" onClick={() => navigate('/grammar/admin')}>
                Tạo bài tập đầu tiên
              </button>
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }} className="animate-fade-in">
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                      <span>Người tạo: <strong style={{ color: 'var(--text-main)' }}>{group.author?.name || 'Cộng đồng'}</strong></span>
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
          )
        )}

        {/* TAB 2: BÀI TẬP CỦA TÔI */}
        {learnerTab === 'MY_TESTS' && (
          <div className="animate-fade-in">
            {myGroups.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {myGroups.map((group, gIdx) => {
                  const groupQuestions = group.questions || [];
                  const typeBreakdown = countQuestionTypesInGroup(groupQuestions);
                  const originalIdx = groups.findIndex(g => g.id === group.id);

                  return (
                    <div key={group.id || gIdx} className="glass-panel" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--primary)' }}>
                            {group.title}
                          </h4>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {group.description || `${groupQuestions.length} câu hỏi`}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStartTest(originalIdx >= 0 ? originalIdx : 0)}
                          >
                            Làm bài này
                          </button>
                          <button
                            className="btn btn-glass btn-sm"
                            onClick={() => navigate(`/grammar/create?groupId=${group.id}`)}
                            title="Soạn thêm câu hỏi vào bài này"
                          >
                            Thêm câu hỏi
                          </button>
                          <button
                            className="btn btn-glass btn-sm"
                            onClick={() => handleDeleteGroup(group.id, group.title)}
                            style={{ color: '#ef4444' }}
                            title="Xóa bài tập này"
                          >
                            Xóa bài tập
                          </button>
                        </div>
                      </div>

                      {/* Các dạng câu hỏi có trong nhóm */}
                      {typeBreakdown.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Dạng câu hỏi:
                          </span>
                          {typeBreakdown.map((tInfo, tIdx) => (
                            <span
                              key={tIdx}
                              style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: tInfo.bg,
                                color: tInfo.color,
                                border: `1px solid ${tInfo.border}`
                              }}
                            >
                              {tInfo.label} ({tInfo.count})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Danh sách câu hỏi */}
                      {groupQuestions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {groupQuestions.map((q, qIdx) => {
                            const typeMeta = getQuestionTypeInfo(q.type);
                            return (
                              <div
                                key={q.id || qIdx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '22px' }}>
                                    #{qIdx + 1}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: typeMeta.bg,
                                      color: typeMeta.color
                                    }}
                                  >
                                    {typeMeta.shortLabel}
                                  </span>
                                  <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                                    {q.title}
                                  </span>
                                </div>
                                <button
                                  className="btn btn-glass btn-sm"
                                  onClick={() => handleDeleteQuestion(group.id, q.id, q.title)}
                                  style={{ color: '#ef4444', fontSize: '12px', padding: '4px 8px' }}
                                  title="Xóa câu hỏi này"
                                >
                                  Xóa
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                          Bài tập này chưa có câu hỏi nào.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Bạn chưa tạo bài tập nào. Hãy bấm "Tạo bài tập mới" để chia sẻ bài tập của bạn!
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/grammar/create')}>
                  Tạo bài tập mới
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HỘP THƯ BÁO LỖI */}
        {learnerTab === 'REPORTS_INBOX' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-main)', fontWeight: 700 }}>
                  Hộp Thư Báo Lỗi & Góp Ý
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Các phản ánh lỗi câu hỏi được gửi trực tiếp từ người học.
                </p>
              </div>
              <div style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: openReportsCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: openReportsCount > 0 ? '#ef4444' : '#10b981',
                fontWeight: 600,
                fontSize: '12px'
              }}>
                {openReportsCount > 0 ? `${openReportsCount} báo lỗi đang chờ xử lý` : 'Không có báo lỗi nào chưa xử lý'}
              </div>
            </div>

            {allReports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {allReports.map((rep, rIdx) => {
                  const isOpen = rep.status === 'OPEN';
                  return (
                    <div
                      key={rep.id || rIdx}
                      className="glass-panel"
                      style={{
                        padding: '18px',
                        borderRadius: '12px',
                        border: `1px solid ${isOpen ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                        background: isOpen ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isOpen ? '#ef4444' : '#10b981',
                            color: '#fff'
                          }}>
                            {isOpen ? 'CHƯA XỬ LÝ' : 'ĐÃ SỬA'}
                          </span>
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                            {rep.errorType}
                          </strong>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {rep.createdAt ? new Date(rep.createdAt).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Bài tập: <strong style={{ color: 'var(--primary)' }}>{rep.testTitle || rep.groupTitle}</strong> • Câu: <strong style={{ color: '#38bdf8' }}>{rep.questionTitle}</strong>
                      </div>

                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        lineHeight: '1.5',
                        marginBottom: '12px',
                        borderLeft: '3px solid #ef4444'
                      }}>
                        "{rep.description}"
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Người gửi: <strong>{rep.reporterName || 'Người học'}</strong> ({rep.reporterEmail})
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {rep.reporterEmail && rep.reporterEmail !== 'Học viên ẩn danh' && (
                            <button
                              className="btn btn-glass btn-sm"
                              onClick={() => handleReplyReportViaGmail(rep)}
                              style={{ fontSize: '12px' }}
                              title="Gửi email phản hồi cho học viên qua Gmail"
                            >
                              Mở Gmail phản hồi
                            </button>
                          )}
                          {isOpen && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleResolveReport(rep.groupId, rep.id)}
                              style={{ fontSize: '12px' }}
                            >
                              Đánh dấu đã sửa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                  Chưa có báo lỗi nào cho các bài tập. Khi có phản ánh, thông tin sẽ hiển thị tại đây.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================================
  // MÀN HÌNH 2: LÀM BÀI TẬP TRONG NHÓM ĐÃ CHỌN (TEST_SESSION)
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
            Người tạo: <strong>{currentGroup.author?.name || 'Cộng đồng'}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-glass btn-sm"
            onClick={() => setShowPrintModal(true)}
            title="Tải xuống đề bài tập dạng PDF hoặc file đề thi"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            Tải xuống
          </button>
          <button
            className="btn btn-glass btn-sm"
            onClick={() => setShowReportModal(true)}
            title="Báo lỗi câu hỏi này cho tác giả"
            style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}
          >
            Báo lỗi
          </button>
        </div>
      </div>

      {/* Thanh tiến độ */}
      <div className="progress-container glass-panel" style={{ padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span>
            Câu hỏi: <strong>{currentIndex + 1}</strong> / {questions.length}
          </span>
          <span>
            Đúng: <strong style={{ color: '#10b981' }}>{currentScore}</strong> / {questions.length}
          </span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Hiển thị câu hỏi tương tác */}
      {(() => {
        if (!currentQuestion) {
          return (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <p>Bài tập này hiện chưa có câu hỏi.</p>
              <button className="btn btn-glass" onClick={handleBackToGroupsList}>
                Quay lại danh sách bài
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

      {/* Thanh chọn số câu */}
      <div className="step-controls-bar" style={{ marginTop: '24px' }}>
        <button
          className="btn btn-glass"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
        >
          Câu trước
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
              <div style={{ fontSize: '26px', fontWeight: 800, color: currentScore === questions.length ? '#10b981' : 'var(--primary)' }}>
                {currentScore} / {questions.length} câu đúng
              </div>
              <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-muted)' }}>
                {currentScore === questions.length
                  ? 'Xuất sắc! Bạn đã trả lời đúng toàn bộ các câu hỏi.'
                  : currentScore > 0
                  ? `Bạn đã hoàn thành tốt ${currentScore} câu hỏi.`
                  : 'Hãy ôn lại kiến thức và thử lại để cải thiện kết quả nhé!'}
              </div>
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

      {/* Modal tải xuống đề bài tập */}
      {showPrintModal && (
        <PrintTestModal
          groups={groups}
          currentGroupId={currentGroup?.id}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* Modal báo lỗi câu hỏi */}
      {showReportModal && (
        <ReportQuestionModal
          currentGroup={currentGroup}
          currentQuestion={currentQuestion}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default GrammarLearnerPage;
