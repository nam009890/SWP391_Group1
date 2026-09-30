// =========================================================================================
// MODEL LAYER — GRAMMAR QUESTIONS & GROUPS DATA STRUCTURE
// =========================================================================================
// Kiến trúc dữ liệu phân cấp theo yêu cầu người dùng:
// 1. Groups (Nhóm Bài Tập do Admin tạo, ví dụ: Test 1, Test 2, Test 3...)
// 2. Bên trong mỗi Group chứa nhiều Câu Hỏi nhỏ thuộc các Dạng khác nhau (Types):
//    - SPOT_ERROR: Tìm lỗi sai trong câu
//    - FILL_BLANK_TEXT: Điền từ tự do vào chỗ trống
//    - FILL_BLANK_DROPDOWN: Chọn từ menu thả xuống
//    - FILL_BLANK_CARDS: Chọn thẻ đáp án tương tác
// =========================================================================================
import api from '../../../api/axiosConfig';

export const INITIAL_GRAMMAR_DATA = {
  lesson_id: "grammar_test_series",
  lesson_title: "Ngân Hàng Bài Tập Ngữ Pháp",
  groups: [
    {
      id: "group_test_01",
      title: "Test 1",
      description: "Bài kiểm tra tổng hợp: Thì Quá khứ, Hiện tại đơn, Dropdown & Thẻ từ",
      icon: "📝",
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
          hint: "Hãy chú ý đến trạng từ chỉ thời gian ở cuối câu (yesterday).",
          explanation: "Vì có trạng từ 'yesterday' nên động từ 'go' phải chia ở thì quá khứ đơn là 'went'."
        },
        {
          id: "cau_2_hien_tai_don",
          title: "Câu 2: Điền Từ - Thì Hiện Tại Đơn",
          type: "FILL_BLANK_TEXT",
          instruction: "Hoàn thành câu bằng cách điền từ thích hợp:",
          template: "She usually {1} up early and {2} jogging.",
          blanks: {
            "1": { hint: "wake", accepted_answers: ["wakes"] },
            "2": { hint: "go", accepted_answers: ["goes"] }
          },
          validation: { strict_case: false, ignore_extra_whitespace: true },
          explanation: "Thì Hiện tại đơn: Diễn tả thói quen lặp đi lặp lại với chủ ngữ ngôi thứ ba số ít (She)."
        },
        {
          id: "cau_3_chon_gioi_tu",
          title: "Câu 3: Chọn Từ Trắc Nghiệm - Hiện Tại Hoàn Thành",
          type: "FILL_BLANK_DROPDOWN",
          instruction: "Chọn từ thích hợp từ danh sách thả xuống:",
          template: "They have lived in Vietnam {1} 3 years.",
          blanks: {
            "1": {
              options: ["for", "since", "from", "during"],
              correct_answer: "for"
            }
          },
          explanation: "Dùng 'for' đi kèm với một khoảng thời gian (3 years) trong thì Hiện tại hoàn thành."
        },
        {
          id: "cau_4_chon_the_dap_an",
          title: "Câu 4: Chọn Thẻ Đáp Án - Hiện Tại Hoàn Thành Tiếp Diễn",
          type: "FILL_BLANK_CARDS",
          instruction: "Bấm chọn thẻ đáp án đúng để hoàn thành câu:",
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
    },
    {
      id: "group_test_02",
      title: "Test 2",
      description: "Bài kiểm tra chuyên đề: Câu điều kiện loại 1 & loại 2",
      icon: "🎯",
      questions: [
        {
          id: "cau_cond_1",
          title: "Câu 1: Điền Động Từ - Câu Điều Kiện Loại 2",
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
          id: "cau_cond_2",
          title: "Câu 2: Tìm Lỗi Sai - Mệnh Đề If Loại 1",
          type: "SPOT_ERROR",
          instruction: "Chỉ ra từ bị sai trong câu điều kiện sau:",
          tokens: [
            { id: 1, text: "If" },
            { id: 2, text: "it" },
            { id: 3, text: "will rain" },
            { id: 4, text: "tomorrow," },
            { id: 5, text: "we will stay home." }
          ],
          correct_token_id: 3,
          correction: "rains",
          error_type: "Câu điều kiện loại 1 / Mệnh đề If",
          hint: "Mệnh đề If loại 1 không dùng 'will'.",
          explanation: "Trong câu điều kiện loại 1, mệnh đề If chia thì Hiện tại đơn ('rains'), không dùng 'will rain'."
        },
        {
          id: "cau_cond_3",
          title: "Câu 3: Chọn Từ Trắc Nghiệm - Câu Điều Kiện Loại 0",
          type: "FILL_BLANK_DROPDOWN",
          instruction: "Chọn từ đúng diễn tả chân lý hiển nhiên:",
          template: "If you heat ice, it {1}.",
          blanks: {
            "1": {
              options: ["melts", "will melt", "melted", "would melt"],
              correct_answer: "melts"
            }
          },
          explanation: "Câu điều kiện loại 0 diễn tả sự thật hiển nhiên: Cả 2 vế đều dùng thì Hiện tại đơn (heat / melts)."
        }
      ]
    },
    {
      id: "group_test_03",
      title: "Test 3",
      description: "Bài kiểm tra: Giới từ, Cụm tính từ và Cấu trúc thường gặp",
      icon: "📍",
      questions: [
        {
          id: "cau_prep_1",
          title: "Câu 1: Chọn Thẻ - Giới Từ Đi Kèm Tính Từ",
          type: "FILL_BLANK_CARDS",
          instruction: "Chọn thẻ đáp án đúng để hoàn thành câu:",
          template: "They are interested {1} learning English online.",
          blanks: {
            "1": {
              options: ["in", "on", "at", "with"],
              correct_answer: "in"
            }
          },
          explanation: "Cấu trúc cố định: 'to be interested in something' (thích thú, quan tâm đến điều gì)."
        },
        {
          id: "cau_prep_2",
          title: "Câu 2: Điền Giới Từ - Giới Từ Chỉ Thời Gian",
          type: "FILL_BLANK_TEXT",
          instruction: "Điền giới từ chỉ thời gian thích hợp:",
          template: "The meeting starts {1} 9:00 AM {2} Monday.",
          blanks: {
            "1": { hint: "giờ giấc", accepted_answers: ["at"] },
            "2": { hint: "thứ trong tuần", accepted_answers: ["on"] }
          },
          validation: { strict_case: false, ignore_extra_whitespace: true },
          explanation: "Dùng 'at' trước mốc giờ cụ thể (at 9:00 AM) và 'on' trước ngày/thứ trong tuần (on Monday)."
        }
      ]
    }
  ]
};

const STORAGE_KEY = "studye_grammar_groups_bank_v3";

/**
 * Trả về danh sách phẳng tất cả câu hỏi kèm theo thông tin groupId và groupTitle
 */
export const getAllQuestionsList = (data) => {
  if (!data || !Array.isArray(data.groups)) return [];
  const list = [];
  data.groups.forEach(g => {
    if (Array.isArray(g.questions)) {
      g.questions.forEach(q => {
        list.push({ ...q, groupId: g.id, groupTitle: g.title });
      });
    }
  });
  return list;
};

/**
 * Đọc dữ liệu từ bộ nhớ LocalStorage (Cache). Nếu chưa có thì trả về dữ liệu mẫu mặc định.
 */
export const getStoredQuestions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.groups) && parsed.groups.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read grammar groups from localStorage:", e);
  }
  return INITIAL_GRAMMAR_DATA;
};

/**
 * Lưu dữ liệu Groups & Questions vào LocalStorage Cache.
 */
export const saveStoredQuestions = (lessonData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessonData, null, 2));
  } catch (e) {
    console.error("Failed to save grammar groups to localStorage:", e);
  }
};

/**
 * Reset về dữ liệu các nhóm bài test ban đầu (Test 1, Test 2, Test 3)
 */
export const resetStoredQuestions = () => {
  localStorage.removeItem(STORAGE_KEY);
  return INITIAL_GRAMMAR_DATA;
};

/**
 * Gọi API backend Spring Boot lấy danh sách câu hỏi (/api/grammar/questions)
 */
export const fetchGrammarQuestions = async () => {
  try {
    const res = await api.get('/grammar/questions');
    if (res.data && Array.isArray(res.data.groups) && res.data.groups.length > 0) {
      saveStoredQuestions(res.data);
      return res.data;
    }
  } catch (err) {
    console.warn("Backend /api/grammar/questions unreachable, using local cache:", err.message);
  }
  return getStoredQuestions();
};

/**
 * Lưu câu hỏi mới lên backend Spring Boot
 */
export const createGrammarQuestionInBackend = async (question) => {
  try {
    const res = await api.post('/grammar/questions', question);
    return res.data;
  } catch (err) {
    console.warn("Failed to create question in backend, using local store:", err.message);
    return null;
  }
};

/**
 * Xóa câu hỏi khỏi backend Spring Boot
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
