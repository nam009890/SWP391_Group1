// ============================================================
// MODEL LAYER — Grammar Questions Data & Storage Helper
// ============================================================

/** Default lesson data with sample questions for every supported type. */
export const INITIAL_GRAMMAR_DATA = {
  lesson_id: "grammar_module_01",
  lesson_title: "Ngữ Pháp Căn Bản: Thì & Câu Điều Kiện",
  questions: [
    {
      id: "cau_1_tim_loi_sai",
      title: "Câu 1: Tìm Lỗi Sai - Thì Quá Khứ Đơn",
      type: "SPOT_ERROR",
      instruction: "Chỉ ra từ bị sai trong câu sau:",
      tokens: [
        { id: 1, text: "She" },
        { id: 2, text: "go" },
        { id: 3, text: "to school" },
        { id: 4, text: "yesterday." }
      ],
      correct_token_id: 2,
      correction: "went",
      error_type: "Thì quá khứ đơn / Tương hợp thời gian",
      hint: "Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu.",
      explanation: "Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở quá khứ đơn là 'went'."
    },
    {
      id: "cau_2_dien_dong_tu",
      title: "Câu 2: Điền Từ - Câu Điều Kiện Loại 2",
      type: "FILL_BLANK_TEXT",
      instruction: "Điền dạng đúng của động từ trong ngoặc:",
      template: "If I {1} enough money, I {2} a new house.",
      blanks: {
        "1": { hint: "have", accepted_answers: ["had"] },
        "2": { hint: "buy", accepted_answers: ["would buy", "'d buy"] }
      },
      validation: { strict_case: false, ignore_extra_whitespace: true },
      explanation: "Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy)."
    },
    {
      id: "cau_3_chon_gioi_tu",
      title: "Câu 3: Chọn Từ Trắc Nghiệm - Hiện Tại Hoàn Thành",
      type: "FILL_BLANK_DROPDOWN",
      instruction: "Chọn từ thích hợp để hoàn thành câu:",
      template: "They have lived in Vietnam {1} 3 years.",
      blanks: {
        "1": {
          options: ["since", "for", "from", "during"],
          correct_answer: "for"
        }
      },
      explanation: "Dùng 'for' đi kèm với một khoảng thời gian (3 years) trong thì Hiện tại hoàn thành."
    },
    {
      id: "cau_4_chon_the_dap_an",
      title: "Câu 4: Chọn Thẻ Đáp Án - Hiện Tại Hoàn Thành Tiếp Diễn",
      type: "FILL_BLANK_CARDS",
      instruction: "Chọn thẻ đáp án đúng để hoàn thành câu:",
      template: "She has been living here {1} 2015.",
      blanks: {
        "1": {
          options: ["Since", "For", "From", "During"],
          correct_answer: "Since"
        }
      },
      explanation: "Dùng 'Since' đi kèm với mốc thời gian xác định trong quá khứ (2015) trong thì Hiện tại hoàn thành tiếp diễn."
    }
  ]
};

import api from '../../../api/axiosConfig';

const STORAGE_KEY = "studye_grammar_questions_bank";

/** Load questions from localStorage cache; falls back to INITIAL_GRAMMAR_DATA. */
export const getStoredQuestions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read grammar questions from localStorage:", e);
  }
  return INITIAL_GRAMMAR_DATA;
};

/** Persist questions to localStorage cache. */
export const saveStoredQuestions = (lessonData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessonData, null, 2));
  } catch (e) {
    console.error("Failed to save grammar questions to localStorage:", e);
  }
};

/** Clear override and return default questions. */
export const resetStoredQuestions = () => {
  localStorage.removeItem(STORAGE_KEY);
  return INITIAL_GRAMMAR_DATA;
};

/**
 * Fetch grammar questions from Spring Boot backend (/api/grammar/questions).
 * Automatically updates localStorage cache and falls back gracefully if backend is offline.
 */
export const fetchGrammarQuestions = async () => {
  try {
    const res = await api.get('/grammar/questions');
    if (res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
      saveStoredQuestions(res.data);
      return res.data;
    }
  } catch (err) {
    console.warn("Backend /api/grammar/questions unreachable or error, falling back to local cache:", err.message);
  }
  return getStoredQuestions();
};

/**
 * Save new question to Spring Boot backend.
 */
export const createGrammarQuestionInBackend = async (question) => {
  try {
    const res = await api.post('/grammar/questions', question);
    return res.data;
  } catch (err) {
    console.warn("Failed to create question in backend, saving locally:", err.message);
    return null;
  }
};

/**
 * Delete question from Spring Boot backend.
 */
export const deleteGrammarQuestionFromBackend = async (id) => {
  try {
    await api.delete(`/grammar/questions/${id}`);
    return true;
  } catch (err) {
    console.warn("Failed to delete question from backend:", err.message);
    return false;
  }
};

/**
 * Reset questions to defaults in Spring Boot backend.
 */
export const resetGrammarQuestionsInBackend = async () => {
  try {
    const res = await api.post('/grammar/reset-defaults');
    if (res.data && Array.isArray(res.data.questions)) {
      saveStoredQuestions(res.data);
      return res.data;
    }
  } catch (err) {
    console.warn("Failed to reset questions in backend, resetting locally:", err.message);
  }
  return resetStoredQuestions();
};
