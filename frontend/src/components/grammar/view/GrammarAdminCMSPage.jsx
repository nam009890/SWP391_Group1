import { t } from '../../../i18n/index.js';
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

  // --- 3.4: Dạng FILL_BLANK_CARDS (Chọn thẻ đáp án) ---
  const [cardTitle, setCardTitle] = useState("");
  const [cardTemplate, setCardTemplate] = useState("");
  const [cardOptions, setCardOptions] = useState("");
  const [cardCorrect, setCardCorrect] = useState("");
  const [cardExplanation, setCardExplanation] = useState("");

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
    showToast(t('common:feedback_3', { v0: newTokens.length }));
  };

  // Tạo nhóm bài tập mới (ví dụ: Test 4, Test 5...)
  const handleCreateNewGroup = (e) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) {
      showToast(t('grammar:vui_long_nhap_ten_nhom_bai_tap_7db272'));
      return;
    }

    const newGroupId = `group_${Date.now()}`;
    const authorName = user?.name || user?.username || (user?.email ? user.email.split('@')[0] : t('grammar:thanh_vien_cong_dong_2691c4'));
    const authorEmail = user?.email || "community@studye.edu.vn";

    const newGroup = {
      id: newGroupId,
      title: newGroupTitle.trim(),
      description: newGroupDesc.trim() || t('common:feedback_4', { v0: newGroupTitle.trim() }),
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
    showToast(t('common:feedback_5', { v0: newGroup.title }));
  };

  // Lấy danh sách toàn bộ báo cáo lỗi từ học viên gửi về
  const allReports = groups.flatMap(g => (g.reports || []).map(r => ({ ...r, groupTitle: g.title, groupId: g.id })));
  const openReportsCount = allReports.filter(r => r.status === 'OPEN').length;

  // Đánh dấu đã sửa xong một báo cáo
  const handleResolveReport = (groupId, reportId) => {
    const updated = resolveQuestionReport(groupId, reportId);
    setLessonData(updated);
    showToast(t('grammar:a_danh_dau_bao_cao_da_duoc_giai_quyet_93c0a8'));
  };

  // Mở tab Gmail để phản hồi trực tiếp cho học viên đã báo lỗi
  const handleReplyReportViaGmail = (rep) => {
    const subject = t('common:feedback_6', { v0: rep.testTitle, v1: rep.questionTitle });
    const body = t('common:feedback_7', { v0: rep.reporterName || t('grammar:ban_e8f043'), v1: rep.testTitle, v2: rep.questionTitle });
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(rep.reporterEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Xóa một nhóm bài tập
  const handleDeleteGroup = (groupId, groupTitle) => {
    if (groups.length <= 1) {
      showToast(t('grammar:khong_the_xoa_nhom_bai_tap_duy_nhat_con__451a87'));
      return;
    }
    if (window.confirm(t('common:feedback_8', { v0: groupTitle }))) {
      const updatedGroups = groups.filter(g => g.id !== groupId);
      const updatedData = { ...lessonData, groups: updatedGroups };
      setLessonData(updatedData);
      saveStoredQuestions(updatedData);
      if (selectedGroupId === groupId) {
        setSelectedGroupId(updatedGroups[0]?.id || '');
      }
      showToast(t('common:feedback_9', { v0: groupTitle }));
    }
  };

  // Xóa một câu hỏi cụ thể trong nhóm
  const handleDeleteQuestion = (groupId, questionId, questionTitle) => {
    if (window.confirm(t('common:feedback_10', { v0: questionTitle }))) {
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
      showToast(t('grammar:a_xoa_cau_hoi_khoi_nhom_thanh_cong_3afe34'));
    }
  };

  // Reset toàn bộ câu hỏi về mặc định
  const handleResetToDefaults = () => {
    if (window.confirm(t('grammar:khoi_phuc_toan_bo_bai_tap_ve_mac_dinh_ba_cffd31'))) {
      const defaultData = resetStoredQuestions();
      setLessonData(defaultData);
      setSelectedGroupId(defaultData.groups[0]?.id || '');
      showToast(t('grammar:a_khoi_phuc_cac_nhom_bai_test_mac_dinh_64ada4'));
    }
  };

  // =========================================================================================
  // XỬ LÝ LƯU CÂU HỎI VÀO NHÓM ĐÃ CHỌN (BƯỚC 1 -> BƯỚC 2 -> BƯỚC 3 -> LƯU)
  // =========================================================================================
  const handleSaveQuestion = (e) => {
    e.preventDefault();

    if (!selectedGroupId) {
      showToast(t('grammar:vui_long_chon_nhom_bai_tap_o_buoc_1_db5985'));
      return;
    }

    let newQuestion = null;
    const uniqueId = `cau_${Date.now()}`;

    // Tạo object câu hỏi theo từng loại (Question Type)
    if (selectedQuestionType === 'SPOT_ERROR') {
      if (spotTokens.length === 0) {
        showToast(t('grammar:vui_long_nhap_cau_tieng_anh_va_bam_tach__e2de62'));
        return;
      }
      if (!spotWrongTokenId) {
        showToast(t('grammar:vui_long_bam_chon_tu_bi_sai_trong_cau_c53d0b'));
        return;
      }
      if (!spotCorrection.trim()) {
        showToast(t('grammar:vui_long_nhap_tu_sua_lai_cho_dung_efda4c'));
        return;
      }
      newQuestion = {
        id: uniqueId,
        title: spotTitle.trim() || t('grammar:tim_loi_sai_trong_cau_5bb5c1'),
        type: 'SPOT_ERROR',
        instruction: t('grammar:chi_ra_tu_bi_sai_trong_cau_sau_c8b95c'),
        tokens: spotTokens,
        correct_token_id: Number(spotWrongTokenId),
        correction: spotCorrection.trim(),
        error_type: spotErrorType.trim(),
        explanation: spotExplanation.trim()
      };
    } else if (selectedQuestionType === 'FILL_BLANK_TEXT') {
      if (!textTemplate.trim()) {
        showToast(t('grammar:vui_long_nhap_mau_cau_co_chua_1_6db5f9'));
        return;
      }
      if (!textBlank1Answers.trim()) {
        showToast(t('grammar:vui_long_nhap_dap_an_dung_cho_o_1_c908b1'));
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
        title: textTitle.trim() || t('grammar:ien_tu_vao_cho_trong_ff5395'),
        type: 'FILL_BLANK_TEXT',
        instruction: t('grammar:ien_tu_dung_vao_cho_trong_49db4b'),
        template: textTemplate.trim(),
        blanks,
        validation: { strict_case: false, ignore_extra_whitespace: true },
        explanation: textExplanation.trim()
      };
    } else if (selectedQuestionType === 'FILL_BLANK_DROPDOWN') {
      if (!dropTemplate.trim()) {
        showToast(t('grammar:vui_long_nhap_mau_cau_co_chua_1_6db5f9'));
        return;
      }
      if (!dropOptions.trim()) {
        showToast(t('grammar:vui_long_nhap_cac_lua_chon_dap_an_6fe93e'));
        return;
      }
      if (!dropCorrect.trim()) {
        showToast(t('grammar:vui_long_nhap_dap_an_dung_b88436'));
        return;
      }
      const opts = dropOptions.split(',').map(s => s.trim()).filter(Boolean);
      newQuestion = {
        id: uniqueId,
        title: dropTitle.trim() || t('grammar:chon_tu_thich_hop_f0840c'),
        type: 'FILL_BLANK_DROPDOWN',
        instruction: t('grammar:chon_tu_dung_tu_danh_sach_tha_xuong_7eaf91'),
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
        showToast(t('grammar:vui_long_nhap_duong_dan_hinh_anh_1b7f55'));
        return;
      }
      if (!imgQuestion.trim()) {
        showToast(t('grammar:vui_long_nhap_noi_dung_cau_hoi_a8ecf7'));
        return;
      }
      if (!imgOptions.trim()) {
        showToast(t('grammar:vui_long_nhap_cac_lua_chon_dap_an_6fe93e'));
        return;
      }
      if (!imgCorrect.trim()) {
        showToast(t('grammar:vui_long_nhap_dap_an_dung_b88436'));
        return;
      }
      const opts = imgOptions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      newQuestion = {
        id: uniqueId,
        title: imgTitle.trim() || t('grammar:quan_sat_hinh_anh_va_tra_loi_bc25e1'),
        type: 'IMAGE_QUESTION',
        instruction: t('grammar:quan_sat_buc_anh_ben_duoi_va_chon_cau_tr_5bcb77'),
        image_url: imgUrl.trim(),
        image_caption: imgCaption.trim(),
        question_text: imgQuestion.trim(),
        options: opts,
        correct_answer: imgCorrect.trim(),
        explanation: imgExplanation.trim()
      };
    } else if (selectedQuestionType === 'PASSAGE_CLOZE') {
      if (!clozePassageText.trim()) {
        showToast(t('grammar:vui_long_nhap_doan_van_co_chua_1_775330'));
        return;
      }
      if (!clozeBlank1Opts.trim() || !clozeBlank1Correct.trim()) {
        showToast(t('grammar:vui_long_nhap_cac_lua_chon_va_dap_an_dun_4f3d6c'));
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
        title: clozeTitle.trim() || t('grammar:oan_van_dien_tu_3e291f'),
        type: 'PASSAGE_CLOZE',
        instruction: t('grammar:oc_doan_van_sau_va_chon_tu_thich_hop_cho_4d2326'),
        passage_title: clozePassageTitle.trim(),
        passage_text: clozePassageText.trim(),
        blanks,
        explanation: clozeExplanation.trim()
      };
    } else if (selectedQuestionType === 'READING_COMPREHENSION') {
      if (!readPassageText.trim()) {
        showToast(t('grammar:vui_long_nhap_noi_dung_doan_van_bai_doc_e31a8e'));
        return;
      }
      if (!readSub1Q.trim() || !readSub1Opts.trim() || !readSub1Correct.trim()) {
        showToast(t('grammar:vui_long_hoan_thanh_cau_hoi_con_so_1_8eba12'));
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
        title: readTitle.trim() || t('grammar:oc_hieu_van_ban_09846e'),
        type: 'READING_COMPREHENSION',
        instruction: t('grammar:oc_ky_doan_van_sau_va_tra_loi_cac_cau_ho_e88b29'),
        passage_title: readPassageTitle.trim(),
        passage_text: readPassageText.trim(),
        sub_questions: subQ,
        explanation: readExplanation.trim()
      };
    } else if (selectedQuestionType === 'AUDIO_LISTENING') {
      if (!audioQuestion.trim()) {
        showToast(t('grammar:vui_long_nhap_noi_dung_cau_hoi_nghe_1e4a38'));
        return;
      }
      if (!audioOptions.trim() || !audioCorrect.trim()) {
        showToast(t('grammar:vui_long_nhap_cac_lua_chon_dap_an_va_dap_3873fe'));
        return;
      }
      newQuestion = {
        id: uniqueId,
        title: audioTitle.trim() || t('grammar:nghe_audio_va_tra_loi_cau_hoi_d17979'),
        type: 'AUDIO_LISTENING',
        instruction: t('grammar:nghe_doan_ghi_am_sau_va_chon_cau_tra_loi_26a356'),
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

    showToast(t('common:feedback_11', { v0: targetGroup.title }));
  };

  // Chuẩn bị object câu hỏi mẫu cho khung Live Preview
  const getPreviewQuestionObject = () => {
    if (selectedQuestionType === 'SPOT_ERROR') {
      const tokensToUse = spotTokens.length > 0
        ? spotTokens
        : [{ id: 1, text: t('grammar:nhap_1e9e6c') }, { id: 2, text: t('grammar:cau_9abba2') }, { id: 3, text: t('grammar:tieng_cdab70') }, { id: 4, text: "Anh..." }];
      return {
        id: "preview_spot",
        title: spotTitle || t('grammar:xem_truoc_tim_loi_sai_65b6be'),
        type: 'SPOT_ERROR',
        instruction: t('grammar:chi_ra_tu_bi_sai_trong_cau_sau_c8b95c'),
        tokens: tokensToUse,
        correct_token_id: Number(spotWrongTokenId) || 1,
        correction: spotCorrection || t('grammar:tu_sua_lai_dung_283d54'),
        error_type: spotErrorType || "",
        explanation: spotExplanation || t('grammar:giai_thich_dap_an_se_hien_thi_tai_day_sa_6437e0')
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
        title: textTitle || t('grammar:xem_truoc_ien_tu_vao_cho_trong_9d0090'),
        type: 'FILL_BLANK_TEXT',
        instruction: t('grammar:ien_tu_dung_vao_cho_trong_49db4b'),
        template: textTemplate || t('grammar:mau_cau_xem_truoc_co_chua_1_de_lam_bai_807ea4'),
        blanks,
        validation: { strict_case: false, ignore_extra_whitespace: true },
        explanation: textExplanation || t('grammar:giai_thich_dap_an_se_hien_thi_tai_day_sa_6437e0')
      };
    } else if (selectedQuestionType === 'FILL_BLANK_DROPDOWN') {
      const opts = dropOptions ? dropOptions.split(',').map(s => s.trim()).filter(Boolean) : [t('grammar:lua_chon_1_4a1bd0'), t('grammar:lua_chon_2_6ffb0c')];
      return {
        id: "preview_drop",
        title: dropTitle || t('grammar:xem_truoc_chon_tu_danh_sach_a732c4'),
        type: 'FILL_BLANK_DROPDOWN',
        instruction: t('grammar:chon_tu_dung_tu_danh_sach_tha_xuong_7eaf91'),
        template: dropTemplate || t('grammar:mau_cau_xem_truoc_co_chua_1_de_lam_bai_807ea4'),
        blanks: {
          "1": {
            options: opts,
            correct_answer: dropCorrect.trim() || opts[0] || ""
          }
        },
        explanation: dropExplanation || t('grammar:giai_thich_dap_an_se_hien_thi_tai_day_sa_6437e0')
      };
    } else if (selectedQuestionType === 'FILL_BLANK_CARDS') {
      const opts = cardOptions ? cardOptions.split(',').map(s => s.trim()).filter(Boolean) : [t('grammar:ap_an_a_fdd547'), t('grammar:ap_an_b_6de054')];
      return {
        id: "preview_card",
        title: cardTitle || t('grammar:xem_truoc_chon_the_dap_an_602bce'),
        type: 'FILL_BLANK_CARDS',
        instruction: t('grammar:bam_chon_the_dap_an_dung_de_hoan_thanh_c_da6e20'),
        template: cardTemplate || t('grammar:mau_cau_xem_truoc_co_chua_1_de_lam_bai_807ea4'),
        blanks: {
          "1": {
            options: opts,
            correct_answer: cardCorrect.trim() || opts[0] || ""
          }
        },
        explanation: cardExplanation || t('grammar:giai_thich_dap_an_se_hien_thi_tai_day_sa_6437e0')
      };
    } else if (selectedQuestionType === 'IMAGE_QUESTION') {
      const opts = imgOptions ? imgOptions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [t('grammar:lua_chon_a_3147a4'), t('grammar:lua_chon_b_ef9f7b'), t('grammar:lua_chon_c_452e01'), t('grammar:lua_chon_d_92c1ec')];
      return {
        id: "preview_img",
        title: imgTitle || t('grammar:xem_truoc_cau_hoi_hinh_anh_7f4d8d'),
        type: 'IMAGE_QUESTION',
        instruction: t('grammar:quan_sat_buc_anh_ben_duoi_va_chon_cau_tr_5bcb77'),
        image_url: imgUrl || "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
        image_caption: imgCaption || t('grammar:anh_minh_hoa_xem_truoc_900e81'),
        question_text: imgQuestion || "What is happening in the picture?",
        options: opts,
        correct_answer: imgCorrect.trim() || opts[0] || "",
        explanation: imgExplanation || t('grammar:giai_thich_dap_an_se_hien_thi_tai_day_sa_6437e0')
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
        title: clozeTitle || t('grammar:xem_truoc_oan_van_dien_tu_9e88f4'),
        type: 'PASSAGE_CLOZE',
        instruction: t('grammar:oc_doan_van_sau_va_chon_tu_thich_hop_cho_4d2326'),
        passage_title: clozePassageTitle || t('grammar:bai_doc_mau_xem_truoc_7badbe'),
        passage_text: clozePassageText || "Human activities have damaged natural {1} for decades. Communities must focus on renewable {2}.",
        blanks,
        explanation: clozeExplanation || t('grammar:giai_thich_dap_an_se_hien_thi_tai_day_sa_6437e0')
      };
    } else if (selectedQuestionType === 'READING_COMPREHENSION') {
      const subQ = [];
      const opts1 = readSub1Opts ? readSub1Opts.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [t('grammar:lua_chon_a_3147a4'), t('grammar:lua_chon_b_ef9f7b')];
      subQ.push({
        id: "sub_1",
        question: readSub1Q || t('grammar:cau_hoi_doc_hieu_so_1_4048c0'),
        options: opts1,
        correct_answer: readSub1Correct.trim() || opts1[0] || ""
      });
      if (readSub2Q.trim()) {
        const opts2 = readSub2Opts ? readSub2Opts.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [t('grammar:lua_chon_a_3147a4'), t('grammar:lua_chon_b_ef9f7b')];
        subQ.push({
          id: "sub_2",
          question: readSub2Q,
          options: opts2,
          correct_answer: readSub2Correct.trim() || opts2[0] || ""
        });
      }
      return {
        id: "preview_reading",
        title: readTitle || t('grammar:xem_truoc_oc_hieu_van_ban_5955ec'),
        type: 'READING_COMPREHENSION',
        instruction: t('grammar:oc_ky_doan_van_sau_va_tra_loi_cac_cau_ho_e88b29'),
        passage_title: readPassageTitle || t('grammar:tieu_de_bai_doc_18094d'),
        passage_text: readPassageText || t('grammar:oan_van_doc_hieu_mau_xem_truoc_hoc_vien__42b684'),
        sub_questions: subQ,
        explanation: readExplanation || t('grammar:giai_thich_dap_an_se_hien_thi_tai_day_sa_6437e0')
      };
    } else if (selectedQuestionType === 'AUDIO_LISTENING') {
      const audioOpts = audioOptions ? audioOptions.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [t('grammar:ap_an_a_fdd547'), t('grammar:ap_an_b_6de054'), t('grammar:ap_an_c_933912')];
      return {
        id: "preview_audio",
        title: audioTitle || t('grammar:xem_truoc_nghe_audio_163bf1'),
        type: 'AUDIO_LISTENING',
        instruction: t('grammar:nghe_doan_ghi_am_sau_va_chon_cau_tra_loi_26a356'),
        audio_url: audioUrl.trim(),
        transcript: audioTranscript || "Attention passengers. Flight VN123 is now boarding at Gate 14.",
        question_text: audioQuestion || t('grammar:cau_hoi_nghe_xem_truoc_1d0fba'),
        options: audioOpts,
        correct_answer: audioCorrect.trim() || audioOpts[0] || "",
        explanation: audioExplanation || t('grammar:giai_thich_dap_an_se_hien_thi_tai_day_sa_6437e0')
      };
    } else {
      return {
        id: "preview_unknown",
        title: t('grammar:xem_truoc_447604'),
        type: selectedQuestionType,
        instruction: t('grammar:xem_truoc_cau_hoi_104b76')
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
          <h1 className="grammar-lesson-badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-main)', borderColor: 'rgba(255, 255, 255, 0.15)' }}> {t('grammar:soan_bai_tap_cong_dong_fa0071')} </h1>
          <span className="grammar-lesson-subtitle"> {t('grammar:nguoi_tao_dc59e4')} <strong style={{ color: 'var(--text-main)' }}>{user?.name || user?.email || t('grammar:thanh_vien_cong_dong_2691c4')}</strong>
          </span>
        </div>

        {/* CÁC NÚT ĐIỀU HƯỚNG NHANH */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/grammar')}
            title={t('grammar:quay_lai_bang_tin_bai_tap_cong_dong_de_l_8f2fc6')}
            style={{ fontWeight: 600 }}
          > {t('grammar:bang_tin_bai_tap_c7e45a')} </button>
          <button className="btn btn-glass btn-sm" onClick={() => navigate('/')}> {t('grammar:trang_chu_738a4c')} </button>
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
                <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)' , color: '#000', fontWeight: 800, alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  1
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary)'  }}> {t('grammar:buoc_1_chon_bai_tap_vi_du_test_1_test_2_c2666b')} </h3>
              </div>
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={() => setIsCreatingNewGroup(!isCreatingNewGroup)}
                style={{ fontSize: '13px', color: isCreatingNewGroup ? '#f43f5e' : 'var(--primary)' }}
              >
                {isCreatingNewGroup ? t('grammar:huy_tao_moi_dcdb99') : t('grammar:tao_bai_tap_moi_48304b')}
              </button>
            </div>

            {/* Form tạo bài tập mới */}
            {isCreatingNewGroup ? (
              <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '12px', border: '1px dashed #38bdf8', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--primary)'  }}> {t('grammar:thong_tin_bai_tap_moi_ecd373')} </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}> {t('grammar:ten_bai_tap_vi_du_test_4_aff927')} </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('grammar:vi_du_test_4_c1cf5b')}
                      value={newGroupTitle}
                      onChange={(e) => setNewGroupTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}> {t('grammar:mo_ta_ngan_khong_bat_buoc_255d5e')} </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('grammar:mo_ta_bai_tap_1de124')}
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                    />
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleCreateNewGroup} style={{ height: '42px' }}> {t('grammar:luu_chon_bai_nay_aa45b6')} </button>
                </div>
              </div>
            ) : (
              /* Dropdown chọn bài tập có sẵn */
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}> {t('grammar:chon_bai_tap_ban_muon_them_cau_hoi_vao_19a299')} </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '480px', minWidth: 0 }}>
                    <select
                      className="form-input"
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        width: '100%',
                        minWidth: 0,
                        cursor: 'pointer',
                        padding: '10px 36px 10px 14px'
                      }}
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.title} ({g.questions?.length || 0} {t('grammar:cau_hoi_887c88')} </option>
                      ))}
                    </select>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> {t('grammar:ang_chon_c6648b')} <strong style={{ color: 'var(--primary)' }}>{selectedGroupObj?.title}</strong>
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
              <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)' , color: '#000', fontWeight: 800, alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                2
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary)'  }}> {t('grammar:buoc_2_chon_dang_cau_hoi_9d7071')} </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> {t('grammar:chon_dang_bai_tap_ban_muon_tao_cho_hoc_v_0501e8')} </span>
              </div>
            </div>

            {/* DROPDOWN CHỌN DẠNG BÀI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '480px', minWidth: 0 }}>
                <select
                  className="form-input"
                  value={selectedQuestionType}
                  onChange={(e) => setSelectedQuestionType(e.target.value)}
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    width: '100%',
                    minWidth: 0,
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
              <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--success)' , color: '#000', fontWeight: 800, alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                3
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--success)'  }}> {t('grammar:buoc_3_nhap_noi_dung_cau_hoi_667a71')} </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> {t('grammar:ang_soan_639df1')} <strong>{getQuestionTypeInfo(selectedQuestionType).label}</strong> {t('grammar:cho_bai_726d64')} <strong>{selectedGroupObj?.title}</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveQuestion}>
              {/* --- FORM 1: TÌM LỖI SAI --- */}
              {selectedQuestionType === 'SPOT_ERROR' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label"> {t('grammar:tieu_de_cau_hoi_4d0763')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={spotTitle}
                      onChange={(e) => setSpotTitle(e.target.value)}
                      placeholder={t('grammar:vi_du_cau_1_tim_loi_sai_trong_cau_13debd')}
                    />
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:cau_tieng_anh_can_kiem_tra_fe7502')} </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={spotRawSentence}
                        onChange={(e) => setSpotRawSentence(e.target.value)}
                        placeholder={t('grammar:nhap_cau_tieng_anh_vao_day_roi_bam_nut_b_59aa1a')}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAutoTokenize}
                        style={{ whiteSpace: 'nowrap' }}
                      > {t('grammar:tach_tu_610809')} </button>
                    </div>
                  </div>

                  {spotTokens.length > 0 && (
                    <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px' }}>
                      <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}> {t('grammar:bam_chon_tu_bi_sai_trong_cau_aa7a56')} </label>
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
                              {token.text} {isWrong && t('grammar:loi_28eed9')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label"> {t('grammar:tu_sua_lai_cho_dung_d0a476')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={spotCorrection}
                        onChange={(e) => setSpotCorrection(e.target.value)}
                        placeholder={t('grammar:vi_du_went_6ec3eb')}
                      />
                    </div>
                    <div>
                      <label className="form-label"> {t('grammar:dang_ngu_phap_khong_bat_buoc_1488af')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={spotErrorType}
                        onChange={(e) => setSpotErrorType(e.target.value)}
                        placeholder={t('grammar:vi_du_thi_qua_khu_don_65c41e')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:giai_thich_dap_an_se_hien_thi_sau_khi_ho_54afc4')} </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={spotExplanation}
                      onChange={(e) => setSpotExplanation(e.target.value)}
                      placeholder={t('grammar:giai_thich_vi_sao_tu_do_sai_va_quy_tac_d_889448')}
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 2: ĐIỀN TỪ VÀO CHỖ TRỐNG --- */}
              {selectedQuestionType === 'FILL_BLANK_TEXT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label"> {t('grammar:tieu_de_cau_hoi_4d0763')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      placeholder={t('grammar:vi_du_cau_2_chia_dong_tu_9976fa')}
                    />
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:mau_cau_co_cho_trong_dung_f93d0a')} {'{1}'}, {'{2}'} {t('grammar:de_danh_dau_vi_tri_can_dien_887223')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={textTemplate}
                      onChange={(e) => setTextTemplate(e.target.value)}
                      placeholder={t('grammar:vi_du_if_i_1_enough_money_i_2_a_new_hous_5369e9')}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--primary)'  }}> {t('grammar:o_trong_7aa568')} {'{1}'}:</h4>
                      <label className="form-label"> {t('grammar:ap_an_dung_neu_co_nhieu_dap_an_thi_ngan__c652fd')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={textBlank1Answers}
                        onChange={(e) => setTextBlank1Answers(e.target.value)}
                        placeholder={t('grammar:vi_du_had_192492')}
                      />
                    </div>

                    <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--primary)'  }}> {t('grammar:o_trong_7aa568')} {'{2}'} {t('grammar:neu_co_c0b3d0')} </h4>
                      <label className="form-label"> {t('grammar:ap_an_dung_43609c')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={textBlank2Answers}
                        onChange={(e) => setTextBlank2Answers(e.target.value)}
                        placeholder={t('grammar:vi_du_would_buy_d_buy_0f84bb')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:giai_thich_dap_an_se_hien_thi_sau_khi_ho_54afc4')} </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={textExplanation}
                      onChange={(e) => setTextExplanation(e.target.value)}
                      placeholder={t('grammar:giai_thich_ngu_phap_2449fe')}
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 3: CHỌN TỪ TRONG DANH SÁCH THẢ XUỐNG --- */}
              {selectedQuestionType === 'FILL_BLANK_DROPDOWN' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label"> {t('grammar:tieu_de_cau_hoi_4d0763')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={dropTitle}
                      onChange={(e) => setDropTitle(e.target.value)}
                      placeholder={t('grammar:vi_du_cau_3_chon_tu_thich_hop_16554c')}
                    />
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:mau_cau_co_cho_trong_dung_f93d0a')} {'{1}'} {t('grammar:de_danh_dau_vi_tri_27dbbb')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={dropTemplate}
                      onChange={(e) => setDropTemplate(e.target.value)}
                      placeholder={t('grammar:vi_du_they_have_lived_in_vietnam_1_3_yea_444c5c')}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label"> {t('grammar:cac_lua_chon_trong_menu_tha_xuong_ngan_c_bc8f71')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={dropOptions}
                        onChange={(e) => setDropOptions(e.target.value)}
                        placeholder={t('grammar:vi_du_for_since_from_during_e77254')}
                      />
                    </div>
                    <div>
                      <label className="form-label"> {t('grammar:ap_an_dung_43609c')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={dropCorrect}
                        onChange={(e) => setDropCorrect(e.target.value)}
                        placeholder={t('grammar:vi_du_for_73065a')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:giai_thich_dap_an_se_hien_thi_sau_khi_ho_54afc4')} </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={dropExplanation}
                      onChange={(e) => setDropExplanation(e.target.value)}
                      placeholder={t('grammar:giai_thich_ly_do_chon_dap_an_nay_f40008')}
                    />
                  </div>
                </div>
              )}



              {/* --- FORM 5: CÂU HỎI HÌNH ẢNH --- */}
              {selectedQuestionType === 'IMAGE_QUESTION' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label"> {t('grammar:tieu_de_cau_hoi_4d0763')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={imgTitle}
                      onChange={(e) => setImgTitle(e.target.value)}
                      placeholder={t('grammar:vi_du_cau_1_quan_sat_hinh_anh_lop_hoc_c51eaf')}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label"> {t('grammar:uong_dan_hinh_anh_url_7b100b')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={imgUrl}
                        onChange={(e) => setImgUrl(e.target.value)}
                        placeholder={t('grammar:https_images_unsplash_com_hoac_link_anh_767507')}
                      />
                    </div>
                    <div>
                      <label className="form-label"> {t('grammar:chu_thich_anh_tuy_chon_3529e6')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={imgCaption}
                        onChange={(e) => setImgCaption(e.target.value)}
                        placeholder={t('grammar:vi_du_hoat_dong_trong_lop_hoc_4bce36')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:noi_dung_cau_hoi_lien_quan_den_anh_f6fee7')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={imgQuestion}
                      onChange={(e) => setImgQuestion(e.target.value)}
                      placeholder={t('grammar:vi_du_what_are_the_students_and_teacher__2fafe1')}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label"> {t('grammar:cac_lua_chon_dap_an_ngan_cach_bang_dau_p_684007')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={imgOptions}
                        onChange={(e) => setImgOptions(e.target.value)}
                        placeholder={t('grammar:vi_du_the_teacher_is_teaching_the_studen_af0822')}
                      />
                    </div>
                    <div>
                      <label className="form-label"> {t('grammar:ap_an_dung_43609c')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={imgCorrect}
                        onChange={(e) => setImgCorrect(e.target.value)}
                        placeholder={t('grammar:nhap_chinh_xac_dap_an_dung_16a7c8')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:giai_thich_dap_an_se_hien_thi_sau_khi_ho_54afc4')} </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={imgExplanation}
                      onChange={(e) => setImgExplanation(e.target.value)}
                      placeholder={t('grammar:giai_thich_chi_tiet_cau_tra_loi_d917b0')}
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 6: ĐOẠN VĂN ĐIỀN TỪ --- */}
              {selectedQuestionType === 'PASSAGE_CLOZE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label"> {t('grammar:tieu_de_cau_hoi_4d0763')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={clozeTitle}
                        onChange={(e) => setClozeTitle(e.target.value)}
                        placeholder={t('grammar:vi_du_cau_2_oan_van_dien_tu_moi_truong_f0250d')}
                      />
                    </div>
                    <div>
                      <label className="form-label"> {t('grammar:tieu_de_doan_van_tuy_chon_0ee179')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={clozePassageTitle}
                        onChange={(e) => setClozePassageTitle(e.target.value)}
                        placeholder={t('grammar:vi_du_protecting_our_environment_a8d272')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:noi_dung_doan_van_dung_f48c87')} {'{1}'}, {'{2}'}, {'{3}'} {t('grammar:de_danh_dau_cho_trong_755618')} </label>
                    <textarea
                      className="form-input"
                      rows={4}
                      value={clozePassageText}
                      onChange={(e) => setClozePassageText(e.target.value)}
                      placeholder={t('grammar:nhap_doan_van_vi_du_pollution_is_a_chall_0cf3cd')}
                    />
                  </div>

                  {/* Chỗ trống 1 */}
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}> {t('grammar:cho_trong_1de8a9')} {'{1}'} {t('grammar:bat_buoc_ff763c')} </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label"> {t('grammar:cac_lua_chon_ngan_cach_dau_phay_888d81')} </label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank1Opts}
                          onChange={(e) => setClozeBlank1Opts(e.target.value)}
                          placeholder={t('grammar:vi_du_habitats_buildings_factories_roads_34b211')}
                        />
                      </div>
                      <div>
                        <label className="form-label"> {t('grammar:ap_an_dung_2126a1')} {'{1}'}:</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank1Correct}
                          onChange={(e) => setClozeBlank1Correct(e.target.value)}
                          placeholder={t('grammar:vi_du_habitats_133d90')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chỗ trống 2 */}
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}> {t('grammar:cho_trong_1de8a9')} {'{2}'} {t('grammar:neu_co_acb326')} </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label"> {t('grammar:cac_lua_chon_ngan_cach_dau_phay_888d81')} </label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank2Opts}
                          onChange={(e) => setClozeBlank2Opts(e.target.value)}
                          placeholder={t('grammar:vi_du_recycling_burning_throwing_buying_82cc9e')}
                        />
                      </div>
                      <div>
                        <label className="form-label"> {t('grammar:ap_an_dung_2126a1')} {'{2}'}:</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank2Correct}
                          onChange={(e) => setClozeBlank2Correct(e.target.value)}
                          placeholder={t('grammar:vi_du_recycling_8b1656')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chỗ trống 3 */}
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}> {t('grammar:cho_trong_1de8a9')} {'{3}'} {t('grammar:neu_co_acb326')} </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label"> {t('grammar:cac_lua_chon_ngan_cach_dau_phay_888d81')} </label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank3Opts}
                          onChange={(e) => setClozeBlank3Opts(e.target.value)}
                          placeholder={t('grammar:vi_du_energy_vehicles_clothes_food_08d7a8')}
                        />
                      </div>
                      <div>
                        <label className="form-label"> {t('grammar:ap_an_dung_2126a1')} {'{3}'}:</label>
                        <input
                          type="text"
                          className="form-input"
                          value={clozeBlank3Correct}
                          onChange={(e) => setClozeBlank3Correct(e.target.value)}
                          placeholder={t('grammar:vi_du_energy_ab2130')}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:giai_thich_dap_an_se_hien_thi_sau_khi_ho_54afc4')} </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={clozeExplanation}
                      onChange={(e) => setClozeExplanation(e.target.value)}
                      placeholder={t('grammar:giai_thich_ly_do_chon_tung_dap_an_934e96')}
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 7: ĐỌC HIỂU VĂN BẢN --- */}
              {selectedQuestionType === 'READING_COMPREHENSION' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label"> {t('grammar:tieu_de_cau_hoi_4d0763')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={readTitle}
                        onChange={(e) => setReadTitle(e.target.value)}
                        placeholder={t('grammar:vi_du_cau_3_oc_hieu_tri_tue_nhan_tao_e07e29')}
                      />
                    </div>
                    <div>
                      <label className="form-label"> {t('grammar:tieu_de_bai_doc_9bd638')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={readPassageTitle}
                        onChange={(e) => setReadPassageTitle(e.target.value)}
                        placeholder={t('grammar:vi_du_artificial_intelligence_in_modern__a69743')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:noi_dung_bai_doc_oan_van_doc_hieu_02f84e')} </label>
                    <textarea
                      className="form-input"
                      rows={6}
                      value={readPassageText}
                      onChange={(e) => setReadPassageText(e.target.value)}
                      placeholder={t('grammar:nhap_toan_bo_noi_dung_bai_doc_dfc392')}
                    />
                  </div>

                  {/* Câu hỏi con 1 */}
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)' }}> {t('grammar:cau_hoi_con_1_bat_buoc_0cec5e')} </div>
                    <div>
                      <label className="form-label"> {t('grammar:noi_dung_cau_hoi_1_adae3d')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={readSub1Q}
                        onChange={(e) => setReadSub1Q(e.target.value)}
                        placeholder={t('grammar:vi_du_how_does_ai_benefit_students_700798')}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label"> {t('grammar:cac_lua_chon_ngan_cach_bang_dau_phay_2d4419')} </label>
                        <input
                          type="text"
                          className="form-input"
                          value={readSub1Opts}
                          onChange={(e) => setReadSub1Opts(e.target.value)}
                          placeholder={t('grammar:vi_du_learn_at_their_own_pace_replace_te_3e1765')}
                        />
                      </div>
                      <div>
                        <label className="form-label"> {t('grammar:ap_an_dung_cau_1_5026ce')} </label>
                        <input
                          type="text"
                          className="form-input"
                          value={readSub1Correct}
                          onChange={(e) => setReadSub1Correct(e.target.value)}
                          placeholder={t('grammar:nhap_chinh_xac_1_lua_chon_9078c6')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Câu hỏi con 2 */}
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary)' }}> {t('grammar:cau_hoi_con_2_neu_co_678895')} </div>
                    <div>
                      <label className="form-label"> {t('grammar:noi_dung_cau_hoi_2_6901df')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={readSub2Q}
                        onChange={(e) => setReadSub2Q(e.target.value)}
                        placeholder={t('grammar:vi_du_what_qualities_of_teachers_cannot__68e34b')}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label"> {t('grammar:cac_lua_chon_ngan_cach_bang_dau_phay_2d4419')} </label>
                        <input
                          type="text"
                          className="form-input"
                          value={readSub2Opts}
                          onChange={(e) => setReadSub2Opts(e.target.value)}
                          placeholder={t('grammar:vi_du_emotional_support_storing_scores_p_cc92d5')}
                        />
                      </div>
                      <div>
                        <label className="form-label"> {t('grammar:ap_an_dung_cau_2_859359')} </label>
                        <input
                          type="text"
                          className="form-input"
                          value={readSub2Correct}
                          onChange={(e) => setReadSub2Correct(e.target.value)}
                          placeholder={t('grammar:nhap_chinh_xac_1_lua_chon_9078c6')}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:giai_thich_dap_an_se_hien_thi_sau_khi_ho_54afc4')} </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={readExplanation}
                      onChange={(e) => setReadExplanation(e.target.value)}
                      placeholder={t('grammar:giai_thich_chi_tiet_hoac_dan_chung_tu_ba_d1056f')}
                    />
                  </div>
                </div>
              )}

              {/* --- FORM 8: NGHE AUDIO TRẢ LỜI CÂU HỎI --- */}
              {selectedQuestionType === 'AUDIO_LISTENING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label"> {t('grammar:tieu_de_cau_hoi_4d0763')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder={t('grammar:vi_du_cau_4_nghe_thong_bao_tai_san_bay_6ce6eb')}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label"> {t('grammar:uong_dan_file_audio_url_de_trong_neu_dun_7032c2')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder={t('grammar:https_hoac_de_trong_de_he_thong_tu_phat__9b74c5')}
                      />
                    </div>
                    <div>
                      <label className="form-label"> {t('grammar:ap_an_dung_43609c')} </label>
                      <input
                        type="text"
                        className="form-input"
                        value={audioCorrect}
                        onChange={(e) => setAudioCorrect(e.target.value)}
                        placeholder={t('grammar:nhap_chinh_xac_dap_an_dung_16a7c8')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:noi_dung_loi_thoai_transcript_dung_phat__e9f510')} </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={audioTranscript}
                      onChange={(e) => setAudioTranscript(e.target.value)}
                      placeholder={t('grammar:vi_du_attention_all_passengers_on_flight_14f831')}
                    />
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:noi_dung_cau_hoi_nghe_e596af')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={audioQuestion}
                      onChange={(e) => setAudioQuestion(e.target.value)}
                      placeholder={t('grammar:vi_du_which_gate_is_flight_vn123_boardin_dc558c')}
                    />
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:cac_lua_chon_dap_an_ngan_cach_bang_dau_p_684007')} </label>
                    <input
                      type="text"
                      className="form-input"
                      value={audioOptions}
                      onChange={(e) => setAudioOptions(e.target.value)}
                      placeholder={t('grammar:vi_du_gate_number_14_gate_number_24_gate_cdbba6')}
                    />
                  </div>

                  <div>
                    <label className="form-label"> {t('grammar:giai_thich_dap_an_se_hien_thi_sau_khi_ho_54afc4')} </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={audioExplanation}
                      onChange={(e) => setAudioExplanation(e.target.value)}
                      placeholder={t('grammar:giai_thich_cau_tra_loi_nghe_duoc_trong_l_353140')}
                    />
                  </div>
                </div>
              )}

              {/* KHUNG XEM TRƯỚC TRỰC QUAN (LIVE INTERACTIVE PREVIEW) */}
              <div style={{ marginTop: '24px', padding: '20px', borderRadius: '14px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, display: 'block', marginBottom: '12px' }}> {t('grammar:xem_truoc_giao_dien_hoc_vien_live_previe_6ae892')} </span>
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
                > {t('grammar:luu_cau_hoi_vao_72ca2f')} {selectedGroupObj?.title}"
                </button>
              </div>
            </form>
          </div>
        </div>
  );
};

export default GrammarAdminCMSPage;
