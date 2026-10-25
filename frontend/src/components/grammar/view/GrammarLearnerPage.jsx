import { t, locale } from '../../../i18n/index.js';
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
  getStoredQuestions,
  fetchGrammarQuestions,
  saveStoredQuestions,
  resolveQuestionReport,
  deleteGrammarQuestionFromBackend
} from '../model/grammarQuestionsData';
import { getQuestionTypeInfo, countQuestionTypesInGroup } from '../model/questionTypesRegistry';
import '../Grammar.css';

const GrammarLearnerPage = ({ user }) => {
  const navigate = useNavigate();

  // Danh sách các bài tập
  const [data, setData] = useState(() => getStoredQuestions());

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
  const userName = (user?.name || loggedInUser?.name || t('grammar:cong_dong_a0164a')).trim();

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

  // Quay lại danh sách bài tập
  const handleBackToGroupsList = () => {
    setData(getStoredQuestions());
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
    showToast(t('grammar:a_danh_dau_bao_cao_da_duoc_giai_quyet_93c0a8'));
  };

  // Mở tab Gmail để phản hồi trực tiếp cho học viên đã báo lỗi
  const handleReplyReportViaGmail = (rep) => {
    const subject = t('common:feedback_12', { v0: rep.testTitle, v1: rep.questionTitle });
    const body = t('common:feedback_13', { v0: rep.reporterName || t('grammar:ban_e8f043'), v1: rep.testTitle, v2: rep.questionTitle });
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(rep.reporterEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Xóa nhóm bài tập
  const handleDeleteGroup = (groupId, groupTitle) => {
    if (groups.length <= 1) {
      showToast(t('grammar:khong_the_xoa_nhom_bai_tap_duy_nhat_con__451a87'));
      return;
    }
    if (window.confirm(t('common:feedback_14', { v0: groupTitle }))) {
      const updatedGroups = groups.filter(g => g.id !== groupId);
      const updatedData = { ...data, groups: updatedGroups };
      setData(updatedData);
      saveStoredQuestions(updatedData);
      showToast(t('common:feedback_15', { v0: groupTitle }));
    }
  };

  // Xóa câu hỏi trong nhóm bài tập
  const handleDeleteQuestion = (groupId, questionId, questionTitle) => {
    if (window.confirm(t('common:feedback_16', { v0: questionTitle }))) {
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
      saveStoredQuestions(updatedData);
      deleteGrammarQuestionFromBackend(questionId);
      showToast(t('grammar:a_xoa_cau_hoi_khoi_bai_tap_49a0d3'));
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
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}> {t('grammar:bai_tap_ngu_phap_acae32')} </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}> {t('grammar:luyen_tap_cung_co_ngu_phap_tieng_anh_qua_fc6a4d')} </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/grammar/create')}
              title={t('grammar:tu_tao_bai_tap_moi_va_chia_se_len_bang_t_fac455')}
              style={{ fontWeight: 600 }}
            > {t('grammar:tao_bai_tap_moi_45b799')} </button>
            <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}> {t('grammar:trang_chu_738a4c')} </button>
          </div>
        </div>

        {/* THANH TAB ĐIỀU HƯỚNG: TẤT CẢ BÀI TẬP, BÀI TẬP CỦA TÔI, HỘP THƯ BÁO LỖI */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${learnerTab === 'ALL_TESTS' ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setLearnerTab('ALL_TESTS')}
            style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
          > {t('grammar:cac_bai_tap_hien_tai_0d6d2d')} </button>
          <button
            className={`btn ${learnerTab === 'MY_TESTS' ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setLearnerTab('MY_TESTS')}
            style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
          > {t('grammar:bai_tap_cua_toi_b2d380')} {myGroups.length} {t('grammar:bai_de7072')} </button>
          <button
            className={`btn ${learnerTab === 'REPORTS_INBOX' ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setLearnerTab('REPORTS_INBOX')}
            style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span> {t('grammar:hom_thu_bao_loi_70b9d9')} </span>
            {openReportsCount > 0 && (
              <span style={{ padding: '2px 6px', borderRadius: '10px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                {openReportsCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: TẤT CẢ BÀI TẬP HIỆN TẠI */}
        {learnerTab === 'ALL_TESTS' && (
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
                        <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}> {t('grammar:at_5d0190')} {score}/{count}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {count} {t('grammar:cau_hoi_d51ff7')} </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                      <span> {t('grammar:nguoi_tao_dc59e4')} <strong style={{ color: 'var(--text-main)' }}>{group.author?.name || t('grammar:cong_dong_a0164a')}</strong></span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTest(idx);
                    }}
                  > {t('grammar:bat_dau_lam_bai_cdd91b')} </button>
                </div>
              );
            })}
          </div>
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
                            {group.description || t('common:feedback_17', { v0: groupQuestions.length })}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStartTest(originalIdx >= 0 ? originalIdx : 0)}
                          > {t('grammar:lam_bai_nay_5aa110')} </button>
                          <button
                            className="btn btn-glass btn-sm"
                            onClick={() => navigate(`/grammar/create?groupId=${group.id}`)}
                            title={t('grammar:soan_them_cau_hoi_vao_bai_nay_8785d2')}
                          > {t('grammar:them_cau_hoi_4549cb')} </button>
                          <button
                            className="btn btn-glass btn-sm"
                            onClick={() => handleDeleteGroup(group.id, group.title)}
                            style={{ color: '#ef4444' }}
                            title={t('grammar:xoa_bai_tap_nay_ef88fe')}
                          > {t('grammar:xoa_bai_tap_1735f9')} </button>
                        </div>
                      </div>

                      {/* Các dạng câu hỏi có trong nhóm */}
                      {typeBreakdown.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}> {t('grammar:dang_cau_hoi_e3adf3')} </span>
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
                                  title={t('grammar:xoa_cau_hoi_nay_07a99e')}
                                > {t('grammar:xoa_aa1d94')} </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}> {t('grammar:bai_tap_nay_chua_co_cau_hoi_nao_01ac08')} </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}> {t('grammar:ban_chua_tao_bai_tap_nao_hay_bam_tao_bai_3a4879')} </p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/grammar/create')}> {t('grammar:tao_bai_tap_moi_45b799')} </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HỘP THƯ BÁO LỖI */}
        {learnerTab === 'REPORTS_INBOX' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-main)', fontWeight: 700 }}> {t('grammar:hop_thu_bao_loi_gop_y_38e026')} </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}> {t('grammar:cac_phan_anh_loi_cau_hoi_duoc_gui_truc_t_70f169')} </p>
              </div>
              <div style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: openReportsCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: openReportsCount > 0 ? '#ef4444' : '#10b981',
                fontWeight: 600,
                fontSize: '12px'
              }}>
                {openReportsCount > 0 ? t('common:feedback_18', { v0: openReportsCount }) : t('grammar:khong_co_bao_loi_nao_chua_xu_ly_798229')}
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
                            {isOpen ? t('grammar:chua_xu_ly_4dec22') : t('grammar:a_sua_bd2904')}
                          </span>
                          <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                            {rep.errorType}
                          </strong>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {rep.createdAt ? new Date(rep.createdAt).toLocaleString(locale()) : ''}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}> {t('grammar:bai_tap_d0a487')} <strong style={{ color: 'var(--primary)' }}>{rep.testTitle || rep.groupTitle}</strong> {t('grammar:cau_75f7c2')} <strong style={{ color: '#38bdf8' }}>{rep.questionTitle}</strong>
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
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}> {t('grammar:nguoi_gui_feefc2')} <strong>{rep.reporterName || t('grammar:nguoi_hoc_74895e')}</strong> ({rep.reporterEmail})
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {rep.reporterEmail && rep.reporterEmail !== t('grammar:hoc_vien_an_danh_908a8f') && (
                            <button
                              className="btn btn-glass btn-sm"
                              onClick={() => handleReplyReportViaGmail(rep)}
                              style={{ fontSize: '12px' }}
                              title={t('grammar:gui_email_phan_hoi_cho_hoc_vien_qua_gmai_f53850')}
                            > {t('grammar:mo_gmail_phan_hoi_3f3fbe')} </button>
                          )}
                          {isOpen && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleResolveReport(rep.groupId, rep.id)}
                              style={{ fontSize: '12px' }}
                            > {t('grammar:anh_dau_da_sua_277408')} </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}> {t('grammar:chua_co_bao_loi_nao_cho_cac_bai_tap_khi__4e1657')} </p>
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
        > {t('grammar:quay_lai_danh_sach_325426')} </button>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary)' }}>
            {currentGroup.title}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> {t('grammar:nguoi_tao_dc59e4')} <strong>{currentGroup.author?.name || t('grammar:cong_dong_a0164a')}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-glass btn-sm"
            onClick={() => setShowPrintModal(true)}
            title={t('grammar:tai_xuong_de_bai_tap_dang_pdf_hoac_file__21e2e8')}
            style={{ fontSize: '13px', fontWeight: 600 }}
          > {t('grammar:tai_xuong_ca78e2')} </button>
          <button
            className="btn btn-glass btn-sm"
            onClick={() => setShowReportModal(true)}
            title={t('grammar:bao_loi_cau_hoi_nay_cho_tac_gia_9bcce9')}
            style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}
          > {t('grammar:bao_loi_0048ce')} </button>
        </div>
      </div>

      {/* Thanh tiến độ */}
      <div className="progress-container glass-panel" style={{ padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span> {t('grammar:cau_hoi_61294b')} <strong>{currentIndex + 1}</strong> / {questions.length}
          </span>
          <span> {t('grammar:ung_acb110')} <strong style={{ color: '#10b981' }}>{currentScore}</strong> / {questions.length}
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
              <p> {t('grammar:bai_tap_nay_hien_chua_co_cau_hoi_7e70f2')} </p>
              <button className="btn btn-glass" onClick={handleBackToGroupsList}> {t('grammar:quay_lai_danh_sach_bai_f0fdae')} </button>
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
        > {t('grammar:cau_truoc_2cc696')} </button>

        <div className="step-numbers-box">
          {questions.map((_, idx) => {
            const key = `${currentGroup.id}_${idx}`;
            const state = answeredMap[key];
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`step-num-btn ${currentIndex === idx ? 'active' : ''} ${state === 'correct' ? 'done-correct' : state === 'incorrect' ? 'done-incorrect' : ''}`}
                title={t('common:feedback_19', { v0: idx + 1 })}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button className="btn btn-primary" onClick={handleNext}>
          {currentIndex === questions.length - 1 ? t('grammar:hoan_thanh_58f8d6') : t('grammar:cau_tiep_34ec24')}
        </button>
      </div>

      {/* Modal hoàn thành */}
      {showCompletionModal && (
        <div className="completion-modal-overlay">
          <div className="glass-panel completion-modal-card animate-pop">
            <h2> {t('grammar:hoan_thanh_58f8d6')} {currentGroup.title}</h2>
            <p> {t('grammar:ban_da_hoan_thanh_tat_ca_cau_hoi_trong_b_24e451')} </p>

            <div className="completion-score-badge">
              <div style={{ fontSize: '26px', fontWeight: 800, color: currentScore === questions.length ? '#10b981' : 'var(--primary)' }}>
                {currentScore} / {questions.length} {t('grammar:cau_dung_276d76')} </div>
              <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-muted)' }}>
                {currentScore === questions.length
                  ? t('grammar:xuat_sac_ban_da_tra_loi_dung_toan_bo_cac_12cbfc')
                  : currentScore > 0
                  ? t('common:feedback_20', { v0: currentScore })
                  : t('grammar:hay_on_lai_kien_thuc_va_thu_lai_de_cai_t_9493b1')}
              </div>
            </div>

            <div className="completion-actions-row">
              <button className="btn btn-glass" onClick={handleRestartGroup}> {t('grammar:lam_lai_bai_8be05b')} </button>
              <button
                className="btn btn-glass"
                onClick={() => setShowReportModal(true)}
              > {t('grammar:bao_loi_0048ce')} </button>
              <button className="btn btn-primary" onClick={handleBackToGroupsList}> {t('grammar:quay_lai_danh_sach_325426')} </button>
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
