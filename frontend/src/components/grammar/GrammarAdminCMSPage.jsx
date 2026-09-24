import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotTheErrorQuestion from './SpotTheErrorQuestion';
import FillBlankQuestion from './FillBlankQuestion';
import { getStoredQuestions, saveStoredQuestions, resetStoredQuestions } from './grammarQuestionsData';
import { CREATOR_EMAIL, isCreatorUser, setCreatorBypass } from './authHelper';
import './Grammar.css';

// Helper to convert technical question types into friendly Vietnamese badges and icons
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
        label: 'Điền Từ (Gõ chữ)',
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
        label: 'Chọn Thẻ (A, B, C, D)',
        icon: '🃏',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.35)'
      };
    default:
      return {
        label: type,
        icon: '📝',
        color: 'var(--text-muted)',
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

  const [lessonData, setLessonData] = useState(getStoredQuestions());
  const [activeTab, setActiveTab] = useState('SPOT_ERROR'); // SPOT_ERROR | FILL_BLANK_TEXT | FILL_BLANK_DROPDOWN | QUESTION_BANK
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- FORM STATES: SPOT THE ERROR ---
  const [spotSentence, setSpotSentence] = useState("She go to the market with her mother yesterday.");
  const [spotTokens, setSpotTokens] = useState([]);
  const [selectedErrorTokenId, setSelectedErrorTokenId] = useState(2);
  const [spotCorrection, setSpotCorrection] = useState("went");
  const [spotErrorType, setSpotErrorType] = useState("Thì quá khứ đơn / Tương hợp thời gian");
  const [spotExplanation, setSpotExplanation] = useState("Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở quá khứ đơn là 'went'.");
  const [spotHint, setSpotHint] = useState("Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu.");

  // Auto-tokenize sentence when text changes
  useEffect(() => {
    if (!spotSentence) {
      setSpotTokens([]);
      return;
    }
    const words = spotSentence.trim().split(/\s+/);
    const newTokens = words.map((w, idx) => ({
      id: idx + 1,
      text: w
    }));
    setSpotTokens(newTokens);
    if (!selectedErrorTokenId || selectedErrorTokenId > newTokens.length) {
      setSelectedErrorTokenId(newTokens.length >= 2 ? 2 : 1);
    }
  }, [spotSentence]);

  // --- FORM STATES: FILL BLANK (TEXT) ---
  const [fillTextInstruction, setFillTextInstruction] = useState("Điền dạng đúng của động từ trong ngoặc:");
  const [fillTextRaw, setFillTextRaw] = useState("If I {had:have} enough money, I {would buy|'d buy:buy} a new house.");
  const [fillTextExplanation, setFillTextExplanation] = useState("Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn, mệnh đề chính dùng Would + V-bare.");
  const [strictCase, setStrictCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);

  // Parse fill text raw syntax
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
      id: `q_fill_text_${Date.now()}`,
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

  // --- FORM STATES: FILL BLANK (DROPDOWN / CARDS) ---
  const [fillChoiceMode, setFillChoiceMode] = useState('DROPDOWN'); // DROPDOWN | CARDS
  const [fillChoiceInstruction, setFillChoiceInstruction] = useState("Chọn từ thích hợp để hoàn thành câu:");
  const [fillChoiceRaw, setFillChoiceRaw] = useState("She has been living here {*since|for|from|during} 2015.");
  const [fillChoiceExplanation, setFillChoiceExplanation] = useState("Dùng 'since' đi kèm với mốc thời gian cụ thể (2015).");

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
      id: `q_choice_${Date.now()}`,
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
        type: "SPOT_ERROR",
        instruction: "Chỉ ra lỗi sai trong câu sau (Xem trước trực tiếp):",
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

  // Handle Save Question
  const handleSaveQuestion = () => {
    let newQ = null;
    if (activeTab === 'SPOT_ERROR') {
      newQ = {
        id: `q_spot_${Date.now()}`,
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

    const updated = {
      ...lessonData,
      questions: [...lessonData.questions, newQ]
    };
    setLessonData(updated);
    saveStoredQuestions(updated);
    showToast("✨ Đã lưu câu hỏi thành công vào ngân hàng đề!");
  };

  // Delete question
  const handleDeleteQuestion = (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    const updated = {
      ...lessonData,
      questions: lessonData.questions.filter(q => q.id !== id)
    };
    setLessonData(updated);
    saveStoredQuestions(updated);
    showToast("🗑️ Đã xóa câu hỏi khỏi ngân hàng đề.");
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (!window.confirm("Khôi phục toàn bộ câu hỏi mẫu mặc định ban đầu?")) return;
    const res = resetStoredQuestions();
    setLessonData(res);
    showToast("🔄 Đã khôi phục câu hỏi mặc định ban đầu.");
  };

  const previewQ = getLivePreviewQuestion();

  // Helper to insert snippet into textareas
  const insertTextAtEnd = (stateSetter, currentVal, snippet) => {
    stateSetter(currentVal ? `${currentVal} ${snippet}` : snippet);
  };

  // Guard 1: Not logged in
  if (!isLoggedIn && !bypass) {
    return (
      <div className="grammar-container animate-fade-in">
        <div className="glass-panel" style={{ padding: '50px 30px', maxWidth: '620px', margin: '40px auto', textAlign: 'center', borderRadius: '24px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '26px', marginBottom: '12px', color: '#f8fafc' }}>
            Yêu Cầu Đăng Nhập
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6', fontSize: '15px' }}>
            Màn tạo câu hỏi chỉ dành riêng cho người tạo đề (Creator). 
            Bạn cần đăng nhập bằng tài khoản Creator (<strong>{CREATOR_EMAIL}</strong>) để tiếp tục.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Đăng Nhập Ngay ➔
            </button>
            <button className="btn btn-glass" onClick={() => navigate('/grammar')}>
              👤 Về Màn Hình Học Viên
            </button>
          </div>
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              className="btn btn-glass"
              style={{ fontSize: '12px', opacity: 0.8 }}
              onClick={() => {
                setCreatorBypass(true);
                setBypass(true);
              }}
            >
              ⚡ Bật nhanh quyền Creator tạm thời ({CREATOR_EMAIL}) để kiểm thử
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guard 2: Logged in but not Creator email
  if (isLoggedIn && !isCreator) {
    return (
      <div className="grammar-container animate-fade-in">
        <div className="glass-panel" style={{ padding: '50px 30px', maxWidth: '620px', margin: '40px auto', textAlign: 'center', borderRadius: '24px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#f43f5e' }}>
            Không Đủ Quyền Hạn
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6', fontSize: '15px' }}>
            Bạn đang đăng nhập với tài khoản <strong>{user?.email || 'Người dùng'}</strong>. 
            Màn tạo câu hỏi hiện chỉ được phân quyền tạm thời cho Creator: <strong>{CREATOR_EMAIL}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/grammar')}>
              👤 Về Màn Hình Học Viên
            </button>
            <button
              className="btn btn-glass"
              onClick={() => {
                setCreatorBypass(true);
                setBypass(true);
              }}
            >
              ⚡ Cấp Quyền Creator Tạm Thời
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-container animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="grammar-header-banner glass-panel">
        <div className="grammar-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="mode-badge admin-badge">🛠️ Creator CMS</span>
            <span style={{ fontSize: '13px', color: '#38bdf8' }}>
              👤 Đang quản trị: {user?.email || CREATOR_EMAIL}
            </span>
          </div>
          <h1>Trình Soạn Thảo Câu Hỏi Ngữ Pháp</h1>
          <p>Tạo và tùy biến bài tập trực quan với bộ tách từ thông minh và xem trước kết quả thời gian thực</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="banner-actions">
          <button className="btn btn-glass" onClick={() => navigate('/')}>
            🗂️ Về Flashcard
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/grammar')}
          >
            👤 Đến Màn Hình Học Viên
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="cms-tabs">
        <button
          className={`cms-tab-btn ${activeTab === 'SPOT_ERROR' ? 'active' : ''}`}
          onClick={() => setActiveTab('SPOT_ERROR')}
        >
          🔍 1. Tìm Lỗi Sai (Spot the Error)
        </button>
        <button
          className={`cms-tab-btn ${activeTab === 'FILL_BLANK_TEXT' ? 'active' : ''}`}
          onClick={() => setActiveTab('FILL_BLANK_TEXT')}
        >
          ✍️ 2A. Điền Từ (Gõ Phím)
        </button>
        <button
          className={`cms-tab-btn ${activeTab === 'FILL_BLANK_DROPDOWN' ? 'active' : ''}`}
          onClick={() => setActiveTab('FILL_BLANK_DROPDOWN')}
        >
          🔽 2B. Chọn Từ (Dropdown / Cards)
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Soạn Bài: Tìm Lỗi Sai Trong Câu</h3>
                  <div className="creator-toolbar" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setSpotSentence("She go to the market with her mother yesterday.");
                        setSpotCorrection("went");
                        setSpotErrorType("Thì quá khứ đơn / Tương hợp thời gian");
                        setSpotHint("Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu.");
                        setSpotExplanation("Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở quá khứ đơn là 'went'.");
                      }}
                    >
                      📄 Mẫu 1 (Quá khứ)
                    </button>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setSpotSentence("My brother don't like eating vegetables at all.");
                        setSpotCorrection("doesn't");
                        setSpotErrorType("Hòa hợp Chủ ngữ - Động từ");
                        setSpotHint("Hãy chú ý chủ ngữ 'My brother' là ngôi thứ ba số ít.");
                        setSpotExplanation("Chủ ngữ số ít 'My brother' cần đi với trợ động từ phủ định 'doesn't', không dùng 'don't'.");
                      }}
                    >
                      📄 Mẫu 2 (Chủ vị)
                    </button>
                  </div>
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
                    * Hệ thống sẽ tự động tách từng từ thành các khối có thể click ngay bên dưới.
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
                    👉 Đang chọn từ sai: <strong>"{spotTokens.find(t => t.id === selectedErrorTokenId)?.text || 'chưa chọn'}"</strong>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="creator-step-badge">BƯỚC 3: THIẾT LẬP ĐÁP ÁN ĐÚNG & PHÂN LOẠI</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Soạn Bài: Điền Từ Vào Ô Trống (Text Input)</h3>
                  <div className="creator-toolbar" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
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
                        setFillTextInstruction("Hoàn thành câu bằng cách điền từ thích hợp:");
                        setFillTextRaw("She usually {wakes:wake} up early and {goes:go} jogging.");
                        setFillTextExplanation("Thì Hiện tại đơn: Diễn tả thói quen lặp đi lặp lại với chủ ngữ ngôi thứ ba số ít (She).");
                      }}
                    >
                      📄 Mẫu Hiện Tại Đơn
                    </button>
                  </div>
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
                      + Ô trống kèm gợi ý: {'{đáp_án:gợi_ý}'}
                    </button>
                    <button
                      type="button"
                      className="creator-tool-btn"
                      onClick={() => insertTextAtEnd(setFillTextRaw, fillTextRaw, "{đáp_án_1|đáp_án_2:gợi_ý}")}
                    >
                      + Nhiều đáp án đúng: {'{đáp_án_1|đáp_án_2}'}
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
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chưa có ô trống nào. Hãy dùng nút bấm phía trên để chèn.</span>
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
                    Strict Case (Phân biệt chữ hoa / chữ thường)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={ignoreWhitespace}
                      onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                    />
                    Tự động xóa khoảng trắng thừa (Recommended)
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Soạn Bài: Chọn Đáp Án (Dropdown / Thẻ A, B, C, D)</h3>
                  <div className="creator-toolbar" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setFillChoiceMode('DROPDOWN');
                        setFillChoiceInstruction("Chọn từ thích hợp để hoàn thành câu:");
                        setFillChoiceRaw("She has been living here {*since|for|from|during} 2015.");
                        setFillChoiceExplanation("Dùng 'since' đi kèm với mốc thời gian cụ thể (2015) trong thì Hiện tại hoàn thành tiếp diễn.");
                      }}
                    >
                      📄 Mẫu Dropdown (Since/For)
                    </button>
                    <button
                      type="button"
                      className="creator-tool-btn sample-pill"
                      onClick={() => {
                        setFillChoiceMode('CARDS');
                        setFillChoiceInstruction("Chọn thẻ đáp án đúng để điền vào chỗ trống:");
                        setFillChoiceRaw("They are interested {*in|on|at|with} learning English online.");
                        setFillChoiceExplanation("Cấu trúc cố định: 'to be interested in something' (hứng thú với điều gì).");
                      }}
                    >
                      📄 Mẫu Thẻ (Giới từ)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Chế độ hiển thị cho học viên:</label>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="choiceMode"
                        checked={fillChoiceMode === 'DROPDOWN'}
                        onChange={() => setFillChoiceMode('DROPDOWN')}
                      />
                      🔽 Inline Dropdown (Danh sách thả xuống trong dòng)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="choiceMode"
                        checked={fillChoiceMode === 'CARDS'}
                        onChange={() => setFillChoiceMode('CARDS')}
                      />
                      🃏 Option Cards (Thẻ trắc nghiệm A, B, C, D)
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
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chưa có nhóm lựa chọn nào. Dùng dấu * cho đáp án đúng.</span>
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
              ✨ Lưu Câu Hỏi Này Vào Ngân Hàng Đề
            </button>
          </div>

          {/* RIGHT: LIVE INTERACTIVE PREVIEW */}
          <div className="admin-preview-card glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', color: '#a855f7' }}>👁️ Xem Trước Trực Tiếp (Live Preview)</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tương tác y hệt học viên</span>
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
        /* QUESTION BANK LIST (NO RAW JSON DISPLAY, CLEAN & FRIENDLY CARDS) */
        <div className="glass-panel" style={{ padding: '30px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', marginBottom: '6px' }}>Ngân Hàng Câu Hỏi Hiện Có</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Tổng cộng có <strong style={{ color: '#38bdf8' }}>{lessonData.questions?.length || 0}</strong> câu hỏi trong phiên học này.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-glass" onClick={handleResetDefaults}>
                🔄 Khôi Phục Mẫu Mặc Định
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(lessonData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `grammar_${lessonData.lesson_id}.json`;
                  a.click();
                  showToast("📥 Đang tải xuống tệp dữ liệu bài tập JSON...");
                }}
              >
                📥 Tải Xuống File JSON ({lessonData.questions?.length || 0} câu)
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div>
            {lessonData.questions?.map((q, idx) => {
              const typeInfo = getQuestionTypeInfo(q.type);

              return (
                <div key={q.id || idx} className="question-bank-card">
                  <div className="qbank-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                        Câu #{idx + 1}
                      </span>
                      <span style={{
                        fontSize: '13px',
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
                        className="btn btn-glass"
                        style={{ color: '#fb7185', padding: '6px 14px', fontSize: '13px' }}
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        🗑️ Xóa Câu Hỏi
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
