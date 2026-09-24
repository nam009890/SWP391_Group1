// Default grammar questions following the specified JSON schema
export const INITIAL_GRAMMAR_DATA = {
  lesson_id: "grammar_module_01",
  lesson_title: "Ngữ Pháp Căn Bản: Thì & Câu Điều Kiện",
  questions: [
    {
      id: "q1_spot_error",
      type: "SPOT_ERROR",
      instruction: "Chỉ ra lỗi sai trong câu sau:",
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
      id: "q2_fill_text",
      type: "FILL_BLANK_TEXT",
      instruction: "Điền dạng đúng của động từ trong ngoặc:",
      template: "If I {1} enough money, I {2} a new house.",
      blanks: {
        "1": {
          hint: "have",
          accepted_answers: ["had"]
        },
        "2": {
          hint: "buy",
          accepted_answers: ["would buy", "'d buy"]
        }
      },
      validation: {
        strict_case: false,
        ignore_extra_whitespace: true
      },
      explanation: "Câu điều kiện loại 2: Mệnh đề If chia Quá khứ đơn (had), mệnh đề chính dùng Would + V-bare (would buy)."
    },
    {
      id: "q3_fill_dropdown",
      type: "FILL_BLANK_DROPDOWN",
      instruction: "Chọn từ thích hợp để hoàn thành câu (Inline Dropdown):",
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
      id: "q4_fill_cards",
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

const STORAGE_KEY = "studye_grammar_questions_bank";

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
    console.error("Failed to read questions from localStorage:", e);
  }
  return INITIAL_GRAMMAR_DATA;
};

export const saveStoredQuestions = (lessonData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessonData, null, 2));
  } catch (e) {
    console.error("Failed to save questions to localStorage:", e);
  }
};

export const resetStoredQuestions = () => {
  localStorage.removeItem(STORAGE_KEY);
  return INITIAL_GRAMMAR_DATA;
};
