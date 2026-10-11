import React, { useState } from 'react';

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

  return (
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
        background: '#0f172a',
        padding: '24px 28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>

        {/* HEADER MODAL (ẨN KHI IN) */}
        <div className="print-modal-header no-print">
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)', fontWeight: 700 }}>
              Tải Xuống Đề Kiểm Tra
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Định dạng chuẩn khổ giấy A4, có thể tải file về máy hoặc lưu thành PDF.
            </p>
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
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Bài kiểm tra:</label>
            <select
              className="form-input"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '13px', maxWidth: '240px', borderRadius: '8px' }}
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.questions?.length || 0} câu)
                </option>
              ))}
            </select>
          </div>

          {/* Chọn chế độ: Học sinh vs Giáo viên */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Chế độ:</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${printMode === 'STUDENT' ? 'btn-primary' : 'btn-glass'}`}
                onClick={() => setPrintMode('STUDENT')}
                style={{ fontSize: '12px' }}
              >
                Bản học sinh (Đề thi)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${printMode === 'TEACHER' ? 'btn-primary' : 'btn-glass'}`}
                onClick={() => setPrintMode('TEACHER')}
                style={{ fontSize: '12px' }}
              >
                Bản có đáp án
              </button>
            </div>
          </div>

          {/* Nút hành động */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownloadFile}
              style={{ fontWeight: 600 }}
              title="Tải trực tiếp file đề thi về máy"
            >
              Tải file về máy
            </button>
            <button
              type="button"
              className="btn btn-glass btn-sm"
              onClick={handlePrintPdf}
              style={{ fontWeight: 600 }}
              title="Mở hộp thoại in / lưu thành PDF"
            >
              In / Lưu PDF
            </button>
          </div>
        </div>

        {/* ================================================================================= */}
        {/* KHUNG NỘI DUNG TÀI LIỆU IN CHUẨN A4 (PRINT SHEET CONTAINER)                        */}
        {/* ================================================================================= */}
        <div className="printable-test-document" id="printable-test-sheet">

          {/* 1. HEADER CHUẨN ĐỀ THI */}
          <div className="print-header-section">
            <div className="print-header-left">
              <div className="print-school-title">HỆ THỐNG HỌC NGỮ PHÁP TIẾNG ANH STUDY-E</div>
              <div className="print-exam-type">BÀI KIỂM TRA ĐÁNH GIÁ NĂNG LỰC ĐỊNH KỲ</div>
              <div className="print-subject">Môn: Tiếng Anh • Thời gian: 45 phút</div>
            </div>
            <div className="print-header-right">
              <div className="print-meta-field"><strong>Họ và tên:</strong> ..............................................................</div>
              <div className="print-meta-field"><strong>Lớp / Khóa học:</strong> ................... <strong>Ngày:</strong> ....../....../2026</div>
              <div className="print-score-box">
                <div className="score-box-title">ĐIỂM SỐ</div>
                <div className="score-box-content">
                  {printMode === 'TEACHER' ? "ĐÁP ÁN GỐC" : "/ 10"}
                </div>
              </div>
            </div>
          </div>

          <div className="print-test-title-divider">
            <h2 className="print-test-main-title">
              {activeGroup?.title?.toUpperCase() || "BÀI KIỂM TRA TỔNG HỢP"}
            </h2>
            <div className="print-test-subdesc">
              (Đề thi gồm {questions.length} câu hỏi • {printMode === 'STUDENT' ? "Học sinh làm bài trực tiếp trên giấy thi này" : "Tài liệu hướng dẫn chấm điểm & đáp án chi tiết"})
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
                    <span className="print-q-number">Câu {qNum}:</span>
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
                          ➔ <strong>Lỗi sai:</strong> ( {String.fromCharCode(64 + (q.correct_token_id || 1))} ) • <strong>Sửa thành:</strong> "{q.correction}"
                          {q.explanation && <span> — {q.explanation}</span>}
                        </div>
                      ) : (
                        <div className="print-student-answer-line">
                          Từ sai là: ( ......... ) Sửa lại thành: ..............................................................
                        </div>
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
                          ➔ <strong>Đáp án đúng:</strong> {Object.keys(q.blanks || {}).map(k => `[${k}]: ${q.blanks[k]?.accepted_answers?.join(' / ') || ''}`).join(' | ')}
                          {q.explanation && <span> — {q.explanation}</span>}
                        </div>
                      ) : (
                        <div className="print-student-answer-line">
                          Đáp án điền: {Object.keys(q.blanks || {}).map(k => `[${k}] ..................................... `).join('   ')}
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
                              <strong>({letter})</strong> {opt} {printMode === 'TEACHER' && isCorrect && "✓ (Đúng)"}
                            </div>
                          );
                        })}
                      </div>

                      {printMode === 'TEACHER' && q.explanation && (
                        <div className="print-teacher-inline-ans">
                          ➔ <strong>Giải thích:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Dạng Hình ảnh IMAGE_QUESTION */}
                  {q.type === 'IMAGE_QUESTION' && (
                    <div className="print-question-body">
                      {q.image_url && (
                        <div className="print-image-wrap">
                          <img src={q.image_url} alt="Minh họa" className="print-inline-img" />
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
                            <strong>Chỗ trống [{bKey}]:</strong>
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
                      <div className="print-audio-notice">
                        [PHẦN THI NGHE HIỂU • AUDIO LISTENING]
                      </div>
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
                          {q.transcript && <div><strong>Lời thoại (Transcript):</strong> "{q.transcript}"</div>}
                          {q.explanation && <div><strong>Giải thích:</strong> {q.explanation}</div>}
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
              <h3 className="print-appendix-title">BẢNG TỔNG HỢP ĐÁP ÁN & THANG ĐIỂM CHI TIẾT</h3>
              <table className="print-answer-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Câu</th>
                    <th style={{ width: '160px' }}>Dạng bài</th>
                    <th>Đáp án chuẩn</th>
                    <th style={{ width: '80px' }}>Thang điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => {
                    let ansText = "-";
                    if (q.type === 'SPOT_ERROR') ansText = `Lỗi (${String.fromCharCode(64 + (q.correct_token_id || 1))}) ➔ ${q.correction}`;
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
                        <td style={{ textAlign: 'center' }}>{(10 / questions.length).toFixed(1)} đ</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* FOOTER BÀI KIỂM TRA */}
          <div className="print-test-footer">
            ---------- HẾT BÀI THI ({activeGroup?.title}) • STUDY-E EDUCATION PLATFORM ----------
          </div>

        </div>

      </div>
    </div>
  );
};

export default PrintTestModal;
