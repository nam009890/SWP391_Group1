// =========================================================================================
// VIEW LAYER — REPORT QUESTION MODAL (MODAL BÁO LỖI CÂU HỎI CHO TÁC GIẢ QUA GMAIL)
// =========================================================================================
import React, { useState } from 'react';
import { submitQuestionReport } from '../../model/grammarQuestionsData';

const ERROR_TYPES = [
  { id: 'WRONG_ANSWER', label: '❌ Sai đáp án (Đáp án hệ thống chấm không đúng)' },
  { id: 'AMBIGUOUS_PROMPT', label: '📝 Đề bài hoặc câu hỏi không rõ ràng / gây hiểu nhầm' },
  { id: 'TYPO_GRAMMAR', label: '🔤 Lỗi chính tả / lỗi gõ văn bản trong câu' },
  { id: 'MEDIA_ERROR', label: '🖼️ / 🎧 Lỗi hiển thị hình ảnh hoặc phát âm thanh' },
  { id: 'OTHER', label: '❓ Lỗi khác' }
];

const ReportQuestionModal = ({
  question,
  allQuestions = [],
  group,
  user,
  onClose,
  onSubmitSuccess
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    question?.id || allQuestions[0]?.id || (allQuestions.length > 0 ? '0' : '')
  );
  const [errorType, setErrorType] = useState('WRONG_ANSWER');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailUrls, setEmailUrls] = useState(null);

  const targetQuestion = allQuestions.find((q, idx) => (q.id || String(idx)) === selectedQuestionId) || question || allQuestions[0];
  const authorEmail = group?.author?.email || "buiquangviet032@gmail.com";
  const authorName = group?.author?.name || "Tác giả bài tập";

  const reporterEmail = user?.email || "hocvien@studye.edu.vn";
  const reporterName = user?.name || user?.username || "Học viên StudyE";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Vui lòng nhập mô tả chi tiết lỗi để tác giả dễ dàng sửa bài!");
      return;
    }

    const errorLabel = ERROR_TYPES.find(t => t.id === errorType)?.label || errorType;

    const result = submitQuestionReport({
      groupId: group?.id || 'unknown_group',
      questionId: targetQuestion?.id || selectedQuestionId,
      questionTitle: targetQuestion?.title || "Câu hỏi",
      errorType: errorLabel,
      description: description.trim(),
      reporterEmail,
      reporterName,
      testTitle: group?.title || "Bài kiểm tra ngữ pháp",
      authorEmail
    });

    setEmailUrls(result);
    setIsSubmitted(true);

    if (onSubmitSuccess) {
      onSubmitSuccess(result);
    }
  };

  const handleOpenGmail = () => {
    if (emailUrls?.gmailWebUrl) {
      window.open(emailUrls.gmailWebUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenMailto = () => {
    if (emailUrls?.mailtoUrl) {
      window.location.href = emailUrls.mailtoUrl;
    }
  };

  return (
    <div className="report-modal-backdrop animate-fade-in" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div className="report-modal-box glass-panel animate-pop" style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'var(--card-bg, #1e293b)',
        padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>

        {/* HEADER MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <span>🚩</span> BÁO LỖI BÀI TẬP
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>
              Góp ý & Báo lỗi cho tác giả
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Phản hồi của bạn sẽ được gửi trực tiếp đến Gmail của người tạo bài tập để cập nhật.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* MÀN HÌNH SAU KHI GỬI THÀNH CÔNG */}
        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎉</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#10b981' }}>
              Đã ghi nhận báo lỗi thành công!
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
              Hệ thống đã lưu phản ánh vào bài tập của tác giả <strong>{authorName}</strong>. Hãy bấm nút dưới đây để kích hoạt gửi Gmail trực tiếp cho tác giả:
            </p>

            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '24px',
              textAlign: 'left',
              fontSize: '13px'
            }}>
              <div style={{ marginBottom: '6px' }}><strong>Tác giả nhận:</strong> <span style={{ color: '#38bdf8' }}>{authorEmail}</span></div>
              <div style={{ marginBottom: '6px' }}><strong>Bài tập:</strong> {group?.title}</div>
              <div><strong>Nội dung phản ánh:</strong> "{description}"</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenGmail}
                style={{ padding: '12px 20px', fontSize: '15px', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>📧</span> Mở Gmail Gửi Ngay Cho Tác Giả
              </button>

              <button
                type="button"
                className="btn btn-glass"
                onClick={handleOpenMailto}
                style={{ fontSize: '13px', padding: '8px' }}
              >
                Hoặc mở ứng dụng Email mặc định (Mailto)
              </button>

              <button
                type="button"
                className="btn btn-glass"
                onClick={onClose}
                style={{ marginTop: '8px', fontSize: '14px' }}
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        ) : (
          /* FORM NHẬP THÔNG TIN BÁO LỖI */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* THÔNG TIN TÁC GIẢ NHẬN THÔNG BÁO */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}>
              <span style={{ fontSize: '24px' }}>👨‍🏫</span>
              <div style={{ fontSize: '13px' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>Tác giả bài tập: {authorName}</div>
                <div style={{ color: '#38bdf8' }}>Gmail nhận phản ánh: {authorEmail}</div>
              </div>
            </div>

            {/* CHỌN CÂU HỎI BỊ LỖI */}
            {allQuestions.length > 1 && (
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Câu hỏi phát hiện lỗi:
                </label>
                <select
                  className="form-input"
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                >
                  {allQuestions.map((q, idx) => (
                    <option key={q.id || idx} value={q.id || String(idx)}>
                      Câu {idx + 1}: {q.title || q.instruction || `Câu hỏi #${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CHỌN DẠNG LỖI */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Phân loại lỗi gặp phải:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ERROR_TYPES.map(t => (
                  <label
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      background: errorType === t.id ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${errorType === t.id ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
                      color: errorType === t.id ? 'var(--text-main)' : 'var(--text-muted)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="errorTypeRadio"
                      value={t.id}
                      checked={errorType === t.id}
                      onChange={() => setErrorType(t.id)}
                      style={{ accentColor: '#ef4444' }}
                    />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* MÔ TẢ CHI TIẾT */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Mô tả chi tiết lỗi & Gợi ý sửa đúng:
              </label>
              <textarea
                className="form-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Ở câu này đáp án đúng phải là 'went' chứ không phải 'go' vì câu có trạng từ thời gian 'yesterday'..."
                style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', lineHeight: '1.5' }}
                required
              />
            </div>

            {/* NGƯỜI BÁO LỖI */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Người báo lỗi: <strong>{reporterName}</strong></span>
              <span>Email: <strong>{reporterEmail}</strong></span>
            </div>

            {/* NÚT SUBMIT */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-glass"
                onClick={onClose}
                style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, padding: '12px', borderRadius: '10px', fontWeight: 700, background: 'linear-gradient(135deg, #ef4444, #f43f5e)', borderColor: '#ef4444' }}
              >
                🚀 Gửi Báo Lỗi & Thông Báo Gmail
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ReportQuestionModal;
