// =========================================================================================
// REGISTRY LAYER — QUESTION TYPES REGISTRY (HỆ THỐNG ĐĂNG KÝ CÁC DẠNG CÂU HỎI NGỮ PHÁP)
// =========================================================================================
// Mục đích:
// 1. Quản lý danh mục tất cả các loại câu hỏi (Spot Error, Fill in Blank, Dropdown, Cards,...)
// 2. Thiết kế theo kiến trúc Module mở rộng (Extensible Plugin/Registry Pattern):
//    -> Khi muốn bổ sung thêm các dạng bài tập mới (ví dụ: MULTIPLE_CHOICE, REORDER_SENTENCE,
//       MATCHING_PAIRS,...), lập trình viên CHỈ CẦN THÊM 1 OBJECT CẤU HÌNH vào mảng QUESTION_TYPES.
//    -> Giao diện tạo câu hỏi (Admin CMS) và giao diện làm bài (Learner) sẽ tự động hiển thị
//       dạng câu hỏi mới mà không cần sửa đổi cấu trúc cốt lõi.
// =========================================================================================

export const QUESTION_TYPES = [
  {
    id: 'SPOT_ERROR',
    label: 'Tìm Lỗi Sai Trong Câu',
    shortLabel: 'Tìm lỗi sai',
    icon: '🔍',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.35)',
    description: 'Người học bấm vào từ/cụm từ bị sai ngữ pháp và nhập từ sửa lại đúng.',
    badge: 'Spot the Error',
    category: 'error_detection'
  },
  {
    id: 'FILL_BLANK_TEXT',
    label: 'Điền Từ Tự Do Vào Chỗ Trống',
    shortLabel: 'Điền từ (Tự gõ)',
    icon: '✍️',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.35)',
    description: 'Người học tự gõ từ đúng vào ô trống trong câu.',
    badge: 'Fill in Blank (Text)',
    category: 'blank_fill'
  },
  {
    id: 'FILL_BLANK_DROPDOWN',
    label: 'Chọn Từ Từ Menu Thả Xuống',
    shortLabel: 'Chọn Dropdown',
    icon: '🔽',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.35)',
    description: 'Tại mỗi vị trí trống trong câu, người học chọn 1 đáp án đúng từ danh sách menu thả xuống.',
    badge: 'Dropdown Choice',
    category: 'selection'
  },
  {
    id: 'FILL_BLANK_CARDS',
    label: 'Chọn Thẻ Đáp Án Tương Tác',
    shortLabel: 'Chọn Thẻ',
    icon: '🃏',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
    description: 'Học viên bấm chọn vào các thẻ từ vựng nổi bật bên dưới để ghép vào chỗ trống trong câu.',
    badge: 'Card Selector',
    category: 'card_interaction'
  },
  {
    id: 'IMAGE_QUESTION',
    label: 'Câu Hỏi Kèm Hình Ảnh',
    shortLabel: 'Hình ảnh',
    icon: '🖼️',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.35)',
    description: 'Học viên quan sát hình ảnh và trả lời các câu hỏi liên quan.',
    badge: 'Image Question',
    category: 'media'
  },
  {
    id: 'PASSAGE_CLOZE',
    label: 'Đoạn Văn Điền Từ Vào Chỗ Trống',
    shortLabel: 'Đoạn văn đục lỗ',
    icon: '📄',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.35)',
    description: 'Đọc đoạn văn dài và chọn từ thích hợp cho từng vị trí trống.',
    badge: 'Cloze Passage',
    category: 'passage'
  },
  {
    id: 'READING_COMPREHENSION',
    label: 'Đoạn Văn Đọc Hiểu & Trả Lời Câu Hỏi',
    shortLabel: 'Đọc hiểu',
    icon: '📖',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.35)',
    description: 'Đọc bài văn và trả lời bộ câu hỏi trắc nghiệm liên quan.',
    badge: 'Reading Comp',
    category: 'passage'
  },
  {
    id: 'AUDIO_LISTENING',
    label: 'Nghe Audio Trả Lời Câu Hỏi',
    shortLabel: 'Nghe Audio',
    icon: '🎧',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
    description: 'Nghe đoạn ghi âm âm thanh hoặc phát âm tiếng Anh để trả lời câu hỏi.',
    badge: 'Audio Listening',
    category: 'media'
  }
  // =========================================================================================
  // HƯỚNG DẪN MỞ RỘNG (HOW TO ADD NEW QUESTION TYPES IN THE FUTURE):
  // Để bổ sung dạng bài mới (ví dụ MULTIPLE_CHOICE, MATCHING,...), chỉ cần thêm cấu hình:
  // {
  //   id: 'MULTIPLE_CHOICE',
  //   label: 'Trắc Nghiệm 4 Phương Án (A, B, C, D)',
  //   shortLabel: 'Trắc nghiệm',
  //   icon: '🔘',
  //   color: '#f43f5e',
  //   ...
  // }
  // =========================================================================================
];

/**
 * Lấy thông tin hiển thị (label, icon, màu sắc, border) của một question type
 * @param {string} type - Mã loại câu hỏi (ví dụ: 'SPOT_ERROR')
 * @returns {object} Thông tin metadata của question type
 */
export const getQuestionTypeInfo = (type) => {
  const found = QUESTION_TYPES.find(t => t.id === type);
  if (found) return found;

  // Fallback an toàn nếu gặp loại câu hỏi chưa đăng ký
  return {
    id: type || 'UNKNOWN',
    label: 'Câu Hỏi Ngữ Pháp',
    shortLabel: 'Ngữ pháp',
    icon: '📝',
    color: '#94a3b8',
    bg: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    description: 'Dạng bài tập ngữ pháp tổng hợp',
    badge: 'General'
  };
};

/**
 * Trả về danh sách tất cả các dạng câu hỏi được hỗ trợ trong hệ thống
 */
export const getAllQuestionTypes = () => {
  return QUESTION_TYPES;
};

/**
 * Đếm và thống kê số lượng từng dạng câu hỏi có trong một nhóm bài tập (Group / Test)
 * Phục vụ Requirement 3: Hiển thị tóm tắt các type câu hỏi có trong bài test (ví dụ: Test 1)
 * @param {Array} questions - Mảng câu hỏi trong nhóm
 * @returns {Array} Danh sách các type kèm số lượng xuất hiện: [{ type, label, icon, color, count }, ...]
 */
export const countQuestionTypesInGroup = (questions = []) => {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const countMap = {};
  questions.forEach(q => {
    const type = q.type || 'UNKNOWN';
    countMap[type] = (countMap[type] || 0) + 1;
  });

  return Object.keys(countMap).map(typeKey => {
    const info = getQuestionTypeInfo(typeKey);
    return {
      type: typeKey,
      count: countMap[typeKey],
      label: info.shortLabel || info.label,
      fullLabel: info.label,
      icon: info.icon,
      color: info.color,
      bg: info.bg,
      border: info.border
    };
  });
};
