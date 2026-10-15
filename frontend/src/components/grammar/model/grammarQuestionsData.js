// =========================================================================================
// MODEL & API LAYER — GRAMMAR QUESTIONS & GROUPS (MSSQL DATABASE INTEGRATION)
// =========================================================================================
// Toàn bộ dữ liệu được lưu trữ và truy xuất trực tiếp từ Cơ sở dữ liệu MSSQL qua Spring Boot API.
// Đã loại bỏ hoàn toàn mọi dữ liệu mẫu (mock data) và bộ nhớ đệm giả lập ở frontend.
// =========================================================================================
import api from '../../../api/axiosConfig';

// Tự động dọn dẹp các key mock data cũ trong localStorage nếu có
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('grammar_questions_storage_v4');
    window.localStorage.removeItem('studye_community_reports');
  }
} catch (e) {
  // Bỏ qua nếu môi trường không có localStorage
}

/**
 * Cấu trúc dữ liệu bài tập ngữ pháp khởi tạo rỗng (chờ nạp từ Database)
 */
export const EMPTY_GRAMMAR_DATA = {
  lesson_id: "grammar_test_series",
  lesson_title: "Ngân Hàng Bài Tập Ngữ Pháp",
  groups: []
};

// Tương thích ngược với các component vẫn import INITIAL_GRAMMAR_DATA
export const INITIAL_GRAMMAR_DATA = EMPTY_GRAMMAR_DATA;

/**
 * Trả về cấu trúc rỗng ban đầu khi component mới mount
 */
export const getStoredQuestions = () => {
  return EMPTY_GRAMMAR_DATA;
};

/**
 * Không ghi mock data vào localStorage nữa vì toàn bộ thay đổi đã lưu vào Database
 */
export const saveStoredQuestions = (_lessonData) => {
  // No-op: Dữ liệu được đồng bộ trực tiếp vào MSSQL Database
};

/**
 * Reset về trạng thái rỗng
 */
export const resetStoredQuestions = () => {
  return EMPTY_GRAMMAR_DATA;
};

/**
 * Gọi API backend Spring Boot lấy toàn bộ nhóm bài tập và câu hỏi từ Cơ sở dữ liệu MSSQL
 */
export const fetchGrammarQuestions = async () => {
  try {
    const res = await api.get('/grammar/questions');
    if (res.data && Array.isArray(res.data.groups)) {
      return res.data;
    }
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu bài tập ngữ pháp từ Database:", err?.response?.data || err.message);
  }
  return EMPTY_GRAMMAR_DATA;
};

/**
 * Tạo nhóm bài tập mới và lưu vào cơ sở dữ liệu backend
 */
export const createGrammarGroupInBackend = async (group) => {
  try {
    const res = await api.post('/grammar/groups', group);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi tạo nhóm bài tập trong Database:", err?.response?.data || err.message);
    return null;
  }
};

/**
 * Xóa nhóm bài tập khỏi cơ sở dữ liệu backend
 */
export const deleteGrammarGroupInBackend = async (groupId) => {
  try {
    await api.delete(`/grammar/groups/${groupId}`);
    return true;
  } catch (err) {
    console.error("Lỗi khi xóa nhóm bài tập trong Database:", err?.response?.data || err.message);
    return false;
  }
};

/**
 * Lưu câu hỏi mới vào cơ sở dữ liệu backend
 */
export const createGrammarQuestionInBackend = async (question) => {
  try {
    const res = await api.post('/grammar/questions', question);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi tạo câu hỏi trong Database:", err?.response?.data || err.message);
    return null;
  }
};

/**
 * Cập nhật câu hỏi trong cơ sở dữ liệu backend
 */
export const updateGrammarQuestionInBackend = async (id, question) => {
  try {
    const res = await api.put(`/grammar/questions/${id}`, question);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi cập nhật câu hỏi trong Database:", err?.response?.data || err.message);
    return null;
  }
};

/**
 * Xóa câu hỏi khỏi cơ sở dữ liệu backend
 */
export const deleteGrammarQuestionFromBackend = async (id) => {
  try {
    await api.delete(`/grammar/questions/${id}`);
    return true;
  } catch (err) {
    console.error("Lỗi khi xóa câu hỏi trong Database:", err?.response?.data || err.message);
    return false;
  }
};

/**
 * Gửi báo cáo lỗi câu hỏi lên cơ sở dữ liệu backend
 */
export const submitGrammarReportToBackend = async (report) => {
  try {
    const res = await api.post('/grammar/reports', report);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi gửi báo cáo lỗi lên Database:", err?.response?.data || err.message);
    return null;
  }
};

/**
 * Đánh dấu báo cáo đã giải quyết trên cơ sở dữ liệu backend
 */
export const resolveGrammarReportInBackend = async (reportId) => {
  try {
    const res = await api.put(`/grammar/reports/${reportId}/resolve`);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi giải quyết báo cáo trong Database:", err?.response?.data || err.message);
    return null;
  }
};

/**
 * Reset dữ liệu ngữ pháp về mặc định trong cơ sở dữ liệu backend
 */
export const resetGrammarQuestionsInBackend = async () => {
  try {
    const res = await api.post('/grammar/reset-defaults');
    if (res.data && Array.isArray(res.data.groups)) {
      return res.data;
    }
  } catch (err) {
    console.error("Lỗi khi khôi phục bài tập mặc định trong Database:", err?.response?.data || err.message);
  }
  return fetchGrammarQuestions();
};

/**
 * Gửi phản ánh báo lỗi cho câu hỏi
 */
export const submitQuestionReport = ({
  groupId,
  testTitle,
  questionId,
  questionTitle,
  errorType,
  description,
  reporterEmail,
  reporterName,
  authorName,
  authorEmail
}) => {
  const reportPayload = {
    groupKey: groupId,
    questionKey: questionId,
    testTitle: testTitle || "",
    questionTitle: questionTitle || "",
    errorType: errorType || "OTHER",
    description: description || "",
    reporterEmail: reporterEmail || "Học viên ẩn danh",
    reporterName: reporterName || "Người học",
    authorName: authorName || "Tác giả bài tập",
    authorEmail: authorEmail || ""
  };

  // Đồng bộ lưu trực tiếp vào cơ sở dữ liệu backend
  submitGrammarReportToBackend(reportPayload);

  // Tạo link hỗ trợ thông báo qua Gmail
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
    report: reportPayload,
    gmailWebUrl,
    mailtoUrl
  };
};

/**
 * Đánh dấu báo cáo lỗi đã được tác giả xử lý
 */
export const resolveQuestionReport = (groupId, reportId) => {
  resolveGrammarReportInBackend(reportId);
  return null;
};

/**
 * Lấy tất cả báo cáo dành cho tác giả hiện tại từ danh sách nhóm dữ liệu đã tải từ DB
 */
export const getReportsForUser = (userEmail, groups = []) => {
  if (!userEmail || !Array.isArray(groups)) return [];
  const list = [];
  groups.forEach(g => {
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
