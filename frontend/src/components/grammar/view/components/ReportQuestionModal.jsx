import { t } from '../../../../i18n/index.js';
// =========================================================================================
// VIEW LAYER — REPORT QUESTION MODAL (MODAL BÁO LỖI CÂU HỎI CHO TÁC GIẢ QUA GMAIL)
// =========================================================================================
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { submitQuestionReport } from '../../model/grammarQuestionsData';

const ERROR_TYPES = () => ([
  { id: 'WRONG_ANSWER', label: t('grammar:sai_dap_an_ap_an_he_thong_cham_khong_dun_86aa8f') },
  { id: 'AMBIGUOUS_PROMPT', label: t('grammar:e_bai_hoac_cau_hoi_khong_ro_rang_gay_hie_f9707c') },
  { id: 'TYPO_GRAMMAR', label: t('grammar:loi_chinh_ta_cau_chu_trong_cau_hoi_db957b') },
  { id: 'MEDIA_ERROR', label: t('grammar:loi_hien_thi_hinh_anh_hoac_phat_am_thanh_2d2c43') },
  { id: 'OTHER', label: t('grammar:loi_khac_0be977') }
]);

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
  const authorEmail = group?.author?.email || "community@studye.edu.vn";
  const authorName = group?.author?.name || t('grammar:nguoi_tao_bai_tap_632fd7');

  const reporterEmail = user?.email || "hocvien@studye.edu.vn";
  const reporterName = user?.name || user?.username || t('grammar:nguoi_hoc_74895e');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert(t('grammar:vui_long_nhap_mo_ta_chi_tiet_loi_f073ff'));
      return;
    }

    const errorLabel = ERROR_TYPES().find(t => t.id === errorType)?.label || errorType;

    const result = submitQuestionReport({
      groupId: group?.id || 'unknown_group',
      questionId: targetQuestion?.id || selectedQuestionId,
      questionTitle: targetQuestion?.title || t('grammar:cau_hoi_0b18f8'),
      errorType: errorLabel,
      description: description.trim(),
      reporterEmail,
      reporterName,
      testTitle: group?.title || t('grammar:bai_kiem_tra_f7fd60'),
      authorName,
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

  return createPortal(
    <div className="report-modal-backdrop animate-fade-in" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 'calc(var(--nav-height, 70px) + 20px) 20px 40px',
      overflowY: 'auto'
    }}>
      <div className="report-modal-box glass-panel animate-pop" style={{
        maxWidth: '560px',
        width: '100%',
        margin: '0 auto',
        maxHeight: 'none',
        overflowY: 'visible',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'var(--surface)',
        padding: '24px 28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      }}>

        {/* HEADER MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}> {t('grammar:bao_loi_cau_hoi_443e4d')} </div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)', fontWeight: 700 }}> {t('grammar:gop_y_va_bao_loi_cau_hoi_b09d9f')} </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}> {t('grammar:phan_hoi_se_duoc_gui_den_nguoi_tao_bai_t_ad5b0e')} </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '20px',
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
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#10b981' }}> {t('grammar:a_ghi_nhan_bao_loi_thanh_cong_56cb11')} </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}> {t('grammar:he_thong_da_luu_phan_anh_vao_bai_tap_cua_2debf9')} <strong>{authorName}</strong> {t('grammar:ban_co_the_mo_gmail_de_gui_thong_tin_tru_002366')} </p>

            <div style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '13px'
            }}>
              <div style={{ marginBottom: '6px' }}><strong> {t('grammar:nguoi_tao_dc59e4')} </strong> {authorName} ({authorEmail})</div>
              <div style={{ marginBottom: '6px' }}><strong> {t('grammar:bai_tap_d0a487')} </strong> {group?.title}</div>
              <div><strong> {t('grammar:noi_dung_4f69e3')} </strong> "{description}"</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenGmail}
                style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 600 }}
              > {t('grammar:mo_gmail_gui_phan_hoi_ae0853')} </button>

              <button
                type="button"
                className="btn btn-glass"
                onClick={handleOpenMailto}
                style={{ fontSize: '13px', padding: '8px' }}
              > {t('grammar:mo_ung_dung_email_589134')} </button>

              <button
                type="button"
                className="btn btn-glass"
                onClick={onClose}
                style={{ marginTop: '4px', fontSize: '13px' }}
              > {t('grammar:ong_d2b73a')} </button>
            </div>
          </div>
        ) : (
          /* FORM NHẬP THÔNG TIN BÁO LỖI */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* THÔNG TIN NGƯỜI TẠO BÀI TẬP */}
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '13px'
            }}>
              <div style={{ color: 'var(--text-main)', fontWeight: 600 }}> {t('grammar:nguoi_tao_dc59e4')} {authorName}</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}> {t('grammar:email_4c4e6b')} {authorEmail}</div>
            </div>

            {/* CHỌN CÂU HỎI BỊ LỖI */}
            {allQuestions.length > 1 && (
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}> {t('grammar:cau_hoi_phat_hien_loi_137fae')} </label>
                <select
                  className="form-input"
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                >
                  {allQuestions.map((q, idx) => (
                    <option key={q.id || idx} value={q.id || String(idx)}> {t('grammar:cau_c99b5e')} {idx + 1}: {q.title || q.instruction || t('common:feedback_2', { v0: idx + 1 })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CHỌN DẠNG LỖI */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}> {t('grammar:phan_loai_loi_gap_phai_cc4810')} </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ERROR_TYPES().map(t => (
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
              <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}> {t('grammar:mo_ta_chi_tiet_loi_goi_y_sua_dung_5d7dfb')} </label>
              <textarea
                className="form-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('grammar:vi_du_o_cau_nay_dap_an_dung_phai_la_went_ee7ab6')}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', lineHeight: '1.5' }}
                required
              />
            </div>

            {/* NÚT SUBMIT */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-glass"
                onClick={onClose}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px' }}
              > {t('grammar:huy_bo_247d4b')} </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '13px' }}
              > {t('grammar:gui_bao_loi_ec12f8')} </button>
            </div>
          </form>
        )}

      </div>
    </div>, document.body
  );
};

export default ReportQuestionModal;
