import { t } from '../../../../i18n/index.js';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const PrintTestModal = ({ groups = [], currentGroupId, onClose }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(currentGroupId || groups[0]?.id || '');
  const [printMode, setPrintMode] = useState('STUDENT'); // 'STUDENT' (Không đáp án) | 'TEACHER' (Kèm đáp án & giải thích)
  const [includeExplanations, setIncludeExplanations] = useState(true);

  const activeGroup = groups.find(g => g.id === selectedGroupId) || groups[0];
  const questions = activeGroup?.questions || [];

  // Tải trực tiếp file HTML đề thi về máy
  const handleDownloadFile = () => {
    const sheetElement = document.getElementById('printable-test-sheet');
    if (!sheetElement) {
      window.print();
      return;
    }
    const title = activeGroup?.title || 'De_thi';
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: 0 auto; }
    .print-header-section { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 14px; margin-bottom: 20px; }
    .print-school-title { font-size: 13px; font-weight: bold; text-transform: uppercase; }
    .print-exam-type { font-size: 15px; font-weight: bold; margin-top: 4px; }
    .print-subject { font-size: 13px; font-style: italic; }
    .print-meta-field { font-size: 13px; margin-bottom: 4px; }
    .print-score-box { border: 2px solid #000; border-radius: 4px; text-align: center; min-width: 100px; }
    .score-box-title { background: #000; color: #fff; font-size: 11px; padding: 2px 6px; font-weight: bold; }
    .score-box-content { font-size: 16px; font-weight: bold; padding: 6px; }
    .print-test-main-title { font-size: 18px; font-weight: bold; text-align: center; margin: 16px 0; text-transform: uppercase; }
    .print-question-item { margin-bottom: 18px; page-break-inside: avoid; }
    .print-q-header { font-weight: bold; margin-bottom: 4px; }
    .print-token-text { text-decoration: underline; padding: 0 4px; }
    .print-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 6px 0; }
    .teacher-correct-choice { font-weight: bold; color: #15803d; }
    .print-teacher-inline-ans { background: #f8fafc; border-left: 3px solid #0284c7; padding: 6px 10px; margin-top: 6px; font-size: 13px; }
    @media print { @page { size: A4; margin: 15mm; } }
  </style>
</head>
<body>
  ${sheetElement.innerHTML}
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return createPortal(
    <div className="print-modal-backdrop animate-fade-in" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: 'calc(var(--nav-height, 70px) + 20px) 20px 40px',
      overflowY: 'auto'
    }}>
      <div className="print-modal-container glass-panel animate-pop" style={{
        maxWidth: '920px',
        width: '100%',
        margin: '0 auto',
        maxHeight: 'none',
        overflowY: 'visible',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'var(--surface)',
        padding: '24px 28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>

        {/* HEADER MODAL (ẨN KHI IN) */}
        <div className="print-modal-header no-print">
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)', fontWeight: 700 }}> {t('grammar:tai_xuong_e_kiem_tra_edf9f0')} </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}> {t('grammar:inh_dang_chuan_kho_giay_a4_co_the_tai_fi_8535eb')} </p>
          </div>
          <button className="btn btn-glass btn-sm" onClick={onClose} style={{ fontSize: '16px' }}>
            ✕
          </button>
        </div>

        {/* KHUNG CẤU HÌNH TÙY CHỌN TẢI XUỐNG (ẨN KHI IN) */}
        <div className="print-config-panel no-print" style={{
          padding: '14px 18px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          margin: '16px 0 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Chọn bài test */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}> {t('grammar:bai_kiem_tra_611dab')} </label>
            <select
              className="form-input"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '13px', maxWidth: '240px', borderRadius: '8px' }}
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.questions?.length || 0} {t('grammar:cau_c3c473')} </option>
              ))}
            </select>
          </div>

          {/* Chọn chế độ: Học sinh vs Giáo viên */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}> {t('grammar:che_do_157f35')} </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${printMode === 'STUDENT' ? 'btn-primary' : 'btn-glass'}`}
                onClick={() => setPrintMode('STUDENT')}
                style={{ fontSize: '12px' }}
              > {t('grammar:ban_hoc_sinh_e_thi_7a16d3')} </button>
              <button
                type="button"
                className={`btn btn-sm ${printMode === 'TEACHER' ? 'btn-primary' : 'btn-glass'}`}
                onClick={() => setPrintMode('TEACHER')}
                style={{ fontSize: '12px' }}
              > {t('grammar:ban_co_dap_an_0d945a')} </button>
            </div>
          </div>

          {/* Nút hành động */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownloadFile}
              style={{ fontWeight: 600 }}
              title={t('grammar:tai_truc_tiep_file_de_thi_ve_may_eb820d')}
            > {t('grammar:tai_file_ve_may_2e736a')} </button>
            <button
              type="button"
              className="btn btn-glass btn-sm"
              onClick={handlePrintPdf}
              style={{ fontWeight: 600 }}
              title={t('grammar:mo_hop_thoai_in_luu_thanh_pdf_a7e933')}
            > {t('grammar:in_luu_pdf_c3e2d2')} </button>
          </div>
        </div>

        {/* ================================================================================= */}
        {/* KHUNG NỘI DUNG TÀI LIỆU IN CHUẨN A4 (PRINT SHEET CONTAINER)                        */}
        {/* ================================================================================= */}
        <div className="printable-test-document" id="printable-test-sheet">

          {/* 1. HEADER CHUẨN ĐỀ THI */}
          <div className="print-header-section">
            <div className="print-header-left">
              <div className="print-school-title"> {t('grammar:he_thong_hoc_ngu_phap_tieng_anh_study_e_62deab')} </div>
              <div className="print-exam-type"> {t('grammar:bai_kiem_tra_anh_gia_nang_luc_inh_ky_37a320')} </div>
              <div className="print-subject"> {t('grammar:mon_tieng_anh_thoi_gian_45_phut_13a446')} </div>
            </div>
            <div className="print-header-right">
              <div className="print-meta-field"><strong> {t('grammar:ho_va_ten_e51e34')} </strong> ..............................................................</div>
              <div className="print-meta-field"><strong> {t('grammar:lop_khoa_hoc_39bdbf')} </strong> ................... <strong> {t('grammar:ngay_312fb1')} </strong> ....../....../2026</div>
              <div className="print-score-box">
                <div className="score-box-title"> {t('grammar:iem_so_fd2fce')} </div>
                <div className="score-box-content">
                  {printMode === 'TEACHER' ? t('grammar:ap_an_goc_b65a0a') : "/ 10"}
                </div>
              </div>
            </div>
          </div>

          <div className="print-test-title-divider">
            <h2 className="print-test-main-title">
              {activeGroup?.title?.toUpperCase() || t('grammar:bai_kiem_tra_tong_hop_db8348')}
            </h2>
            <div className="print-test-subdesc"> {t('grammar:e_thi_gom_8c9ca7')} {questions.length} {t('grammar:cau_hoi_35562e')} {printMode === 'STUDENT' ? t('grammar:hoc_sinh_lam_bai_truc_tiep_tren_giay_thi_7d904c') : t('grammar:tai_lieu_huong_dan_cham_diem_dap_an_chi__8e06c8')})
            </div>
          </div>

          {/* 2. NỘI DUNG DANH SÁCH CÂU HỎI */}
          <div className="print-questions-list">
            {questions.map((q, idx) => {
              const qNum = idx + 1;

              return (
                <div key={q.id || idx} className="print-question-item">

                  {/* Tiêu đề & Yêu cầu câu hỏi */}
                  <div className="print-question-header">
                    <span className="print-q-number"> {t('grammar:cau_c99b5e')} {qNum}:</span>
                    <span className="print-q-instruction">
                      {q.instruction || q.title}
                    </span>
                  </div>

                  {/* NỘI DUNG THEO TỪNG DẠNG */}

                  {/* 1. Dạng Tìm lỗi sai SPOT_ERROR */}
                  {q.type === 'SPOT_ERROR' && (
                    <div className="print-question-body">
                      <div className="print-spot-sentence">
                        {(q.tokens || []).map((t) => {
                          const isErrorToken = t.id === q.correct_token_id;
                          return (
                            <span key={t.id} className="print-token-item">
                              <span className={`print-token-text ${printMode === 'TEACHER' && isErrorToken ? 'teacher-target-error' : ''}`}>
                                {t.text}
                              </span>
                              <span className="print-token-sub">( {String.fromCharCode(64 + t.id)} )</span>
                            </span>
                          );
                        })}
                      </div>

                      {printMode === 'TEACHER' ? (
                        <div className="print-teacher-inline-ans">
                          ➔ <strong> {t('grammar:loi_sai_76d948')} </strong> ( {String.fromCharCode(64 + (q.correct_token_id || 1))} ) • <strong> {t('grammar:sua_thanh_b15e0f')} </strong> "{q.correction}"
                          {q.explanation && <span> — {q.explanation}</span>}
                        </div>
                      ) : (
                        <div className="print-student-answer-line"> {t('grammar:tu_sai_la_sua_lai_thanh_3ee527')} </div>
                      )}
                    </div>
                  )}

                  {/* 2. Dạng Điền từ vào chỗ trống FILL_BLANK_TEXT */}
                  {q.type === 'FILL_BLANK_TEXT' && (
                    <div className="print-question-body">
                      <div className="print-template-sentence">
                        {q.template}
                      </div>

                      {printMode === 'TEACHER' ? (
                        <div className="print-teacher-inline-ans">
                          ➔ <strong> {t('grammar:ap_an_dung_43609c')} </strong> {Object.keys(q.blanks || {}).map(k => `[${k}]: ${q.blanks[k]?.accepted_answers?.join(' / ') || ''}`).join(' | ')}
                          {q.explanation && <span> — {q.explanation}</span>}
                        </div>
                      ) : (
                        <div className="print-student-answer-line"> {t('grammar:ap_an_dien_387bef')} {Object.keys(q.blanks || {}).map(k => `[${k}] ..................................... `).join('   ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Dạng Dropdown & Thẻ từ FILL_BLANK_DROPDOWN & FILL_BLANK_CARDS */}
                  {(q.type === 'FILL_BLANK_DROPDOWN' || q.type === 'FILL_BLANK_CARDS') && (
                    <div className="print-question-body">
                      <div className="print-template-sentence">
                        {q.template}
                      </div>
                      <div className="print-options-grid">
                        {(q.blanks?.["1"]?.options || []).map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = opt.trim().toLowerCase() === (q.blanks?.["1"]?.correct_answer || '').trim().toLowerCase();
                          return (
                            <div key={oIdx} className={`print-option-row ${printMode === 'TEACHER' && isCorrect ? 'teacher-correct-choice' : ''}`}>
                              <strong>({letter})</strong> {opt} {printMode === 'TEACHER' && isCorrect && t('grammar:ung_d4a28c')}
                            </div>
                          );
                        })}
                      </div>

                      {printMode === 'TEACHER' && q.explanation && (
                        <div className="print-teacher-inline-ans">
                          ➔ <strong> {t('grammar:giai_thich_8dda13')} </strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Dạng Hình ảnh IMAGE_QUESTION */}
                  {q.type === 'IMAGE_QUESTION' && (
                    <div className="print-question-body">
                      {q.image_url && (
                        <div className="print-image-wrap">
                          <img src={q.image_url} alt={t('grammar:minh_hoa_30e551')} className="print-inline-img" />
                          {q.image_caption && <div className="print-caption">({q.image_caption})</div>}
                        </div>
                      )}
                      <div className="print-q-lead">{q.question_text}</div>
                      <div className="print-options-grid">
                        {(q.options || []).map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = opt.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
                          return (
                            <div key={oIdx} className={`print-option-row ${printMode === 'TEACHER' && isCorrect ? 'teacher-correct-choice' : ''}`}>
                              <strong>({letter})</strong> {opt} {printMode === 'TEACHER' && isCorrect && "✓"}
                            </div>
                          );
                        })}
                      </div>
                      {printMode === 'TEACHER' && q.explanation && (
                        <div className="print-teacher-inline-ans">➔ {q.explanation}</div>
                      )}
                    </div>
                  )}

                  {/* 5. Dạng Đoạn văn điền từ PASSAGE_CLOZE */}
                  {q.type === 'PASSAGE_CLOZE' && (
                    <div className="print-question-body">
                      {q.passage_title && <div className="print-passage-headline">{q.passage_title}</div>}
                      <div className="print-passage-content">{q.passage_text}</div>
                      <div className="print-cloze-options-block">
                        {Object.keys(q.blanks || {}).map(bKey => (
                          <div key={bKey} className="print-cloze-row">
                            <strong> {t('grammar:cho_trong_bade65')} {bKey}]:</strong>
                            {(q.blanks[bKey]?.options || []).map((opt, oIdx) => {
                              const letter = String.fromCharCode(65 + oIdx);
                              const isCorrect = opt.trim().toLowerCase() === (q.blanks[bKey]?.correct_answer || '').trim().toLowerCase();
                              return (
                                <span key={oIdx} className={`print-cloze-pill ${printMode === 'TEACHER' && isCorrect ? 'teacher-correct-choice' : ''}`}>
                                  ({letter}) {opt} {printMode === 'TEACHER' && isCorrect && "✓"}
                                </span>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      {printMode === 'TEACHER' && q.explanation && (
                        <div className="print-teacher-inline-ans">→ {q.explanation}</div>
                      )}
                    </div>
                  )}

                  {/* 6. Dạng Đọc hiểu READING_COMPREHENSION */}
                  {q.type === 'READING_COMPREHENSION' && (
                    <div className="print-question-body">
                      {q.passage_title && <div className="print-passage-headline">{q.passage_title}</div>}
                      <div className="print-passage-content">{q.passage_text}</div>
                      <div className="print-sub-questions-list">
                        {(q.sub_questions || []).map((sub, sIdx) => (
                          <div key={sIdx} className="print-sub-q-item">
                            <div className="print-sub-q-title">
                              <strong>{qNum}.{sIdx + 1}</strong> {sub.question}
                            </div>
                            <div className="print-options-grid">
                              {(sub.options || []).map((opt, oIdx) => {
                                const letter = String.fromCharCode(65 + oIdx);
                                const isCorrect = opt.trim().toLowerCase() === (sub.correct_answer || '').trim().toLowerCase();
                                return (
                                  <div key={oIdx} className={`print-option-row ${printMode === 'TEACHER' && isCorrect ? 'teacher-correct-choice' : ''}`}>
                                    <strong>({letter})</strong> {opt} {printMode === 'TEACHER' && isCorrect && "✓"}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {printMode === 'TEACHER' && q.explanation && (
                        <div className="print-teacher-inline-ans">→ {q.explanation}</div>
                      )}
                    </div>
                  )}

                  {/* 7. Dạng Nghe audio AUDIO_LISTENING */}
                  {q.type === 'AUDIO_LISTENING' && (
                    <div className="print-question-body">
                      <div className="print-audio-notice"> {t('grammar:phan_thi_nghe_hieu_audio_listening_ca8461')} </div>
                      <div className="print-q-lead">{q.question_text}</div>
                      <div className="print-options-grid">
                        {(q.options || []).map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = opt.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
                          return (
                            <div key={oIdx} className={`print-option-row ${printMode === 'TEACHER' && isCorrect ? 'teacher-correct-choice' : ''}`}>
                              <strong>({letter})</strong> {opt} {printMode === 'TEACHER' && isCorrect && "✓"}
                            </div>
                          );
                        })}
                      </div>
                      {printMode === 'TEACHER' && (
                        <div className="print-teacher-inline-ans">
                          {q.transcript && <div><strong> {t('grammar:loi_thoai_transcript_345f81')} </strong> "{q.transcript}"</div>}
                          {q.explanation && <div><strong> {t('grammar:giai_thich_8dda13')} </strong> {q.explanation}</div>}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* 3. BẢNG TỔNG HỢP ĐÁP ÁN (DÀNH CHO BẢN GIÁO VIÊN HOẶC TRANG CUỐI) */}
          {printMode === 'TEACHER' && (
            <div className="print-answer-key-appendix">
              <h3 className="print-appendix-title"> {t('grammar:bang_tong_hop_ap_an_thang_iem_chi_tiet_d3ec47')} </h3>
              <table className="print-answer-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}> {t('grammar:cau_c99b5e')} </th>
                    <th style={{ width: '160px' }}> {t('grammar:dang_bai_223731')} </th>
                    <th> {t('grammar:ap_an_chuan_44334b')} </th>
                    <th style={{ width: '80px' }}> {t('grammar:thang_diem_96c111')} </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => {
                    let ansText = "-";
                    if (q.type === 'SPOT_ERROR') ansText = t('common:feedback_1', { v0: String.fromCharCode(64 + (q.correct_token_id || 1)), v1: q.correction });
                    else if (q.type === 'FILL_BLANK_TEXT') ansText = Object.keys(q.blanks || {}).map(k => q.blanks[k]?.accepted_answers?.[0]).join(', ');
                    else if (q.type === 'FILL_BLANK_DROPDOWN' || q.type === 'FILL_BLANK_CARDS') ansText = q.blanks?.["1"]?.correct_answer || '';
                    else if (q.type === 'IMAGE_QUESTION' || q.type === 'AUDIO_LISTENING') ansText = q.correct_answer || '';
                    else if (q.type === 'PASSAGE_CLOZE') ansText = Object.keys(q.blanks || {}).map(k => `[${k}]: ${q.blanks[k]?.correct_answer}`).join('; ');
                    else if (q.type === 'READING_COMPREHENSION') ansText = (q.sub_questions || []).map((s, si) => `${idx + 1}.${si + 1}: ${s.correct_answer}`).join('; ');

                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                        <td>{q.type}</td>
                        <td style={{ fontWeight: 600 }}>{ansText}</td>
                        <td style={{ textAlign: 'center' }}>{(10 / questions.length).toFixed(1)} {t('grammar:d_c5f958')} </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* FOOTER BÀI KIỂM TRA */}
          <div className="print-test-footer"> {t('grammar:het_bai_thi_a56566')} {activeGroup?.title} {t('grammar:study_e_education_platform_efbc85')} </div>

        </div>

      </div>
    </div>, document.body
  );
};

export default PrintTestModal;
