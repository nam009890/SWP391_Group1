// ============================================================
// VIEW — Grammar Admin CMS Page (Question Creator & Bank)
// Allows creators (buiquangviet032@gmail.com) to author and manage
// grammar exercise questions with live preview and friendly UX.
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotTheErrorQuestion from './components/SpotTheErrorQuestion';
import FillBlankQuestion from './components/FillBlankQuestion';
import {
  getStoredQuestions,
  saveStoredQuestions,
  resetStoredQuestions,
  fetchGrammarQuestions,
  createGrammarQuestionInBackend,
  deleteGrammarQuestionFromBackend,
  resetGrammarQuestionsInBackend
} from '../model/grammarQuestionsData';
import { CREATOR_EMAIL, isCreatorUser, setCreatorBypass } from '../model/authHelper';
import '../Grammar.css';

// Friendly Vietnamese labels and styling for each question type
export const getQuestionTypeInfo = (type) => {
  switch (type) {
    case 'SPOT_ERROR':
      return {
        label: 'Tìm Lỗi Sai',
        icon: '🔍',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.35)'
      };
    case 'FILL_BLANK_TEXT':
      return {
        label: 'Điền Từ (Tự Gõ)',
        icon: '✍️',
        color: '#c084fc',
        bg: 'rgba(192, 132, 252, 0.15)',
        border: 'rgba(192, 132, 252, 0.35)'
      };
    case 'FILL_BLANK_DROPDOWN':
      return {
        label: 'Chọn Từ (Dropdown)',
        icon: '🔽',
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.15)',
        border: 'rgba(52, 211, 153, 0.35)'
      };
    case 'FILL_BLANK_CARDS':
      return {
        label: 'Chọn Thẻ Đáp Án',
        icon: '🃏',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.35)'
      };
    default:
      return {
        label: 'Câu Hỏi Ngữ Pháp',
        icon: '📝',
        color: '#94a3b8',
        bg: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.2)'
      };
  }
};

const GrammarAdminCMSPage = ({ user }) => {
  const navigate = useNavigate();
  const [bypass, setBypass] = useState(localStorage.getItem('studye_creator_bypass') === 'true');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token || !!user;
  const isCreator = isCreatorUser(user) || bypass;

  // Active Tab: SPOT_ERROR | FILL_BLANK_TEXT | FILL_BLANK_DROPDOWN | QUESTION_BANK
  const [activeTab, setActiveTab] = useState('SPOT_ERROR');
  const [toastMessage, setToastMessage] = useState('');
  const [lessonData, setLessonData] = useState(() => getStoredQuestions());

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    fetchGrammarQuestions().then(data => {
      if (data && data.questions && data.questions.length > 0) {
        setLessonData(data);
      }
    });
  }, []);

  // --- FORM STATE: 1. SPOT THE ERROR ---
  const [spotTitle, setSpotTitle] = useState("Tìm lỗi sai: Thì quá khứ đơn");
  const [spotSentence, setSpotSentence] = useState("She go to the market with her mother yesterday.");
  const [spotTokens, setSpotTokens] = useState([]);
  const [selectedErrorTokenId, setSelectedErrorTokenId] = useState(2);
  const [spotCorrection, setSpotCorrection] = useState("went");
  const [spotErrorType, setSpotErrorType] = useState("Thì quá khứ đơn / Tương hợp thời gian");
  const [spotHint, setSpotHint] = useState("Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu.");
  const [spotExplanation, setSpotExplanation] = useState("Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở quá khứ đơn là 'went'.");

  // Auto-tokenize sentence for Spot The Error
  useEffect(() => {
    const rawTokens = spotSentence.trim().split(/\s+/).filter(Boolean);
    const newTokens = rawTokens.map((t, idx) => ({
      id: idx + 1,
      text: t
    }));
    setSpotTokens(newTokens);
    if (!selectedErrorTokenId || selectedErrorTokenId > newTokens.length) {
      setSelectedErrorTokenId(newTokens.length >= 2 ? 2 : 1);
    }
  }, [spotSentence]);

  // --- FORM STATE: 2A. FILL BLANK (TEXT) ---
  const [fillTextTitle, setFillTextTitle] = useState("Điền từ: Câu điều kiện loại 2");
  const [fillTextInstruction, setFillTextInstruction] = useState("Điền dạng đúng của động từ trong ngoặc:");
  const [fillTextRaw, setFillTextRaw] = useState("If I {had:have} enough money, I {would buy|'d buy:buy} a new house.");
  const [fillTextExplanation, setFillTextExplanation] = useState("Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy).");
  const [strictCase, setStrictCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);

  // Parse fill text raw syntax {answer|alt:hint}
  const parseFillText = () => {
    let template = fillTextRaw;
    const blanks = {};
    let blankIndex = 1;

    const compiledTemplate = template.replace(/\{([^}]+)\}/g, (match, inner) => {
      const parts = inner.split(':');
      const answersPart = parts[0] || '';
      const hint = parts[1] || '';
      const acceptedAnswers = answersPart.split('|').map(s => s.trim()).filter(Boolean);

      blanks[blankIndex.toString()] = {
        hint: hint.trim(),
        accepted_answers: acceptedAnswers.length > 0 ? acceptedAnswers : ["answer"]
      };

      const tag = `{${blankIndex}}`;
      blankIndex++;
      return tag;
    });

    return {
      id: `cau_dien_tu_${Date.now()}`,
      title: fillTextTitle || "Câu hỏi: Điền từ vào chỗ trống",
      type: "FILL_BLANK_TEXT",
      instruction: fillTextInstruction,
      template: compiledTemplate,
      blanks,
      validation: {
        strict_case: strictCase,
        ignore_extra_whitespace: ignoreWhitespace
      },
      explanation: fillTextExplanation
    };
  };

  // Inspect detected blanks for Fill Text
  const getDetectedFillTextBlanks = () => {
    const list = [];
    const regex = /\{([^}]+)\}/g;
    let match;
    let idx = 1;
    while ((match = regex.exec(fillTextRaw)) !== null) {
      const parts = match[1].split(':');
      const answers = (parts[0] || '').split('|').map(s => s.trim()).filter(Boolean);
      const hint = (parts[1] || '').trim();
      list.push({ idx, answers, hint });
      idx++;
    }
    return list;
  };

  // --- FORM STATE: 2B. FILL BLANK (DROPDOWN / CARDS) ---
  const [fillChoiceTitle, setFillChoiceTitle] = useState("Chọn từ: Hiện tại hoàn thành tiếp diễn");
  const [fillChoiceMode, setFillChoiceMode] = useState('DROPDOWN'); // DROPDOWN | CARDS
  const [fillChoiceInstruction, setFillChoiceInstruction] = useState("Chọn từ thích hợp để hoàn thành câu:");
  const [fillChoiceRaw, setFillChoiceRaw] = useState("She has been living here {*since|for|from|during} 2015.");
  const [fillChoiceExplanation, setFillChoiceExplanation] = useState("Dùng 'since' đi kèm với mốc thời gian cụ thể (2015) trong thì Hiện tại hoàn thành tiếp diễn.");

  // Parse dropdown syntax: {*correct|distractor1|distractor2}
  const parseFillChoice = () => {
    let template = fillChoiceRaw;
    const blanks = {};
    let blankIndex = 1;

    const compiledTemplate = template.replace(/\{([^}]+)\}/g, (match, inner) => {
      const optionsRaw = inner.split('|').map(s => s.trim());
      let correctAnswer = '';
      const cleanOptions = [];

      optionsRaw.forEach(opt => {
        if (opt.startsWith('*')) {
          const clean = opt.substring(1).trim();
          correctAnswer = clean;
          cleanOptions.push(clean);
        } else {
          cleanOptions.push(opt);
        }
      });

      if (!correctAnswer && cleanOptions.length > 0) {
        correctAnswer = cleanOptions[0];
      }

      blanks[blankIndex.toString()] = {
        options: cleanOptions,
        correct_answer: correctAnswer
      };

      const tag = `{${blankIndex}}`;
      blankIndex++;
      return tag;
    });

    return {
      id: `cau_trac_nghiem_${Date.now()}`,
      title: fillChoiceTitle || (fillChoiceMode === 'DROPDOWN' ? "Câu hỏi: Chọn từ dropdown" : "Câu hỏi: Chọn thẻ đáp án"),
      type: fillChoiceMode === 'DROPDOWN' ? "FILL_BLANK_DROPDOWN" : "FILL_BLANK_CARDS",
      instruction: fillChoiceInstruction,
      template: compiledTemplate,
      blanks,
      explanation: fillChoiceExplanation
    };
  };

  // Inspect detected choices for Dropdown/Cards
  const getDetectedChoiceBlanks = () => {
    const list = [];
    const regex = /\{([^}]+)\}/g;
    let match;
    let idx = 1;
    while ((match = regex.exec(fillChoiceRaw)) !== null) {
      const optionsRaw = match[1].split('|').map(s => s.trim());
      let correct = '';
      const all = [];
      optionsRaw.forEach(opt => {
        if (opt.startsWith('*')) {
          const c = opt.substring(1).trim();
          correct = c;
          all.push(c);
        } else {
          all.push(opt);
        }
      });
      list.push({ idx, correct: correct || all[0], all });
      idx++;
    }
    return list;
  };

  // Build live preview object based on active tab
  const getLivePreviewQuestion = () => {
    if (activeTab === 'SPOT_ERROR') {
      return {
        id: "preview_spot",
        title: spotTitle,
        type: "SPOT_ERROR",
        instruction: "Chỉ ra lỗi sai trong câu sau:",
        tokens: spotTokens,
        correct_token_id: selectedErrorTokenId,
        correction: spotCorrection,
        error_type: spotErrorType,
        hint: spotHint,
        explanation: spotExplanation
      };
    }
    if (activeTab === 'FILL_BLANK_TEXT') {
      return parseFillText();
    }
    if (activeTab === 'FILL_BLANK_DROPDOWN') {
      return parseFillChoice();
    }
    return null;
  };

  // Insert helper for text inputs
  const insertTextAtEnd = (setter, currentVal, snippet) => {
    setter(currentVal + " " + snippet);
  };

  // Handle Save Question
  const handleSaveQuestion = async () => {
    let newQ = null;
    if (activeTab === 'SPOT_ERROR') {
      newQ = {
        id: `cau_tim_loi_${Date.now()}`,
        title: spotTitle || "Câu hỏi: Tìm lỗi sai",
        type: "SPOT_ERROR",
        instruction: "Chỉ ra lỗi sai trong câu sau:",
        tokens: spotTokens,
        correct_token_id: selectedErrorTokenId,
        correction: spotCorrection,
        error_type: spotErrorType,
        hint: spotHint,
        explanation: spotExplanation
      };
    } else if (activeTab === 'FILL_BLANK_TEXT') {
      newQ = parseFillText();
    } else if (activeTab === 'FILL_BLANK_DROPDOWN') {
      newQ = parseFillChoice();
    }

    if (!newQ) return;

    // Persist to Spring Boot backend
    await createGrammarQuestionInBackend(newQ);

    const updated = {
      ...lessonData,
      questions: [...lessonData.questions, newQ]
    };
    setLessonData(updated);
    saveStoredQuestions(updated);
    showToast("✨ Đã lưu câu hỏi thành công vào ngân hàng đề!");
  };

  // Delete question
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi danh sách?")) return;
    await deleteGrammarQuestionFromBackend(id);
    const updated = {
      ...lessonData,
      questions: lessonData.questions.filter(q => q.id !== id && q.dbId !== id)
    };
    setLessonData(updated);
    saveStoredQuestions(updated);
    showToast("🗑️ Đã xóa câu hỏi khỏi ngân hàng đề.");
  };

  // Reset to default
  const handleResetDefaults = async () => {
    if (!window.confirm("Khôi phục toàn bộ câu hỏi mẫu mặc định ban đầu?")) return;
    const res = await resetGrammarQuestionsInBackend();
    setLessonData(res);
    showToast("🔄 Đã khôi phục câu hỏi mặc định ban đầu.");
  };

  const previewQ = getLivePreviewQuestion();

  // --- ACCESS CONTROL GUARD ---
  if (!isLoggedIn) {
    return (
      <div className="grammar-container">
        <div className="creator-guard-box glass-panel">
          <div className="creator-guard-icon">🔒</div>
          <h2>Yêu Cầu Đăng Nhập</h2>
          <p>
            Bạn cần đăng nhập bằng tài khoản Quản trị viên (Creator) để truy cập chức năng tạo và quản lý ngân hàng câu hỏi.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              🔑 Đăng Nhập Ngay
            </button>
            <button className="btn btn-glass" onClick={() => navigate('/')}>
              ← Quay Lại Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="grammar-container">
        <div className="creator-guard-box glass-panel">
          <div className="creator-guard-icon">⚠️</div>
          <h2>Không Có Quyền Quản Trị</h2>
          <p>
            Tài khoản hiện tại của bạn không có quyền Quản trị viên (Creator).
            <br />
            Email được cấp quyền: <strong style={{ color: '#38bdf8' }}>{CREATOR_EMAIL}</strong>
          </p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-glass" onClick={() => navigate('/')}>
              ← Về Trang Chủ
            </button>
            <button
              className="btn btn-glass"
              style={{ fontSize: '13px', opacity: 0.7 }}
              onClick={() => {
                setCreatorBypass(true);
                setBypass(true);
              }}
            >
              🔓 Kích Hoạt Quyền Thử Nghiệm (Dev Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-container animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '85px',
          right: '25px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '12px',
          zIndex: 99999,
          fontWeight: '700',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          animation: 'popIn 0.25s ease'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="grammar-header-banner">
        <div className="grammar-title-group">
          <h1>🛠️ Hệ Thống Soạn Đề Ngữ Pháp (Creator CMS)</h1>
          <p>Thiết lập và quản lý ngân hàng câu hỏi tương tác cho học viên</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}>
            ⚡ Về Flashcard
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/grammar')}>
            👤 Màn Hình Học Viên
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="cms-tabs">
        <button
          className={`cms-tab-btn ${activeTab === 'SPOT_ERROR' ? 'active' : ''}`}
          onClick={() => setActiveTab('SPOT_ERROR')}
        >
          🔍 Tìm Lỗi Sai Trong Câu
        </button>
        <button
          className={`cms-tab-btn ${activeTab === 'FILL_BLANK_TEXT' ? 'active' : ''}`}
          onClick={() => setActiveTab('FILL_BLANK_TEXT')}
        >
          ✍️ Điền Từ (Tự Gõ)
        </button>
        <button
          className={`cms-tab-btn ${activeTab === 'FILL_BLANK_DROPDOWN' ? 'active' : ''}`}
          onClick={() => setActiveTab('FILL_BLANK_DROPDOWN')}
        >
          🔽 Trắc Nghiệm / Thẻ Chọn
        </button>
        <button
          className={`cms-tab-btn ${activeTab === 'QUESTION_BANK' ? 'active' : ''}`}
          onClick={() => setActiveTab('QUESTION_BANK')}
        >
          📚 Ngân Hàng Câu Hỏi ({lessonData.questions?.length || 0})
        </button>
      </div>

      {/* MAIN CMS CONTENT */}
      {activeTab !== 'QUESTION_BANK' ? (
        <div className="admin-cms-layout">
          {/* LEFT: FORM EDITOR */}
          <div className="admin-editor-card glass-panel">

            {/* 1. SPOT THE ERROR */}
            {activeTab === 'SPOT_ERROR' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Soạn Bài: Tìm Lỗi Sai Trong Câu</h3>
                  <div className="creator-toolbar" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setSpotTitle("Tìm lỗi sai: Thì quá khứ đơn");
                        setSpotSentence("She go to the market with her mother yesterday.");
                        setSpotCorrection("went");
                        setSpotErrorType("Thì quá khứ đơn / Tương hợp thời gian");
                        setSpotHint("Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu.");
                        setSpotExplanation("Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở quá khứ đơn là 'went'.");
                      }}
                    >
                      📄 Mẫu Quá Khứ
                    </button>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setSpotTitle("Tìm lỗi sai: Hòa hợp Chủ - Vị");
                        setSpotSentence("My brother don't like eating vegetables at all.");
                        setSpotCorrection("doesn't");
                        setSpotErrorType("Hòa hợp Chủ ngữ - Động từ");
                        setSpotHint("Hãy chú ý chủ ngữ 'My brother' là ngôi thứ ba số ít.");
                        setSpotExplanation("Chủ ngữ số ít 'My brother' cần đi với trợ động từ phủ định 'doesn't', không dùng 'don't'.");
                      }}
                    >
                      📄 Mẫu Chủ Vị
                    </button>
                  </div>
                </div>

                {/* Question Title */}
                <div className="form-group">
                  <label className="form-label">🏷️ Tên / Tiêu đề câu hỏi:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={spotTitle}
                    onChange={(e) => setSpotTitle(e.target.value)}
                    placeholder="Ví dụ: Câu 1: Tìm lỗi sai - Thì quá khứ đơn"
                  />
                </div>

                {/* Step 1 */}
                <div className="form-group">
                  <div className="creator-step-badge">BƯỚC 1: NHẬP CÂU VĂN CHỨA LỖI</div>
                  <input
                    type="text"
                    className="form-input"
                    value={spotSentence}
                    onChange={(e) => setSpotSentence(e.target.value)}
                    placeholder="Ví dụ: She go to the market with her mother yesterday."
                  />
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    * Hệ thống sẽ tự động phân tách câu thành từng từ để bạn click chọn lỗi sai ngay bên dưới.
                  </div>
                </div>

                {/* Step 2 */}
                <div className="form-group">
                  <div className="creator-step-badge">BƯỚC 2: CHỌN TỪ BỊ SAI (CLICK VÀO TỪ)</div>
                  <div className="token-picker-box">
                    {spotTokens.map((t) => (
                      <span
                        key={t.id}
                        className={`token-select-item ${selectedErrorTokenId === t.id ? 'error-target' : ''}`}
                        onClick={() => setSelectedErrorTokenId(t.id)}
                      >
                        {t.text} {selectedErrorTokenId === t.id && '🚩 (Vị trí lỗi)'}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '13px', color: '#38bdf8', marginTop: '6px' }}>
                    👉 Từ bị sai được chọn: <strong>"{spotTokens.find(t => t.id === selectedErrorTokenId)?.text || 'chưa chọn'}"</strong>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="creator-step-badge">BƯỚC 3: THIẾT LẬP ĐÁP ÁN ĐÚNG & PHÂN LOẠI</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Từ đúng thay thế:</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', fontWeight: '700' }}
                      value={spotCorrection}
                      onChange={(e) => setSpotCorrection(e.target.value)}
                      placeholder="went"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phân loại lỗi ngữ pháp:</label>
                    <select
                      className="form-select"
                      value={spotErrorType}
                      onChange={(e) => setSpotErrorType(e.target.value)}
                    >
                      <option value="Thì quá khứ đơn / Tương hợp thời gian">Thì quá khứ đơn / Tương hợp thời gian</option>
                      <option value="Hòa hợp Chủ ngữ - Động từ">Hòa hợp Chủ ngữ - Động từ</option>
                      <option value="Giới từ & Cụm giới từ">Giới từ & Cụm giới từ</option>
                      <option value="Dạng từ (Word Form)">Dạng từ (Word Form)</option>
                      <option value="Mạo từ (a/an/the)">Mạo từ (a/an/the)</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="creator-step-badge">BƯỚC 4: HƯỚNG DẪN & GIẢI THÍCH</div>
                <div className="form-group">
                  <label className="form-label">Gợi ý cho học viên (Hint):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={spotHint}
                    onChange={(e) => setSpotHint(e.target.value)}
                    placeholder="Hãy chú ý đến trạng từ chỉ thời gian..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Giải thích chi tiết & Quy tắc ngữ pháp:</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={spotExplanation}
                    onChange={(e) => setSpotExplanation(e.target.value)}
                    placeholder="Giải thích vì sao sai và quy tắc ngữ pháp tương ứng..."
                  ></textarea>
                </div>
              </div>
            )}

            {/* 2A. FILL BLANK TEXT */}
            {activeTab === 'FILL_BLANK_TEXT' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Soạn Bài: Điền Từ Vào Ô Trống (Text Input)</h3>
                  <div className="creator-toolbar" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setFillTextTitle("Điền từ: Câu điều kiện loại 2");
                        setFillTextInstruction("Điền dạng đúng của động từ trong ngoặc:");
                        setFillTextRaw("If I {had:have} enough money, I {would buy|'d buy:buy} a new house.");
                        setFillTextExplanation("Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy).");
                      }}
                    >
                      📄 Mẫu Điều Kiện
                    </button>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setFillTextTitle("Điền từ: Thì Hiện tại đơn");
                        setFillTextInstruction("Hoàn thành câu bằng cách điền từ thích hợp:");
                        setFillTextRaw("She usually {wakes:wake} up early and {goes:go} jogging.");
                        setFillTextExplanation("Thì Hiện tại đơn: Diễn tả thói quen lặp đi lặp lại với chủ ngữ ngôi thứ ba số ít (She).");
                      }}
                    >
                      📄 Mẫu Hiện Tại Đơn
                    </button>
                  </div>
                </div>

                {/* Question Title */}
                <div className="form-group">
                  <label className="form-label">🏷️ Tên / Tiêu đề câu hỏi:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fillTextTitle}
                    onChange={(e) => setFillTextTitle(e.target.value)}
                    placeholder="Ví dụ: Câu 2: Điền dạng đúng của động từ"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Yêu cầu bài tập (Instruction):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fillTextInstruction}
                    onChange={(e) => setFillTextInstruction(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div className="creator-step-badge">NỘI DUNG CÂU & CÔNG CỤ CHÈN Ô TRỐNG NHANH</div>
                  
                  {/* Quick Insert Toolbar */}
                  <div className="creator-toolbar">
                    <button
                      type="button"
                      className="creator-tool-btn"
                      onClick={() => insertTextAtEnd(setFillTextRaw, fillTextRaw, "{đáp_án}")}
                    >
                      + Ô trống: {'{đáp_án}'}
                    </button>
                    <button
                      type="button"
                      className="creator-tool-btn"
                      onClick={() => insertTextAtEnd(setFillTextRaw, fillTextRaw, "{đáp_án:gợi_ý}")}
                    >
                      + Có gợi ý: {'{đáp_án:gợi_ý}'}
                    </button>
                    <button
                      type="button"
                      className="creator-tool-btn"
                      onClick={() => insertTextAtEnd(setFillTextRaw, fillTextRaw, "{đáp_án_1|đáp_án_2:gợi_ý}")}
                    >
                      + Nhiều đáp án: {'{đáp_án_1|đáp_án_2}'}
                    </button>
                  </div>

                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={fillTextRaw}
                    onChange={(e) => setFillTextRaw(e.target.value)}
                  ></textarea>

                  {/* Real-time Detected Blanks Inspector */}
                  <div className="detected-blanks-container">
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#c084fc' }}>
                      📋 Các ô trống phát hiện được ({getDetectedFillTextBlanks().length} ô):
                    </div>
                    <div className="detected-blank-list">
                      {getDetectedFillTextBlanks().length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chưa có ô trống nào. Hãy dùng nút bấm phía trên để chèn nhanh.</span>
                      ) : (
                        getDetectedFillTextBlanks().map((b) => (
                          <div key={b.idx} className="detected-blank-card">
                            <span className="blank-number-tag">Ô {b.idx}</span>
                            <span>Đáp án: <strong style={{ color: '#34d399' }}>{b.answers.join(" | ")}</strong></span>
                            {b.hint && <span style={{ color: 'var(--text-muted)' }}>({b.hint})</span>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', margin: '20px 0', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={strictCase}
                      onChange={(e) => setStrictCase(e.target.checked)}
                    />
                    Phân biệt chữ hoa / thường (Strict Case)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={ignoreWhitespace}
                      onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                    />
                    Tự động xóa khoảng trắng thừa (Khuyên dùng)
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Giải thích chi tiết & Mẹo làm bài:</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={fillTextExplanation}
                    onChange={(e) => setFillTextExplanation(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}

            {/* 2B. FILL BLANK DROPDOWN / CARDS */}
            {activeTab === 'FILL_BLANK_DROPDOWN' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Soạn Bài: Chọn Đáp Án (Dropdown / Thẻ A, B, C, D)</h3>
                  <div className="creator-toolbar" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setFillChoiceTitle("Chọn từ: Hiện tại hoàn thành");
                        setFillChoiceMode('DROPDOWN');
                        setFillChoiceInstruction("Chọn từ thích hợp để hoàn thành câu:");
                        setFillChoiceRaw("They have lived in Vietnam {*for|since|from|during} 3 years.");
                        setFillChoiceExplanation("Dùng 'for' đi kèm với một khoảng thời gian (3 years) trong thì Hiện tại hoàn thành.");
                      }}
                    >
                      📄 Mẫu Dropdown
                    </button>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setFillChoiceTitle("Chọn thẻ: Giới từ chỉ cảm xúc");
                        setFillChoiceMode('CARDS');
                        setFillChoiceInstruction("Chọn thẻ đáp án đúng để điền vào chỗ trống:");
                        setFillChoiceRaw("They are interested {*in|on|at|with} learning English online.");
                        setFillChoiceExplanation("Cấu trúc cố định: 'to be interested in something' (thích thú với điều gì).");
                      }}
                    >
                      📄 Mẫu Thẻ Trắc Nghiệm
                    </button>
                  </div>
                </div>

                {/* Question Title */}
                <div className="form-group">
                  <label className="form-label">🏷️ Tên / Tiêu đề câu hỏi:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fillChoiceTitle}
                    onChange={(e) => setFillChoiceTitle(e.target.value)}
                    placeholder="Ví dụ: Câu 3: Chọn từ thích hợp"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kiểu hiển thị cho người học:</label>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="choiceMode"
                        checked={fillChoiceMode === 'DROPDOWN'}
                        onChange={() => setFillChoiceMode('DROPDOWN')}
                      />
                      🔽 Danh sách thả xuống (Inline Dropdown)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="choiceMode"
                        checked={fillChoiceMode === 'CARDS'}
                        onChange={() => setFillChoiceMode('CARDS')}
                      />
                      🃏 Thẻ trắc nghiệm (Option Cards)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Yêu cầu bài tập:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fillChoiceInstruction}
                    onChange={(e) => setFillChoiceInstruction(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div className="creator-step-badge">NỘI DUNG CÂU & CÔNG CỤ CHÈN CÁC LỰA CHỌN</div>
                  <div className="creator-toolbar">
                    <button
                      type="button"
                      className="creator-tool-btn"
                      onClick={() => insertTextAtEnd(setFillChoiceRaw, fillChoiceRaw, "{*đúng|sai_1|sai_2|sai_3}")}
                    >
                      + Nhóm 4 lựa chọn: {'{*đúng|sai_1|sai_2|sai_3}'}
                    </button>
                  </div>

                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={fillChoiceRaw}
                    onChange={(e) => setFillChoiceRaw(e.target.value)}
                  ></textarea>

                  {/* Real-time Detected Choices Inspector */}
                  <div className="detected-blanks-container">
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>
                      📋 Nhóm lựa chọn phát hiện được ({getDetectedChoiceBlanks().length} vị trí):
                    </div>
                    <div className="detected-blank-list">
                      {getDetectedChoiceBlanks().length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chưa có nhóm lựa chọn nào. Dùng dấu * trước đáp án đúng.</span>
                      ) : (
                        getDetectedChoiceBlanks().map((b) => (
                          <div key={b.idx} className="detected-blank-card">
                            <span className="blank-number-tag">Vị trí {b.idx}</span>
                            <span>Đúng: <strong style={{ color: '#34d399' }}>✓ {b.correct}</strong></span>
                            <span style={{ color: 'var(--text-muted)' }}>({b.all.length} lựa chọn)</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Giải thích chi tiết:</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={fillChoiceExplanation}
                    onChange={(e) => setFillChoiceExplanation(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '16px' }}
              onClick={handleSaveQuestion}
            >
              ✨ Lưu Câu Hỏi Vào Ngân Hàng Đề
            </button>
          </div>

          {/* RIGHT: LIVE INTERACTIVE PREVIEW */}
          <div className="admin-preview-card glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', color: '#a855f7', margin: 0 }}>👁️ Xem Trước Trực Tiếp (Live Preview)</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Thao tác như học viên</span>
            </div>

            {previewQ && (
              previewQ.type === 'SPOT_ERROR' ? (
                <SpotTheErrorQuestion question={previewQ} />
              ) : (
                <FillBlankQuestion question={previewQ} />
              )
            )}
          </div>
        </div>
      ) : (
        /* QUESTION BANK LIST (CLEAN, FRIENDLY CARDS — NO RAW JSON) */
        <div className="glass-panel" style={{ padding: '30px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', marginBottom: '6px' }}>Ngân Hàng Câu Hỏi Hiện Có</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Tổng cộng có <strong style={{ color: '#38bdf8' }}>{lessonData.questions?.length || 0}</strong> câu hỏi trong ngân hàng đề.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-glass btn-sm" onClick={handleResetDefaults}>
                🔄 Khôi Phục Mẫu Mặc Định
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(lessonData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `grammar_${lessonData.lesson_id}.json`;
                  a.click();
                  showToast("📥 Đang tải xuống tệp dữ liệu bài tập...");
                }}
              >
                📥 Tải Bộ Câu Hỏi ({lessonData.questions?.length || 0} câu)
              </button>
            </div>
          </div>

          {/* Clean Cards List */}
          <div>
            {lessonData.questions?.map((q, idx) => {
              const typeInfo = getQuestionTypeInfo(q.type);
              const displayName = q.title || `Câu #${idx + 1}: ${typeInfo.label}`;

              return (
                <div key={q.id || idx} className="question-bank-card">
                  <div className="qbank-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '17px', fontWeight: '800', color: '#f8fafc' }}>
                        {displayName}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: typeInfo.color,
                        background: typeInfo.bg,
                        border: `1px solid ${typeInfo.border}`,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-glass btn-sm"
                        style={{ color: '#fb7185' }}
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        🗑️ Xóa Câu
                      </button>
                    </div>
                  </div>

                  {/* Question Sentence Body */}
                  <div className="qbank-card-body">
                    {q.type === 'SPOT_ERROR' ? (
                      <div>
                        {q.tokens?.map((t) => (
                          <span
                            key={t.id}
                            style={{
                              marginRight: '6px',
                              padding: t.id === q.correct_token_id ? '2px 8px' : '0',
                              borderRadius: '4px',
                              background: t.id === q.correct_token_id ? 'rgba(244, 63, 94, 0.25)' : 'transparent',
                              borderBottom: t.id === q.correct_token_id ? '2px solid #f43f5e' : 'none',
                              color: t.id === q.correct_token_id ? '#fda4af' : 'inherit',
                              fontWeight: t.id === q.correct_token_id ? '700' : 'normal'
                            }}
                          >
                            {t.text}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div>{q.template}</div>
                    )}
                  </div>

                  {/* Question Metadata & Answers */}
                  <div className="qbank-card-meta">
                    {q.type === 'SPOT_ERROR' ? (
                      <>
                        <div className="qbank-answer-highlight">
                          <span>✓ Đáp án đúng:</span>
                          <strong>{q.correction}</strong>
                        </div>
                        {q.error_type && (
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px' }}>
                            {q.error_type}
                          </span>
                        )}
                      </>
                    ) : (
                      Object.keys(q.blanks || {}).map((bKey) => {
                        const bConf = q.blanks[bKey];
                        const answerText = bConf.correct_answer || (bConf.accepted_answers && bConf.accepted_answers.join(' | '));
                        return (
                          <div key={bKey} className="qbank-answer-highlight">
                            <span>Vị trí #{bKey}:</span>
                            <strong>{answerText}</strong>
                            {bConf.hint && <span style={{ opacity: 0.8 }}>({bConf.hint})</span>}
                          </div>
                        );
                      })
                    )}

                    {q.explanation && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        💡 {q.explanation}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarAdminCMSPage;
