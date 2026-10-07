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
      author: {
        name: "StudyE Official",
        email: "buiquangviet032@gmail.com"
      },
      reports: [],
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
      author: {
        name: "StudyE Official",
        email: "buiquangviet032@gmail.com"
      },
      reports: [],
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
      author: {
        name: "StudyE Official",
        email: "buiquangviet032@gmail.com"
      },
      reports: [],
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
    },
    {
      id: "group_test_04",
      title: "Test 4 (Đa Phương Tiện & Đọc Hiểu)",
      description: "Bài kiểm tra nâng cao: Hình ảnh, Đoạn văn điền từ, Đọc hiểu văn bản & Nghe Audio",
      icon: "🌟",
      author: {
        name: "StudyE Official",
        email: "buiquangviet032@gmail.com"
      },
      reports: [],
      questions: [
        {
          id: "cau_img_1",
          title: "Câu 1: Quan sát hình ảnh lớp học",
          type: "IMAGE_QUESTION",
          instruction: "Quan sát bức ảnh bên dưới và chọn câu miêu tả chính xác nhất:",
          image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
          image_caption: "Hoạt động trong lớp học hiện đại",
          question_text: "What are the students and teacher doing in the classroom?",
          options: [
            "The teacher is teaching and students are raising their hands.",
            "The students are sleeping at their desks.",
            "Everyone is playing football on the sports field.",
            "The classroom is completely empty."
          ],
          correct_answer: "The teacher is teaching and students are raising their hands.",
          explanation: "Trong bức ảnh, cô giáo đang giảng bài và các học sinh hào hứng giơ tay phát biểu ý kiến."
        },
        {
          id: "cau_cloze_1",
          title: "Câu 2: Đoạn văn điền từ - Bảo vệ môi trường",
          type: "PASSAGE_CLOZE",
          instruction: "Đọc đoạn văn sau và chọn từ thích hợp cho mỗi chỗ trống:",
          passage_title: "Protecting Our Environment",
          passage_text: "Environmental pollution is one of the greatest challenges of our century. Human activities have damaged natural {1} for decades. To create a greener future, communities must focus on {2} plastic and reducing daily waste. Furthermore, governments should invest in renewable {3} like solar and wind power.",
          blanks: {
            "1": {
              options: ["habitats", "buildings", "factories", "roads"],
              correct_answer: "habitats"
            },
            "2": {
              options: ["recycling", "burning", "throwing", "buying"],
              correct_answer: "recycling"
            },
            "3": {
              options: ["energy", "vehicles", "clothes", "food"],
              correct_answer: "energy"
            }
          },
          explanation: "1. 'natural habitats' (môi trường sống tự nhiên). 2. 'recycling plastic' (tái chế đồ nhựa). 3. 'renewable energy' (năng lượng tái tạo)."
        },
        {
          id: "cau_reading_1",
          title: "Câu 3: Đọc hiểu - Trí tuệ nhân tạo trong giáo dục",
          type: "READING_COMPREHENSION",
          instruction: "Đọc kỹ đoạn văn sau và trả lời các câu hỏi liên quan:",
          passage_title: "Artificial Intelligence in Modern Learning",
          passage_text: "Artificial Intelligence (AI) is transforming the landscape of modern education worldwide. With adaptive learning platforms, students can study at their own pace and receive instant feedback on their exercises, allowing them to overcome weaknesses effectively.\n\nHowever, experts emphasize that AI cannot replace human educators. Teachers provide emotional support, encourage creativity, and nurture ethical thinking—qualities that no algorithm can replicate. Therefore, the future of education is a collaborative partnership between smart technology and inspiring teachers.",
          sub_questions: [
            {
              id: "sub_1",
              question: "According to the passage, how does AI benefit students?",
              options: [
                "It allows students to learn at their own pace.",
                "It replaces teachers completely in schools.",
                "It eliminates all homework and exams.",
                "It forces students to memorize everything."
              ],
              correct_answer: "It allows students to learn at their own pace."
            },
            {
              id: "sub_2",
              question: "What qualities of human teachers CANNOT be replicated by AI?",
              options: [
                "Emotional support and ethical thinking.",
                "Storing test scores in databases.",
                "Printing multiple choice question papers.",
                "Calculating percentages automatically."
              ],
              correct_answer: "Emotional support and ethical thinking."
            }
          ],
          explanation: "Đoạn 1 nêu: 'students can study at their own pace'. Đoạn 2 nêu: 'Teachers provide emotional support, encourage creativity, and nurture ethical thinking'."
        },
        {
          id: "cau_audio_1",
          title: "Câu 4: Nghe audio - Thông báo chuyến bay tại sân bay",
          type: "AUDIO_LISTENING",
          instruction: "Nghe đoạn thông báo sau và chọn câu trả lời đúng nhất:",
          audio_url: "",
          transcript: "Attention all passengers on flight VN123 to Tokyo. Your flight is now boarding at Gate Number 14. Please have your boarding pass and passport ready.",
          question_text: "Which gate is flight VN123 boarding at?",
          options: [
            "Gate Number 14",
            "Gate Number 4",
            "Gate Number 40",
            "Gate Number 24"
          ],
          correct_answer: "Gate Number 14",
          explanation: "Trong đoạn băng thông báo rõ: 'Your flight is now boarding at Gate Number 14'."
        }
      ]
    }
  ]
};

const STORAGE_KEY = "studye_grammar_groups_bank_v5";

/**
 * Gửi báo cáo lỗi câu hỏi cho tác giả bài viết
 * - Lưu vào localStorage
 * - Tạo sẵn link mở trực tiếp trên Gmail Web và mailto link
 */
export const submitQuestionReport = ({
  groupId,
  questionId,
  questionTitle,
  errorType,
  description,
  reporterEmail,
  reporterName,
  testTitle,
  authorEmail
}) => {
  const reportId = `report_${Date.now()}`;
  const reportData = {
    id: reportId,
    groupId,
    testTitle: testTitle || "Bài tập ngữ pháp",
    questionId,
    questionTitle: questionTitle || "Câu hỏi",
    errorType: errorType || "Sai đáp án",
    description: description || "",
    reporterEmail: reporterEmail || "Học viên ẩn danh",
    reporterName: reporterName || "Người học",
    authorEmail: authorEmail || "buiquangviet032@gmail.com",
    createdAt: new Date().toISOString(),
    status: "OPEN" // 'OPEN' | 'RESOLVED'
  };

  // 1. Cập nhật vào danh sách bài tập hiện tại
  const currentData = getStoredQuestions();
  const updatedGroups = (currentData.groups || []).map(g => {
    if (g.id === groupId) {
      return {
        ...g,
        reports: [...(g.reports || []), reportData]
      };
    }
    return g;
  });
  const updatedData = { ...currentData, groups: updatedGroups };
  saveStoredQuestions(updatedData);

  // 2. Lưu bảng báo cáo tổng hợp
  try {
    const allReports = JSON.parse(localStorage.getItem('studye_community_reports') || '[]');
    allReports.unshift(reportData);
    localStorage.setItem('studye_community_reports', JSON.stringify(allReports));
  } catch (e) {
    console.warn("Could not save to studye_community_reports:", e);
  }

  // 3. Tạo link thông báo trực tiếp qua Gmail
  const targetEmail = authorEmail || "community@studye.edu.vn";
  const subject = `[StudyE - Báo lỗi bài tập] ${testTitle} - ${questionTitle}`;
  const bodyText = `Xin chào tác giả,\n\n` +
    `Người học "${reporterName || 'Học viên'}" (${reporterEmail || 'Ẩn danh'}) vừa gửi phản ánh báo lỗi cho bài tập của bạn trên StudyE:\n\n` +
    `--------------------------------------------------\n` +
    `• Bài tập: ${testTitle}\n` +
    `• Câu hỏi: ${questionTitle}\n` +
    `• Phân loại lỗi: ${errorType}\n` +
    `• Chi tiết phản ánh: "${description}"\n` +
    `• Thời gian gửi: ${new Date().toLocaleString('vi-VN')}\n` +
    `--------------------------------------------------\n\n` +
    `Bạn vui lòng truy cập StudyE để kiểm tra và cập nhật lại câu hỏi nhé!\n\n` +
    `Trân trọng,\nStudyE Community Platform`;

  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  return {
    report: reportData,
    gmailWebUrl,
    mailtoUrl
  };
};

/**
 * Đánh dấu báo cáo lỗi đã được tác giả xử lý / sửa xong
 */
export const resolveQuestionReport = (groupId, reportId) => {
  const currentData = getStoredQuestions();
  const updatedGroups = (currentData.groups || []).map(g => {
    if (g.id === groupId && Array.isArray(g.reports)) {
      return {
        ...g,
        reports: g.reports.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r)
      };
    }
    return g;
  });
  const updatedData = { ...currentData, groups: updatedGroups };
  saveStoredQuestions(updatedData);

  try {
    const allReports = JSON.parse(localStorage.getItem('studye_community_reports') || '[]');
    const updatedAll = allReports.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r);
    localStorage.setItem('studye_community_reports', JSON.stringify(updatedAll));
  } catch (e) {
    console.warn("Could not update studye_community_reports:", e);
  }

  return updatedData;
};

/**
 * Lấy tất cả báo cáo dành cho tác giả hiện tại
 */
export const getReportsForUser = (userEmail) => {
  if (!userEmail) return [];
  const currentData = getStoredQuestions();
  const list = [];
  (currentData.groups || []).forEach(g => {
    const isOwner = (g.author?.email || '').toLowerCase() === userEmail.toLowerCase();
    if (isOwner && Array.isArray(g.reports)) {
      list.push(...g.reports);
    }
  });
  return list;
};

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
