// =========================================================================================
// VIEW LAYER — GRAMMAR COMMUNITY CREATOR STUDIO (GIAO DIỆN SOẠN & ĐĂNG BÀI TẬP CỘNG ĐỒNG)
// =========================================================================================
// Dành cho tất cả người dùng trong cộng đồng StudyE để sáng tạo và chia sẻ bài tập:
// 1. Giao diện Tạo Câu Hỏi được cấu trúc theo 3 bước tuần tự rõ ràng:
//    - Bước 1: Group Name (Chọn nhóm có sẵn hoặc tạo nhóm mới, ví dụ: Test 1, Test 2,...)
//    - Bước 2: Question Type (Chọn loại câu hỏi từ hệ thống Registry linh hoạt mở rộng)
//    - Bước 3: The Question Itself (Soạn nội dung chi tiết câu hỏi theo từng dạng)
// 2. Kiến trúc mở rộng (Extensible Question Types):
//    -> Sử dụng questionTypesRegistry.js, khi thêm dạng câu hỏi mới không cần sửa layout gốc.
// 3. Quản lý Ngân hàng câu hỏi theo từng Nhóm Bài Tập.
// 4. Có nút quay lại Bảng Tin Bài Tập Cộng Đồng để làm bài và kiểm tra.
// =========================================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotTheErrorQuestion from './components/SpotTheErrorQuestion';
import FillBlankQuestion from './components/FillBlankQuestion';
import ImageQuestion from './components/ImageQuestion';
import PassageClozeQuestion from './components/PassageClozeQuestion';
import ReadingComprehensionQuestion from './components/ReadingComprehensionQuestion';
import AudioListeningQuestion from './components/AudioListeningQuestion';
import {
  getStoredQuestions,
  saveStoredQuestions,
  resetStoredQuestions,
  fetchGrammarQuestions,
  createGrammarGroupInBackend,
  createGrammarQuestionInBackend,
  deleteGrammarQuestionFromBackend,
  resolveQuestionReport,
  getReportsForUser
} from '../model/grammarQuestionsData';
import {
  getAllQuestionTypes,
  getQuestionTypeInfo,
  countQuestionTypesInGroup
} from '../model/questionTypesRegistry';
import '../Grammar.css';

const GrammarAdminCMSPage = ({ user }) => {
  const navigate = useNavigate();

  // Dữ liệu toàn bộ các nhóm bài tập và câu hỏi
  const [lessonData, setLessonData] = useState(() => getStoredQuestions());
  const groups = lessonData.groups || [];

  const userEmail = (user?.email || '').toLowerCase().trim();
  const userName = (user?.name || user?.username || '').toLowerCase().trim();

  // Danh sách các bài tập do người dùng hiện tại tạo ra (Requirement 7)
  const myGroups = groups.filter(g => {
    const authorEmail = (g.author?.email || '').toLowerCase().trim();
    const authorName = (g.author?.name || '').toLowerCase().trim();
    if (userEmail && authorEmail === userEmail) return true;
    if (userName && authorName === userName) return true;
    return false;
  });

  // Thông báo Toast phản hồi người dùng

  // Thông báo Toast phản hồi người dùng
  const [toastMessage, setToastMessage] = useState('');

  // =========================================================================================
  // BƯỚC 1 STATE: GROUP NAME (CHỌN HOẶC TẠO NHÓM BÀI TẬP: Test 1, Test 2,...)
  // =========================================================================================
  const [selectedGroupId, setSelectedGroupId] = useState(() => groups[0]?.id || 'group_test_01');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('');

  // =========================================================================================
  // BƯỚC 2 STATE: QUESTION TYPE (CHỌN DẠNG CÂU HỎI TỪ REGISTRY)
  // =========================================================================================
  // Các dạng có sẵn: 'SPOT_ERROR' | 'FILL_BLANK_TEXT' | 'FILL_BLANK_DROPDOWN' | 'FILL_BLANK_CARDS'
  const [selectedQuestionType, setSelectedQuestionType] = useState('SPOT_ERROR');

  // =========================================================================================
  // BƯỚC 3 STATE: THE QUESTION ITSELF (SOẠN NỘI DUNG CÂU HỎI THEO TỪNG DẠNG)
  // Không điền trước dữ liệu vào các ô input (Requirement 4)
  // Loại bỏ hoàn toàn gợi ý (Requirement 5)
  // =========================================================================================
  // --- 3.1: Dạng SPOT_ERROR (Tìm lỗi sai) ---
  const [spotTitle, setSpotTitle] = useState("");
  const [spotRawSentence, setSpotRawSentence] = useState("");
  const [spotTokens, setSpotTokens] = useState([]);
  const [spotWrongTokenId, setSpotWrongTokenId] = useState(null);
  const [spotCorrection, setSpotCorrection] = useState("");
  const [spotErrorType, setSpotErrorType] = useState("");
  const [spotExplanation, setSpotExplanation] = useState("");

  // --- 3.2: Dạng FILL_BLANK_TEXT (Điền từ tự do) ---
  const [textTitle, setTextTitle] = useState("");
  const [textTemplate, setTextTemplate] = useState("");
  const [textBlank1Answers, setTextBlank1Answers] = useState("");
  const [textBlank2Answers, setTextBlank2Answers] = useState("");
  const [textExplanation, setTextExplanation] = useState("");

  // --- 3.3: Dạng FILL_BLANK_DROPDOWN (Chọn từ menu thả xuống) ---
  const [dropTitle, setDropTitle] = useState("");
  const [dropTemplate, setDropTemplate] = useState("");
  const [dropOptions, setDropOptions] = useState("");
  const [dropCorrect, setDropCorrect] = useState("");
  const [dropExplanation, setDropExplanation] = useState("");

  // --- 3.5: Dạng IMAGE_QUESTION (Câu hỏi hình ảnh) ---
  const [imgTitle, setImgTitle] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [imgQuestion, setImgQuestion] = useState("");
  const [imgOptions, setImgOptions] = useState("");
  const [imgCorrect, setImgCorrect] = useState("");
  const [imgExplanation, setImgExplanation] = useState("");

  // --- 3.6: Dạng PASSAGE_CLOZE (Đoạn văn điền từ) ---
  const [clozeTitle, setClozeTitle] = useState("");
  const [clozePassageTitle, setClozePassageTitle] = useState("");
  const [clozePassageText, setClozePassageText] = useState("");
  const [clozeBlank1Opts, setClozeBlank1Opts] = useState("");
  const [clozeBlank1Correct, setClozeBlank1Correct] = useState("");
  const [clozeBlank2Opts, setClozeBlank2Opts] = useState("");
  const [clozeBlank2Correct, setClozeBlank2Correct] = useState("");
  const [clozeBlank3Opts, setClozeBlank3Opts] = useState("");
  const [clozeBlank3Correct, setClozeBlank3Correct] = useState("");
  const [clozeExplanation, setClozeExplanation] = useState("");

  // --- 3.7: Dạng READING_COMPREHENSION (Đọc hiểu văn bản) ---
  const [readTitle, setReadTitle] = useState("");
  const [readPassageTitle, setReadPassageTitle] = useState("");
  const [readPassageText, setReadPassageText] = useState("");
  const [readSub1Q, setReadSub1Q] = useState("");
  const [readSub1Opts, setReadSub1Opts] = useState("");
  const [readSub1Correct, setReadSub1Correct] = useState("");
  const [readSub2Q, setReadSub2Q] = useState("");
  const [readSub2Opts, setReadSub2Opts] = useState("");
  const [readSub2Correct, setReadSub2Correct] = useState("");
  const [readExplanation, setReadExplanation] = useState("");

  // --- 3.8: Dạng AUDIO_LISTENING (Nghe audio trả lời câu hỏi) ---
  const [audioTitle, setAudioTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [audioQuestion, setAudioQuestion] = useState("");
  const [audioOptions, setAudioOptions] = useState("");
  const [audioCorrect, setAudioCorrect] = useState("");
  const [audioExplanation, setAudioExplanation] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchGrammarQuestions().then(data => {
      if (data && Array.isArray(data.groups) && data.groups.length > 0) {
        setLessonData(data);
        if (!selectedGroupId && data.groups[0]) {
          setSelectedGroupId(data.groups[0].id);
        }
      }
    });
  }, []);

  // Tự động phân tách câu văn thành các token từ khi người dùng nhập câu mẫu cho SPOT_ERROR
  const handleAutoTokenize = () => {
    if (!spotRawSentence.trim()) return;
    const words = spotRawSentence.trim().split(/\s+/);
    const newTokens = words.map((w, idx) => ({ id: idx + 1, text: w }));
    setSpotTokens(newTokens);
    setSpotWrongTokenId(newTokens[0]?.id || 1);
    showToast(`Đã tự động chia thành ${newTokens.length} từ! Hãy chọn từ bị sai.`);
  };

  // Tạo nhóm bài tập mới (ví dụ: Test 4, Test 5...)
  const handleCreateNewGroup = (e) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) {
      showToast("Vui lòng nhập tên nhóm bài tập!");
      return;
    }

    const newGroupId = `group_${Date.now()}`;
    const authorName = user?.name || user?.username || (user?.email ? user.email.split('@')[0] : "Thành viên cộng đồng");
    const authorEmail = user?.email || "community@studye.edu.vn";

    const newGroup = {
      id: newGroupId,
      title: newGroupTitle.trim(),
      description: newGroupDesc.trim() || `Bài kiểm tra ${newGroupTitle.trim()}`,
      icon: newGroupIcon || "",
      author: {
        name: authorName,
        email: authorEmail
      },
      reports: [],
      questions: []
    };

    const updatedGroups = [...groups, newGroup];
    const updatedData = { ...lessonData, groups: updatedGroups };
    setLessonData(updatedData);
    saveStoredQuestions(updatedData);

    // Đồng bộ nhóm bài tập mới lên backend Spring Boot
    createGrammarGroupInBackend(newGroup);

    setSelectedGroupId(newGroupId);
    setIsCreatingNewGroup(false);
    setNewGroupTitle('');
    setNewGroupDesc('');
    showToast(`Đã tạo nhóm bài tập mới: "${newGroup.title}"!`);
  };

  // Lấy danh sách toàn bộ báo cáo lỗi từ học viên gửi về
  const allReports = groups.flatMap(g => (g.reports || []).map(r => ({ ...r, groupTitle: g.title, groupId: g.id })));
  const openReportsCount = allReports.filter(r => r.status === 'OPEN').length;

  // Đánh dấu đã sửa xong một báo cáo
  const handleResolveReport = (groupId, reportId) => {
    const updated = resolveQuestionReport(groupId, reportId);
    setLessonData(updated);
    showToast("Đã đánh dấu báo cáo đã được giải quyết!");
  };

  // Mở tab Gmail để phản hồi trực tiếp cho học viên đã báo lỗi
  const handleReplyReportViaGmail = (rep) => {
    const subject = `[StudyE - Phản hồi từ tác giả] Bài tập: ${rep.testTitle} - ${rep.questionTitle}`;
    const body = `Xin chào ${rep.reporterName || 'bạn'},\n\nMình là tác giả bài tập "${rep.testTitle}" trên StudyE. Cảm ơn bạn rất nhiều vì đã báo lỗi cho câu hỏi "${rep.questionTitle}".\n\nMình đã kiểm tra lại và cập nhật câu hỏi theo góp ý của bạn.\n\nChúc bạn học tập thật tốt trên StudyE nhé!\n\nThân ái,`;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(rep.reporterEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Xóa một nhóm bài tập
  const handleDeleteGroup = (groupId, groupTitle) => {
    if (groups.length <= 1) {
      showToast("Không thể xóa nhóm bài tập duy nhất còn lại!");
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhóm bài tập "${groupTitle}" cùng toàn bộ câu hỏi bên trong?`)) {
      const updatedGroups = groups.filter(g => g.id !== groupId);
      const updatedData = { ...lessonData, groups: updatedGroups };
      setLessonData(updatedData);
      saveStoredQuestions(updatedData);
      if (selectedGroupId === groupId) {
        setSelectedGroupId(updatedGroups[0]?.id || '');
      }
      showToast(`Đã xóa nhóm bài tập "${groupTitle}".`);
    }
  };

  // Xóa một câu hỏi cụ thể trong nhóm
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
      const updatedData = { ...lessonData, groups: updatedGroups };
      setLessonData(updatedData);
      saveStoredQuestions(updatedData);
      deleteGrammarQuestionFromBackend(questionId);
      showToast("Đã xóa câu hỏi khỏi nhóm thành công!");
    }
  };

  // Reset toàn bộ câu hỏi về mặc định
  const handleResetToDefaults = () => {
    if (window.confirm("Khôi phục toàn bộ bài tập về mặc định ban đầu (Test 1, Test 2, Test 3)?")) {
      const defaultData = resetStoredQuestions();
      setLessonData(defaultData);
      setSelectedGroupId(defaultData.groups[0]?.id || '');
      showToast("Đã khôi phục các nhóm bài test mặc định.");
    }
  };

  // =========================================================================================
  // XỬ LÝ LƯU CÂU HỎI VÀO NHÓM ĐÃ CHỌN (BƯỚC 1 -> BƯỚC 2 -> BƯỚC 3 -> LƯU)
  // =========================================================================================
  const handleSaveQuestion = (e) => {
    e.preventDefault();

    if (!selectedGroupId) {
      showToast("Vui lòng chọn nhóm bài tập ở Bước 1!");
      return;
    }

    let newQuestion = null;
    const uniqueId = `cau_${Date.now()}`;

    // Tạo object câu hỏi theo từng loại (Question Type)
    if (selectedQuestionType === 'SPOT_ERROR') {
      if (spotTokens.length === 0) {
        showToast("Vui lòng nhập câu tiếng Anh và bấm Tách từ!");
        return;
      }
      if (!spotWrongTokenId) {
        showToast("Vui lòng bấm chọn từ bị sai trong câu!");
        return;
      }
      if (!spotCorrection.trim()) {
        showToast("Vui lòng nhập từ sửa lại cho đúng!");
        return;
      }
      newQuestion = {
        id: uniqueId,
        title: spotTitle.trim() || "Tìm lỗi sai trong câu",
        type: 'SPOT_ERROR',
        instruction: "Chỉ ra từ bị sai trong câu sau:",
        tokens: spotTokens,
        correct_token_id: Number(spotWrongTokenId),
        correction: spotCorrection.trim(),
        error_type: spotErrorType.trim(),
        explanation: spotExplanation.trim()
      };
    } else if (selectedQuestionType === 'FILL_BLANK_TEXT') {
      if (!textTemplate.trim()) {
        showToast("Vui lòng nhập mẫu câu có chứa {1}!");
        return;
      }
      if (!textBlank1Answers.trim()) {
        showToast("Vui lòng nhập đáp án đúng cho ô {1}!");
        return;
      }
      const blanks = {};
      blanks["1"] = {
        accepted_answers: textBlank1Answers.split(',').map(s => s.trim()).filter(Boolean)
      };
      if (textBlank2Answers.trim()) {
        blanks["2"] = {
          accepted_answers: textBlank2Answers.split(',').map(s => s.trim()).filter(Boolean)
        };
      }
      newQuestion = {
        id: uniqueId,
        title: textTitle.trim() || "Điền từ vào chỗ trống",
        type: 'FILL_BLANK_TEXT',
        instruction: "Điền từ đúng vào chỗ trống:",
        template: textTemplate.trim(),
        blanks,
        validation: { strict_case: false, ignore_extra_whitespace: true },
        explanation: textExplanation.trim()
      };
    } else if (selectedQuestionType === 'FILL_BLANK_DROPDOWN') {
      if (!dropTemplate.trim()) {
        showToast("Vui lòng nhập mẫu câu có chứa {1}!");
        return;
      }
      if (!dropOptions.trim()) {
        showToast("Vui lòng nhập các lựa chọn đáp án!");
        return;
      }
      if (!dropCorrect.trim()) {
        showToast("Vui lòng nhập đáp án đúng!");
        return;
      }
      const opts = dropOptions.split(',').map(s => s.trim()).filter(Boolean);
      newQuestion = {
        id: uniqueId,
        title: dropTitle.trim() || "Chọn từ thích hợp",
        type: 'FILL_BLANK_DROPDOWN',
        instruction: "Chọn từ đúng từ danh sách thả xuống:",
        template: dropTemplate.trim(),
        blanks: {
          "1": {
            options: opts,
            correct_answer: dropCorrect.trim()
          }
        },
        explanation: dropExplanation.trim()
      };
    } else if (selectedQuestionType === 'IMAGE_QUESTION') {
      if (!imgUrl.trim()) {
        showToast("Vui lòng nhập đường dẫn hình ảnh!");
        return;
      }
      if (!imgQuestion.trim()) {
        showToast("Vui lòng nhập nội dung câu hỏi!");
        return;
      }
      if (!imgOptions.trim()) {
        showToast("Vui lòng nhập các lựa chọn đáp án!");
        return;
      }
      if (!imgCorrect.trim()) {
        showToast("Vui lòng nhập đáp án đúng!");
        return;
      }
      const opts = imgOptions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      newQuestion = {
        id: uniqueId,
        title: imgTitle.trim() || "Quan sát hình ảnh và trả lời",
        type: 'IMAGE_QUESTION',
        instruction: "Quan sát bức ảnh bên dưới và chọn câu trả lời chính xác nhất:",
        image_url: imgUrl.trim(),
        image_caption: imgCaption.trim(),
        question_text: imgQuestion.trim(),
        options: opts,
        correct_answer: imgCorrect.trim(),
        explanation: imgExplanation.trim()
      };
    } else if (selectedQuestionType === 'PASSAGE_CLOZE') {
      if (!clozePassageText.trim()) {
        showToast("Vui lòng nhập đoạn văn có chứa {1}!");
        return;
      }
      if (!clozeBlank1Opts.trim() || !clozeBlank1Correct.trim()) {
        showToast("Vui lòng nhập các lựa chọn và đáp án đúng cho ô {1}!");
        return;
      }
      const blanks = {
        "1": {
          options: clozeBlank1Opts.split(',').map(s => s.trim()).filter(Boolean),
          correct_answer: clozeBlank1Correct.trim()
        }
      };
      if (clozeBlank2Opts.trim() && clozeBlank2Correct.trim()) {
        blanks["2"] = {
          options: clozeBlank2Opts.split(',').map(s => s.trim()).filter(Boolean),
          correct_answer: clozeBlank2Correct.trim()
        };
      }
      if (clozeBlank3Opts.trim() && clozeBlank3Correct.trim()) {
        blanks["3"] = {
          options: clozeBlank3Opts.split(',').map(s => s.trim()).filter(Boolean),
          correct_answer: clozeBlank3Correct.trim()
        };
      }
      newQuestion = {
        id: uniqueId,
        title: clozeTitle.trim() || "Đoạn văn điền từ",
        type: 'PASSAGE_CLOZE',
        instruction: "Đọc đoạn văn sau và chọn từ thích hợp cho mỗi chỗ trống:",
        passage_title: clozePassageTitle.trim(),
        passage_text: clozePassageText.trim(),
        blanks,
        explanation: clozeExplanation.trim()
      };
    } else if (selectedQuestionType === 'READING_COMPREHENSION') {
      if (!readPassageText.trim()) {
        showToast("Vui lòng nhập nội dung đoạn văn bài đọc!");
        return;
      }
      if (!readSub1Q.trim() || !readSub1Opts.trim() || !readSub1Correct.trim()) {
        showToast("Vui lòng hoàn thành câu hỏi con số 1!");
        return;
      }
      const subQ = [
        {
          id: "sub_1",
          question: readSub1Q.trim(),
          options: readSub1Opts.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
          correct_answer: readSub1Correct.trim()
        }
      ];
      if (readSub2Q.trim() && readSub2Opts.trim() && readSub2Correct.trim()) {
        subQ.push({
          id: "sub_2",
          question: readSub2Q.trim(),
          options: readSub2Opts.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
          correct_answer: readSub2Correct.trim()
        });
      }
      newQuestion = {
        id: uniqueId,
        title: readTitle.trim() || "Đọc hiểu văn bản",
        type: 'READING_COMPREHENSION',
        instruction: "Đọc kỹ đoạn văn sau và trả lời các câu hỏi liên quan:",
        passage_title: readPassageTitle.trim(),
        passage_text: readPassageText.trim(),
        sub_questions: subQ,
        explanation: readExplanation.trim()
      };
    } else if (selectedQuestionType === 'AUDIO_LISTENING') {
      if (!audioQuestion.trim()) {
        showToast("Vui lòng nhập nội dung câu hỏi nghe!");
        return;
      }
      if (!audioOptions.trim() || !audioCorrect.trim()) {
        showToast("Vui lòng nhập các lựa chọn đáp án và đáp án đúng!");
        return;
      }
      newQuestion = {
        id: uniqueId,
        title: audioTitle.trim() || "Nghe Audio và trả lời câu hỏi",
        type: 'AUDIO_LISTENING',
        instruction: "Nghe đoạn ghi âm sau và chọn câu trả lời đúng nhất:",
        audio_url: audioUrl.trim(),
        transcript: audioTranscript.trim(),
        question_text: audioQuestion.trim(),
        options: audioOptions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
        correct_answer: audioCorrect.trim(),
        explanation: audioExplanation.trim()
      };
    }

    if (!newQuestion) return;

    // Chèn câu hỏi vào nhóm bài tập đã chọn
    const targetGroup = groups.find(g => g.id === selectedGroupId) || groups[0];
    const updatedGroups = groups.map(g => {
      if (g.id === targetGroup.id) {
        return {
          ...g,
          questions: [...(g.questions || []), newQuestion]
        };
      }
      return g;
    });

    const updatedLessonData = { ...lessonData, groups: updatedGroups };
    setLessonData(updatedLessonData);
    saveStoredQuestions(updatedLessonData);

    // Đồng bộ lên backend Spring Boot nếu kết nối được
    createGrammarQuestionInBackend({
      ...newQuestion,
      groupId: targetGroup.id
    });

    // Reset các ô input sau khi lưu xong để sẵn sàng tạo câu tiếp theo
    setSpotTitle('');
    setSpotRawSentence('');
    setSpotTokens([]);
    setSpotWrongTokenId(null);
    setSpotCorrection('');
    setSpotErrorType('');
    setSpotExplanation('');

    setTextTitle('');
    setTextTemplate('');
    setTextBlank1Answers('');
    setTextBlank2Answers('');
    setTextExplanation('');

    setDropTitle('');
    setDropTemplate('');
    setDropOptions('');
    setDropCorrect('');
    setDropExplanation('');

    setCardTitle('');
    setCardTemplate('');
    setCardOptions('');
    setCardCorrect('');
    setCardExplanation('');

    setImgTitle('');
    setImgUrl('');
    setImgCaption('');
    setImgQuestion('');
    setImgOptions('');
    setImgCorrect('');
    setImgExplanation('');

    setClozeTitle('');
    setClozePassageTitle('');
    setClozePassageText('');
    setClozeBlank1Opts('');
    setClozeBlank1Correct('');
    setClozeBlank2Opts('');
    setClozeBlank2Correct('');
    setClozeBlank3Opts('');
    setClozeBlank3Correct('');
    setClozeExplanation('');

    setReadTitle('');
    setReadPassageTitle('');
    setReadPassageText('');
    setReadSub1Q('');
    setReadSub1Opts('');
    setReadSub1Correct('');
    setReadSub2Q('');
    setReadSub2Opts('');
    setReadSub2Correct('');
    setReadExplanation('');

    setAudioTitle('');
    setAudioUrl('');
    setAudioTranscript('');
    setAudioQuestion('');
    setAudioOptions('');
    setAudioCorrect('');
    setAudioExplanation('');

    showToast(`Đã lưu câu hỏi thành công vào "${targetGroup.title}"!`);
  };

  // Chuẩn bị object câu hỏi mẫu cho khung Live Preview
  const getPreviewQuestionObject = () => {
    if (selectedQuestionType === 'SPOT_ERROR') {
      const tokensToUse = spotTokens.length > 0
        ? spotTokens
        : [{ id: 1, text: "Nhập" }, { id: 2, text: "câu" }, { id: 3, text: "tiếng" }, { id: 4, text: "Anh..." }];
      return {
        id: "preview_spot",
        title: spotTitle || "Xem trước: Tìm lỗi sai",
        type: 'SPOT_ERROR',
        instruction: "Chỉ ra từ bị sai trong câu sau:",
        tokens: tokensToUse,
        correct_token_id: Number(spotWrongTokenId) || 1,
        correction: spotCorrection || "(từ sửa lại đúng)",
        error_type: spotErrorType || "",
        explanation: spotExplanation || "Giải thích đáp án sẽ hiển thị tại đây sau khi hoàn thành câu hỏi."
      };
    } else if (selectedQuestionType === 'FILL_BLANK_TEXT') {
      const blanks = {
        "1": {
          accepted_answers: textBlank1Answers ? textBlank1Answers.split(',').map(s => s.trim()).filter(Boolean) : ["..."]
        }
      };
      if (textBlank2Answers.trim()) {
        blanks["2"] = {
          accepted_answers: textBlank2Answers.split(',').map(s => s.trim()).filter(Boolean)
        };
      }
      return {
        id: "preview_text",
        title: textTitle || "Xem trước: Điền từ vào chỗ trống",
        type: 'FILL_BLANK_TEXT',
        instruction: "Điền từ đúng vào chỗ trống:",
        template: textTemplate || "Mẫu câu xem trước có chứa {1} để làm bài.",
        blanks,
        validation: { strict_case: false, ignore_extra_whitespace: true },
        explanation: textExplanation || "Giải thích đáp án sẽ hiển thị tại đây sau khi hoàn thành câu hỏi."
      };
    } else if (selectedQuestionType === 'FILL_BLANK_DROPDOWN') {
      const opts = dropOptions ? dropOptions.split(',').map(s => s.trim()).filter(Boolean) : ["Lựa chọn 1", "Lựa chọn 2"];
      return {
        id: "preview_drop",
        title: dropTitle || "Xem trước: Chọn từ danh sách",
        type: 'FILL_BLANK_DROPDOWN',
        instruction: "Chọn từ đúng từ danh sách thả xuống:",
        template: dropTemplate || "Mẫu câu xem trước có chứa {1} để làm bài.",
        blanks: {
          "1": {
            options: opts,
            correct_answer: dropCorrect.trim() || opts[0] || ""
          }
        },
        explanation: dropExplanation || "Giải thích đáp án sẽ hiển thị tại đây sau khi hoàn thành câu hỏi."
      };
    } else if (selectedQuestionType === 'FILL_BLANK_CARDS') {
      const opts = cardOptions ? cardOptions.split(',').map(s => s.trim()).filter(Boolean) : ["Đáp án A", "Đáp án B"];
      return {
        id: "preview_card",
        title: cardTitle || "Xem trước: Chọn thẻ đáp án",
        type: 'FILL_BLANK_CARDS',
        instruction: "Bấm chọn thẻ đáp án đúng để hoàn thành câu:",
        template: cardTemplate || "Mẫu câu xem trước có chứa {1} để làm bài.",
        blanks: {
          "1": {
            options: opts,
            correct_answer: cardCorrect.trim() || opts[0] || ""
          }
        },
        explanation: cardExplanation || "Giải thích đáp án sẽ hiển thị tại đây sau khi hoàn thành câu hỏi."
      };
    } else if (selectedQuestionType === 'IMAGE_QUESTION') {
      const opts = imgOptions ? imgOptions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"];
      return {
        id: "preview_img",
        title: imgTitle || "Xem trước: Câu hỏi hình ảnh",
        type: 'IMAGE_QUESTION',
        instruction: "Quan sát bức ảnh bên dưới và chọn câu trả lời chính xác nhất:",
        image_url: imgUrl || "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
        image_caption: imgCaption || "Ảnh minh họa xem trước",
        question_text: imgQuestion || "What is happening in the picture?",
        options: opts,
        correct_answer: imgCorrect.trim() || opts[0] || "",
        explanation: imgExplanation || "Giải thích đáp án sẽ hiển thị tại đây sau khi hoàn thành câu hỏi."
      };
    } else if (selectedQuestionType === 'PASSAGE_CLOZE') {
      const blanks = {
        "1": {
          options: clozeBlank1Opts ? clozeBlank1Opts.split(',').map(s => s.trim()).filter(Boolean) : ["habitats", "buildings", "factories"],
          correct_answer: clozeBlank1Correct.trim() || "habitats"
        }
      };
      if (clozeBlank2Opts.trim()) {
        blanks["2"] = {
          options: clozeBlank2Opts.split(',').map(s => s.trim()).filter(Boolean),
          correct_answer: clozeBlank2Correct.trim()
        };
      }
      if (clozeBlank3Opts.trim()) {
        blanks["3"] = {
          options: clozeBlank3Opts.split(',').map(s => s.trim()).filter(Boolean),
          correct_answer: clozeBlank3Correct.trim()
        };
      }
      return {
        id: "preview_cloze",
        title: clozeTitle || "Xem trước: Đoạn văn điền từ",
        type: 'PASSAGE_CLOZE',
        instruction: "Đọc đoạn văn sau và chọn từ thích hợp cho mỗi chỗ trống:",
        passage_title: clozePassageTitle || "Bài đọc mẫu xem trước",
        passage_text: clozePassageText || "Human activities have damaged natural {1} for decades. Communities must focus on renewable {2}.",
        blanks,
        explanation: clozeExplanation || "Giải thích đáp án sẽ hiển thị tại đây sau khi hoàn thành câu hỏi."
      };
    } else if (selectedQuestionType === 'READING_COMPREHENSION') {
      const subQ = [];
      const opts1 = readSub1Opts ? readSub1Opts.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : ["Lựa chọn A", "Lựa chọn B"];
      subQ.push({
        id: "sub_1",
        question: readSub1Q || "Câu hỏi đọc hiểu số 1?",
        options: opts1,
        correct_answer: readSub1Correct.trim() || opts1[0] || ""
      });
      if (readSub2Q.trim()) {
        const opts2 = readSub2Opts ? readSub2Opts.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : ["Lựa chọn A", "Lựa chọn B"];
        subQ.push({
          id: "sub_2",
          question: readSub2Q,
          options: opts2,
          correct_answer: readSub2Correct.trim() || opts2[0] || ""
        });
      }
      return {
        id: "preview_reading",
        title: readTitle || "Xem trước: Đọc hiểu văn bản",
        type: 'READING_COMPREHENSION',
        instruction: "Đọc kỹ đoạn văn sau và trả lời các câu hỏi liên quan:",
        passage_title: readPassageTitle || "Tiêu đề bài đọc",
        passage_text: readPassageText || "Đoạn văn đọc hiểu mẫu xem trước. Học viên sẽ đọc nội dung bên trái và trả lời các câu hỏi con bên phải.",
        sub_questions: subQ,
        explanation: readExplanation || "Giải thích đáp án sẽ hiển thị tại đây sau khi hoàn thành câu hỏi."
      };
    } else if (selectedQuestionType === 'AUDIO_LISTENING') {
      const audioOpts = audioOptions ? audioOptions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : ["Đáp án A", "Đáp án B", "Đáp án C"];
      return {
        id: "preview_audio",
        title: audioTitle || "Xem trước: Nghe Audio",
        type: 'AUDIO_LISTENING',
        instruction: "Nghe đoạn ghi âm sau và chọn câu trả lời đúng nhất:",
        audio_url: audioUrl.trim(),
        transcript: audioTranscript || "Attention passengers. Flight VN123 is now boarding at Gate 14.",
        question_text: audioQuestion || "Câu hỏi nghe xem trước?",
        options: audioOpts,
        correct_answer: audioCorrect.trim() || audioOpts[0] || "",
        explanation: audioExplanation || "Giải thích đáp án sẽ hiển thị tại đây sau khi hoàn thành câu hỏi."
      };
    } else {
      return {
        id: "preview_unknown",
        title: "Xem trước",
        type: selectedQuestionType,
        instruction: "Xem trước câu hỏi"
      };
    }
  };

  const previewQuestion = getPreviewQuestionObject();
  const selectedGroupObj = groups.find(g => g.id === selectedGroupId) || groups[0];

  return (
    <div
      className="grammar-container animate-fade-in"
      style={{
        maxWidth: '1050px',
        margin: '0 auto',
        paddingTop: 'calc(var(--nav-height, 70px) + 30px)',
        paddingBottom: '60px',
        paddingLeft: '20px',
        paddingRight: '20px'
      }}
    >

      {/* Thông báo Toast phản hồi */}
      {toastMessage && (
        <div className="admin-toast animate-pop">
          {toastMessage}
        </div>
      )}

      {/* THANH TIÊU ĐỀ SOẠN BÀI TẬP CỘNG ĐỒNG */}
      <div className="grammar-page-titlebar" style={{ marginBottom: '20px' }}>
        <div className="grammar-title-left">
          <span className="grammar-lesson-badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-main)', borderColor: 'rgba(255, 255, 255, 0.15)' }}>
            Soạn bài tập cộng đồng
          </span>
          <span className="grammar-lesson-subtitle">
            Người tạo: <strong style={{ color: 'var(--text-main)' }}>{user?.name || user?.email || 'Thành viên cộng đồng'}</strong>
          </span>
        </div>

        {/* CÁC NÚT ĐIỀU HƯỚNG NHANH */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/grammar')}
            title="Quay lại Bảng tin bài tập cộng đồng để làm bài"
            style={{ fontWeight: 600 }}
          >
            Bảng tin bài tập
          </button>
          <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}>
            Trang chủ
          </button>
        </div>
      </div>

      {/* BƯỚC 1: CHỌN HOẶC TẠO NHÓM BÀI TẬP (Ví dụ: Test 1, Test 2,...) */}

          {/* ================================================================================= */}
          {/* ================================================================================= */}
          {/* BƯỚC 1: CHỌN HOẶC TẠO NHÓM BÀI TẬP (Ví dụ: Test 1, Test 2,...)                     */}
          {/* ================================================================================= */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: '#38bdf8', color: '#000', fontWeight: 800, alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  1
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#38bdf8' }}>
                  Bước 1: Chọn bài tập (Ví dụ: Test 1, Test 2...)
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={() => setIsCreatingNewGroup(!isCreatingNewGroup)}
                style={{ fontSize: '13px', color: isCreatingNewGroup ? '#f43f5e' : 'var(--primary)' }}
              >
                {isCreatingNewGroup ? "Hủy tạo mới" : "+ Tạo bài tập mới"}
              </button>
            </div>

            {/* Form tạo bài tập mới */}
            {isCreatingNewGroup ? (
              <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '12px', border: '1px dashed #38bdf8', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#38bdf8' }}>
                  Thông tin bài tập mới:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tên bài tập (Ví dụ: Test 4):</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ví dụ: Test 4"
                      value={newGroupTitle}
                      onChange={(e) => setNewGroupTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Mô tả ngắn (không bắt buộc):</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Mô tả bài tập..."
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                    />
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleCreateNewGroup} style={{ height: '42px' }}>
                    Lưu & Chọn Bài Này
                  </button>
                </div>
              </div>
            ) : (
              /* Dropdown chọn bài tập có sẵn */
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Chọn bài tập bạn muốn thêm câu hỏi vào:
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: 'fit-content' }}>
                    <select
                      className="form-input"
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        width: 'auto',
                        minWidth: '240px',
                        cursor: 'pointer',
                        padding: '10px 36px 10px 14px'
                      }}
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.title} ({g.questions?.length || 0} câu hỏi)
                        </option>
                      ))}
                    </select>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Đang chọn: <strong style={{ color: 'var(--primary)' }}>{selectedGroupObj?.title}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================================= */}
          {/* BƯỚC 2: CHỌN DẠNG BÀI (DẠNG DROPDOWN THEO YÊU CẦU 2)                               */}
          {/* ================================================================================= */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: '#c084fc', color: '#000', fontWeight: 800, alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                2
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#c084fc' }}>
                  Bước 2: Chọn dạng câu hỏi
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Chọn dạng bài tập bạn muốn tạo cho học viên:
                </span>
              </div>
            </div>

            {/* DROPDOWN CHỌN DẠNG BÀI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative', width: 'fit-content' }}>
                <select
                  className="form-input"
                  value={selectedQuestionType}
                  onChange={(e) => setSelectedQuestionType(e.target.value)}
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    width: 'auto',
                    minWidth: '320px',
                    cursor: 'pointer',
                    padding: '10px 36px 10px 14px'
                  }}
                >
                  {getAllQuestionTypes().map((typeObj) => (
                    <option key={typeObj.id} value={typeObj.id}>
                      {typeObj.label} ({typeObj.badge})
                    </option>
                  ))}
                </select>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {getQuestionTypeInfo(selectedQuestionType)?.description}
              </span>
            </div>
          </div>

          {/* ================================================================================= */}
          {/* BƯỚC 3: NHẬP NỘI DUNG CÂU HỎI & LIVE PREVIEW (KHÔNG ĐIỀN TRƯỚC, KHÔNG GỢI Ý)       */}
          {/* ================================================================================= */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: '#34d399', color: '#000', fontWeight: 800, alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                3
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#34d399' }}>
                  Bước 3: Nhập nội dung câu hỏi
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Đang soạn: <strong>{getQuestionTypeInfo(selectedQuestionType).label}</strong> cho bài <strong>{selectedGroupObj?.title}</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveQuestion}>
              {/* --- FORM 1: TÌM LỖI SAI --- */}
              {selectedQuestionType === 'SPOT_ERROR' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Tiêu đề câu hỏi:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={spotTitle}
                      onChange={(e) => setSpotTitle(e.target.value)}
                      placeholder="Ví dụ: Câu 1: Tìm lỗi sai trong câu"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Câu tiếng Anh cần kiểm tra:
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={spotRawSentence}
                        onChange={(e) => setSpotRawSentence(e.target.value)}
                        placeholder="Nhập câu tiếng Anh vào đây rồi bấm nút bên cạnh..."
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAutoTokenize}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Tách từ
                      </button>
                    </div>
                  </div>

                  {spotTokens.length > 0 && (
                    <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px' }}>
                      <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                        Bấm chọn từ bị sai trong câu:
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {spotTokens.map(token => {
                          const isWrong = token.id === Number(spotWrongTokenId);
                          return (
                            <button
                              type="button"
                              key={token.id}
                              onClick={() => setSpotWrongTokenId(token.id)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: isWrong ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                                background: isWrong ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                                color: isWrong ? '#ef4444' : 'var(--text-main)',
                                fontWeight: isWrong ? 700 : 500,
                                cursor: 'pointer'
                              }}
                            >
                              {token.text} {isWrong && " (Lỗi)"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Từ sửa lại cho đúng:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={spotCorrection}
                        onChange={(e) => setSpotCorrection(e.target.value)}
                        placeholder="Ví dụ: went"
                      />
                    </div>
                    <div>
                      <label className="form-label">Dạng ngữ pháp (không bắt buộc):</label>
                      <input
                        type="text"
                        className="form-input"
                        value={spotErrorType}
                        onChange={(e) => setSpotErrorType(e.target.value)}
                        placeholder="Ví dụ: Thì quá khứ đơn"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Giải thích đáp án (sẽ hiển thị sau khi hoàn thành):</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={spotExplanation}
                      onChange={(e) => setSpotExplanation(e.target.value)}
                      placeholder="Giải thích vì sao từ đó sai và quy tắc đúng..."
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 2: ĐIỀN TỪ VÀO CHỖ TRỐNG --- */}
              {selectedQuestionType === 'FILL_BLANK_TEXT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Tiêu đề câu hỏi:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      placeholder="Ví dụ: Câu 2: Chia động từ"
                    />
                  </div>

                  <div>
                    <label className="form-label">Mẫu câu có chỗ trống (Dùng {'{1}'}, {'{2}'} để đánh dấu vị trí cần điền):</label>
                    <input
                      type="text"
                      className="form-input"
                      value={textTemplate}
                      onChange={(e) => setTextTemplate(e.target.value)}
                      placeholder="Ví dụ: If I {1} enough money, I {2} a new house."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#c084fc' }}>Ô trống {'{1}'}:</h4>
                      <label className="form-label">Đáp án đúng (nếu có nhiều đáp án thì ngăn cách bằng dấu phẩy):</label>
                      <input
                        type="text"
                        className="form-input"
                        value={textBlank1Answers}
                        onChange={(e) => setTextBlank1Answers(e.target.value)}
                        placeholder="Ví dụ: had"
                      />
                    </div>

                    <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#c084fc' }}>Ô trống {'{2}'} (nếu có):</h4>
                      <label className="form-label">Đáp án đúng:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={textBlank2Answers}
                        onChange={(e) => setTextBlank2Answers(e.target.value)}
                        placeholder="Ví dụ: would buy, 'd buy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Giải thích đáp án (sẽ hiển thị sau khi hoàn thành):</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={textExplanation}
                      onChange={(e) => setTextExplanation(e.target.value)}
                      placeholder="Giải thích ngữ pháp..."
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 3: CHỌN TỪ TRONG DANH SÁCH THẢ XUỐNG --- */}
              {selectedQuestionType === 'FILL_BLANK_DROPDOWN' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Tiêu đề câu hỏi:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={dropTitle}
                      onChange={(e) => setDropTitle(e.target.value)}
                      placeholder="Ví dụ: Câu 3: Chọn từ thích hợp"
                    />
                  </div>

                  <div>
                    <label className="form-label">Mẫu câu có chỗ trống (Dùng {'{1}'} để đánh dấu vị trí):</label>
                    <input
                      type="text"
                      className="form-input"
                      value={dropTemplate}
                      onChange={(e) => setDropTemplate(e.target.value)}
                      placeholder="Ví dụ: They have lived in Vietnam {1} 3 years."
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Các lựa chọn trong menu thả xuống (ngăn cách bằng dấu phẩy):</label>
                      <input
                        type="text"
                        className="form-input"
                        value={dropOptions}
                        onChange={(e) => setDropOptions(e.target.value)}
                        placeholder="Ví dụ: for, since, from, during"
                      />
                    </div>
                    <div>
                      <label className="form-label">Đáp án đúng:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={dropCorrect}
                        onChange={(e) => setDropCorrect(e.target.value)}
                        placeholder="Ví dụ: for"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Giải thích đáp án (sẽ hiển thị sau khi hoàn thành):</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={dropExplanation}
                      onChange={(e) => setDropExplanation(e.target.value)}
                      placeholder="Giải thích lý do chọn đáp án này..."
                    />
                  </div>
                </div>
              )}



              {/* --- FORM 5: CÂU HỎI HÌNH ẢNH --- */}
              {selectedQuestionType === 'IMAGE_QUESTION' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Tiêu đề câu hỏi:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={imgTitle}
                      onChange={(e) => setImgTitle(e.target.value)}
                      placeholder="Ví dụ: Câu 1: Quan sát hình ảnh lớp học"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Đường dẫn hình ảnh (URL):</label>
                      <input
                        type="text"
                        className="form-input"
                        value={imgUrl}
                        onChange={(e) => setImgUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... hoặc link ảnh"
                      />
                    </div>
                    <div>
                      <label className="form-label">Chú thích ảnh (tùy chọn):</label>
                      <input
                        type="text"
                        className="form-input"
                        value={imgCaption}
                        onChange={(e) => setImgCaption(e.target.value)}
                        placeholder="Ví dụ: Hoạt động trong lớp học"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Nội dung câu hỏi liên quan đến ảnh:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={imgQuestion}
                      onChange={(e) => setImgQuestion(e.target.value)}
                      placeholder="Ví dụ: What are the students and teacher doing in the classroom?"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Các lựa chọn đáp án (ngăn cách bằng dấu phẩy):</label>
                      <input
                        type="text"
                        className="form-input"
                        value={imgOptions}
                        onChange={(e) => setImgOptions(e.target.value)}
                        placeholder="Ví dụ: The teacher is teaching, The students are sleeping, Playing football"
                      />
                    </div>
                    <div>
                      <label className="form-label">Đáp án đúng:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={imgCorrect}
                        onChange={(e) => setImgCorrect(e.target.value)}
                        placeholder="Nhập chính xác đáp án đúng"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Giải thích đáp án (sẽ hiển thị sau khi hoàn thành):</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={imgExplanation}
                      onChange={(e) => setImgExplanation(e.target.value)}
                      placeholder="Giải thích chi tiết câu trả lời..."
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 6: ĐOẠN VĂN ĐIỀN TỪ --- */}
              {selectedQuestionType === 'PASSAGE_CLOZE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Tiêu đề câu hỏi:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={clozeTitle}
                        onChange={(e) => setClozeTitle(e.target.value)}
                        placeholder="Ví dụ: Câu 2: Đoạn văn điền từ - Môi trường"
                      />
                    </div>
                    <div>
                      <label className="form-label">Tiêu đề đoạn văn (tùy chọn):</label>
                      <input
                        type="text"
                        className="form-input"
                        value={clozePassageTitle}
                        onChange={(e) => setClozePassageTitle(e.target.value)}
                        placeholder="Ví dụ: Protecting Our Environment"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Nội dung đoạn văn (Dùng {'{1}'}, {'{2}'}, {'{3}'} để đánh dấu chỗ trống):</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      value={clozePassageText}
                      onChange={(e) => setClozePassageText(e.target.value)}
                      placeholder="Nhập đoạn văn. Ví dụ: Pollution is a challenge. Human activities damaged {1}. We must focus on {2} plastic and renewable {3}."
                    />
                  </div>

                  {/* Chỗ trống 1 */}
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}>Chỗ trống {'{1}'} (Bắt buộc):</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Các lựa chọn (ngăn cách dấu phẩy):</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank1Opts}
                          onChange={(e) => setClozeBlank1Opts(e.target.value)}
                          placeholder="Ví dụ: habitats, buildings, factories, roads"
                        />
                      </div>
                      <div>
                        <label className="form-label">Đáp án đúng {'{1}'}:</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank1Correct}
                          onChange={(e) => setClozeBlank1Correct(e.target.value)}
                          placeholder="Ví dụ: habitats"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chỗ trống 2 */}
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}>Chỗ trống {'{2}'} (Nếu có):</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Các lựa chọn (ngăn cách dấu phẩy):</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank2Opts}
                          onChange={(e) => setClozeBlank2Opts(e.target.value)}
                          placeholder="Ví dụ: recycling, burning, throwing, buying"
                        />
                      </div>
                      <div>
                        <label className="form-label">Đáp án đúng {'{2}'}:</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank2Correct}
                          onChange={(e) => setClozeBlank2Correct(e.target.value)}
                          placeholder="Ví dụ: recycling"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chỗ trống 3 */}
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}>Chỗ trống {'{3}'} (Nếu có):</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Các lựa chọn (ngăn cách dấu phẩy):</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank3Opts}
                          onChange={(e) => setClozeBlank3Opts(e.target.value)}
                          placeholder="Ví dụ: energy, vehicles, clothes, food"
                        />
                      </div>
                      <div>
                        <label className="form-label">Đáp án đúng {'{3}'}:</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank3Correct}
                          onChange={(e) => setClozeBlank3Correct(e.target.value)}
                          placeholder="Ví dụ: energy"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Giải thích đáp án (sẽ hiển thị sau khi hoàn thành):</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={clozeExplanation}
                      onChange={(e) => setClozeExplanation(e.target.value)}
                      placeholder="Giải thích lý do chọn từng đáp án..."
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 7: ĐỌC HIỂU VĂN BẢN --- */}
              {selectedQuestionType === 'READING_COMPREHENSION' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Tiêu đề câu hỏi:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={readTitle}
                        onChange={(e) => setReadTitle(e.target.value)}
                        placeholder="Ví dụ: Câu 3: Đọc hiểu - Trí tuệ nhân tạo"
                      />
                    </div>
                    <div>
                      <label className="form-label">Tiêu đề bài đọc:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={readPassageTitle}
                        onChange={(e) => setReadPassageTitle(e.target.value)}
                        placeholder="Ví dụ: Artificial Intelligence in Modern Learning"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Nội dung bài đọc (Đoạn văn đọc hiểu):</label>
                    <textarea
                      className="form-input"
                      rows={6}
                      value={readPassageText}
                      onChange={(e) => setReadPassageText(e.target.value)}
                      placeholder="Nhập toàn bộ nội dung bài đọc..."
                    />
                  </div>

                  {/* Câu hỏi con 1 */}
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)' }}>Câu hỏi con 1 (Bắt buộc):</div>
                    <div>
                      <label className="form-label">Nội dung câu hỏi 1:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={readSub1Q}
                        onChange={(e) => setReadSub1Q(e.target.value)}
                        placeholder="Ví dụ: How does AI benefit students?"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Các lựa chọn (ngăn cách bằng dấu phẩy):</label>
                        <input
                          type="text"
                          className="form-input"
                          value={readSub1Opts}
                          onChange={(e) => setReadSub1Opts(e.target.value)}
                          placeholder="Ví dụ: Learn at their own pace, Replace teachers, Eliminate homework"
                        />
                      </div>
                      <div>
                        <label className="form-label">Đáp án đúng câu 1:</label>
                        <input
                          type="text"
                          className="form-input"
                          value={readSub1Correct}
                          onChange={(e) => setReadSub1Correct(e.target.value)}
                          placeholder="Nhập chính xác 1 lựa chọn"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Câu hỏi con 2 */}
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)' }}>Câu hỏi con 2 (Nếu có):</div>
                    <div>
                      <label className="form-label">Nội dung câu hỏi 2:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={readSub2Q}
                        onChange={(e) => setReadSub2Q(e.target.value)}
                        placeholder="Ví dụ: What qualities of teachers cannot be replicated by AI?"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Các lựa chọn (ngăn cách bằng dấu phẩy):</label>
                        <input
                          type="text"
                          className="form-input"
                          value={readSub2Opts}
                          onChange={(e) => setReadSub2Opts(e.target.value)}
                          placeholder="Ví dụ: Emotional support, Storing scores, Printing papers"
                        />
                      </div>
                      <div>
                        <label className="form-label">Đáp án đúng câu 2:</label>
                        <input
                          type="text"
                          className="form-input"
                          value={readSub2Correct}
                          onChange={(e) => setReadSub2Correct(e.target.value)}
                          placeholder="Nhập chính xác 1 lựa chọn"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Giải thích đáp án (sẽ hiển thị sau khi hoàn thành):</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={readExplanation}
                      onChange={(e) => setReadExplanation(e.target.value)}
                      placeholder="Giải thích chi tiết hoặc dẫn chứng từ bài đọc..."
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 8: NGHE AUDIO TRẢ LỜI CÂU HỎI --- */}
              {selectedQuestionType === 'AUDIO_LISTENING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Tiêu đề câu hỏi:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder="Ví dụ: Câu 4: Nghe thông báo tại sân bay"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Đường dẫn file Audio (URL - để trống nếu dùng giọng máy đọc):</label>
                      <input
                        type="text"
                        className="form-input"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="https://... hoặc để trống để hệ thống tự phát âm lời thoại"
                      />
                    </div>
                    <div>
                      <label className="form-label">Đáp án đúng:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={audioCorrect}
                        onChange={(e) => setAudioCorrect(e.target.value)}
                        placeholder="Nhập chính xác đáp án đúng"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Nội dung lời thoại / Transcript (Dùng phát âm AI & hiện sau khi hoàn thành):</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={audioTranscript}
                      onChange={(e) => setAudioTranscript(e.target.value)}
                      placeholder="Ví dụ: Attention all passengers on flight VN123 to Tokyo. Your flight is boarding at Gate Number 14."
                    />
                  </div>

                  <div>
                    <label className="form-label">Nội dung câu hỏi nghe:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={audioQuestion}
                      onChange={(e) => setAudioQuestion(e.target.value)}
                      placeholder="Ví dụ: Which gate is flight VN123 boarding at?"
                    />
                  </div>

                  <div>
                    <label className="form-label">Các lựa chọn đáp án (ngăn cách bằng dấu phẩy):</label>
                    <input
                      type="text"
                      className="form-input"
                      value={audioOptions}
                      onChange={(e) => setAudioOptions(e.target.value)}
                      placeholder="Ví dụ: Gate Number 14, Gate Number 24, Gate Number 4, Gate Number 40"
                    />
                  </div>

                  <div>
                    <label className="form-label">Giải thích đáp án (sẽ hiển thị sau khi hoàn thành):</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={audioExplanation}
                      onChange={(e) => setAudioExplanation(e.target.value)}
                      placeholder="Giải thích câu trả lời nghe được trong lời thoại..."
                    />
                  </div>
                </div>
              )}

              {/* KHUNG XEM TRƯỚC TRỰC QUAN (LIVE INTERACTIVE PREVIEW) */}
              <div style={{ marginTop: '24px', padding: '20px', borderRadius: '14px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                  Xem trước giao diện học viên (Live Preview):
                </span>
                {previewQuestion.type === 'SPOT_ERROR' && (
                  <SpotTheErrorQuestion
                    question={previewQuestion}
                    onAnswerResult={() => {}}
                  />
                )}
                {(previewQuestion.type === 'FILL_BLANK_TEXT' ||
                  previewQuestion.type === 'FILL_BLANK_DROPDOWN') && (
                    <FillBlankQuestion
                      question={previewQuestion}
                      onAnswerResult={() => {}}
                    />
                  )}
                {previewQuestion.type === 'IMAGE_QUESTION' && (
                  <ImageQuestion
                    question={previewQuestion}
                    onAnswerResult={() => {}}
                  />
                )}
                {previewQuestion.type === 'PASSAGE_CLOZE' && (
                  <PassageClozeQuestion
                    question={previewQuestion}
                    onAnswerResult={() => {}}
                  />
                )}
                {previewQuestion.type === 'READING_COMPREHENSION' && (
                  <ReadingComprehensionQuestion
                    question={previewQuestion}
                    onAnswerResult={() => {}}
                  />
                )}
                {previewQuestion.type === 'AUDIO_LISTENING' && (
                  <AudioListeningQuestion
                    question={previewQuestion}
                    onAnswerResult={() => {}}
                  />
                )}
              </div>

              {/* NÚT LƯU CÂU HỎI VÀO NHÓM */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '14px 28px', fontSize: '16px', fontWeight: 700, borderRadius: '10px' }}
                >
                  Lưu Câu Hỏi Vào "{selectedGroupObj?.title}"
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};

export default GrammarAdminCMSPage;
