import { t } from '../../../../i18n/index.js';
// ============================================================
// VIEW / COMPONENT — Fill in the Blank Question
// Supports three display modes: text input, inline dropdown,
// and option cards (A, B, C, D).
// ============================================================
import React, { useState } from 'react';

const FillBlankQuestion = ({ question, onAnswerResult }) => {
  const isDropdown = question.type === 'FILL_BLANK_DROPDOWN';
  const isCards = question.type === 'FILL_BLANK_CARDS';
  const isText = question.type === 'FILL_BLANK_TEXT' || (!isDropdown && !isCards);

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [blankResults, setBlankResults] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);

  const handleInputChange = (blankKey, value) => {
    setAnswers(prev => ({ ...prev, [blankKey]: value }));
    if (submitted) setSubmitted(false);
  };

  const normalizeString = (str, strictCase, ignoreWhitespace) => {
    if (!str) return '';
    let res = str;
    if (ignoreWhitespace) res = res.trim().replace(/\s+/g, ' ');
    if (!strictCase) res = res.toLowerCase();
    return res;
  };

  const handleCheckAnswer = () => {
    const results = {};
    let allCorrect = true;
    const blanks = question.blanks || {};
    const strictCase = question.validation?.strict_case ?? false;
    const ignoreWhitespace = question.validation?.ignore_extra_whitespace ?? true;

    Object.keys(blanks).forEach((key) => {
      const blankConfig = blanks[key];
      const userAnswer = answers[key] || '';
      const normalizedUser = normalizeString(userAnswer, strictCase, ignoreWhitespace);

      let isFieldCorrect = false;
      if (isDropdown || isCards) {
        const correctTarget = normalizeString(blankConfig.correct_answer, strictCase, ignoreWhitespace);
        isFieldCorrect = normalizedUser !== '' && normalizedUser === correctTarget;
      } else {
        const accepted = (blankConfig.accepted_answers || []).map(ans =>
          normalizeString(ans, strictCase, ignoreWhitespace)
        );
        isFieldCorrect = accepted.includes(normalizedUser);
      }

      results[key] = {
        isCorrect: isFieldCorrect,
        userAnswer,
        expected: blankConfig.correct_answer || (blankConfig.accepted_answers && blankConfig.accepted_answers[0]) || ''
      };

      if (!isFieldCorrect) allCorrect = false;
    });

    setBlankResults(results);
    setSubmitted(true);

    if (allCorrect) {
      setShowExplanation(true);
      if (onAnswerResult) onAnswerResult(true);
    } else {
      if (onAnswerResult) onAnswerResult(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setBlankResults({});
    setShowExplanation(false);
    if (onAnswerResult) onAnswerResult(false);
  };

  const renderSentence = () => {
    const template = question.template || '';
    const parts = template.split(/\{(\d+)\}/g);

    return (
      <div className="fill-blank-sentence">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            const blankKey = part;
            const blankConfig = question.blanks?.[blankKey] || {};
            const result = blankResults[blankKey];

            if (isCards) {
              const selectedVal = answers[blankKey];
              let cardClass = '';
              if (submitted && result) cardClass = result.isCorrect ? 'correct' : 'incorrect';
              return (
                <span key={index} className="inline-blank-wrapper">
                  <span className={`blank-placeholder-target ${cardClass}`}>
                    {selectedVal || `[ ___#${blankKey}___ ]`}
                  </span>
                  {submitted && result && !result.isCorrect && (
                    <span className="blank-correct-contrast"> {t('grammar:ung_acb110')} {result.expected}</span>
                  )}
                </span>
              );
            }

            if (isDropdown) {
              const options = blankConfig.options || [];
              let selectClass = '';
              if (submitted && result) selectClass = result.isCorrect ? 'correct' : 'incorrect';
              return (
                <span key={index} className="inline-blank-wrapper">
                  <select
                    className={`inline-select-dropdown ${selectClass}`}
                    value={answers[blankKey] || ''}
                    onChange={(e) => handleInputChange(blankKey, e.target.value)}
                    disabled={submitted && result?.isCorrect}
                  >
                    <option value=""> {t('grammar:chon_dap_an_e3620c')} </option>
                    {options.map((opt, optIdx) => (
                      <option key={optIdx} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {submitted && result && !result.isCorrect && (
                    <span className="blank-correct-contrast"> {t('grammar:ung_acb110')} {result.expected}</span>
                  )}
                </span>
              );
            }

            // Text Input mode
            const currentVal = answers[blankKey] || '';
            const inputWidth = Math.max((currentVal.length || 0), 6) + 3;
            let inputClass = '';
            if (submitted && result) inputClass = result.isCorrect ? 'correct' : 'incorrect';

            return (
              <span key={index} className="inline-blank-wrapper">
                <input
                  type="text"
                  className={`inline-blank-input ${inputClass}`}
                  style={{ width: `${inputWidth}ch` }}
                  value={currentVal}
                  placeholder="..."
                  onChange={(e) => handleInputChange(blankKey, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCheckAnswer(); }}
                  disabled={submitted && result?.isCorrect}
                  autoComplete="off"
                  spellCheck="false"
                />
                {submitted && result && !result.isCorrect && (
                  <span className="blank-correct-contrast"> {t('grammar:ung_acb110')} {result.expected}</span>
                )}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  const renderCards = () => {
    if (!isCards) return null;
    const blankConfig = question.blanks?.["1"] || {};
    const options = blankConfig.options || [];
    const selectedAnswer = answers["1"];
    const result = blankResults["1"];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
      <div style={{ marginTop: '10px', marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}> {t('grammar:chon_1_the_duoi_day_de_dien_vao_cau_3e16a5')} </p>
        <div className="option-cards-grid">
          {options.map((opt, idx) => {
            const letter = letters[idx % letters.length];
            const isSelected = selectedAnswer === opt;
            let cardStatus = '';
            if (submitted && result) {
              if (isSelected) {
                cardStatus = result.isCorrect ? 'correct' : 'incorrect';
              } else if (opt.toLowerCase() === (blankConfig.correct_answer || '').toLowerCase()) {
                cardStatus = 'correct';
              }
            } else if (isSelected) {
              cardStatus = 'selected';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`option-card-btn ${cardStatus} ${submitted && result?.isCorrect ? 'locked' : ''}`}
                onClick={() => handleInputChange("1", opt)}
              >
                <div className="option-badge-key">{letter}</div>
                <div style={{ fontSize: '17px', fontWeight: '600' }}>{opt}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const isAllAnswered = Object.keys(question.blanks || {}).every(
    (key) => answers[key] && answers[key].trim() !== ''
  );

  const isEntirelyCorrect = submitted && Object.keys(blankResults).length > 0 &&
    Object.values(blankResults).every(r => r.isCorrect);

  return (
    <div className="exercise-card glass-panel">
      <div className="exercise-meta-tag">
        {isText && t('grammar:dang_bai_ien_tu_vao_o_trong_b54c7d')}
        {isDropdown && t('grammar:dang_bai_chon_dap_an_tha_xuong_0c1370')}
        {isCards && t('grammar:dang_bai_trac_nghiem_the_dap_an_40c4c9')}
      </div>

      <div className="exercise-instruction">
        {question.instruction || t('grammar:ien_noi_dung_dung_vao_cac_o_trong_9fd0d0')}
      </div>

      {renderSentence()}
      {renderCards()}

      <div className="exercise-action-bar">
        <div className="action-buttons-group">
          {!isEntirelyCorrect ? (
            <button
              className="btn btn-primary"
              onClick={handleCheckAnswer}
              disabled={!isAllAnswered}
              style={{ opacity: !isAllAnswered ? 0.6 : 1 }}
            > {t('grammar:nop_bai_kiem_tra_241e3e')} </button>
          ) : (
            <button
              className="btn btn-glass"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? t('grammar:an_phan_tich_e9b984') : t('grammar:phan_tich_ap_an_e0429a')}
            </button>
          )}

          {submitted && (
            <button className="btn btn-glass" onClick={handleReset}> {t('grammar:lam_lai_d3a72f')} </button>
          )}
        </div>

        {submitted && (
          <div style={{ fontSize: '15px', fontWeight: '600' }}>
            {isEntirelyCorrect ? (
              <span style={{ color: '#34d399' }}> {t('grammar:xuat_sac_tat_ca_cac_vi_tri_deu_chinh_xac_242cab')} </span>
            ) : (
              <span style={{ color: '#fb7185' }}> {t('grammar:co_vi_tri_chua_chinh_xac_vui_long_kiem_t_a49ba1')} </span>
            )}
          </div>
        )}
      </div>

      {showExplanation && question.explanation && (
        <div className="feedback-box success-box">
          <div className="feedback-title">
            <span> {t('grammar:phan_tich_ngu_phap_chi_tiet_94056b')} </span>
          </div>
          <div className="feedback-content">
            <p>{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillBlankQuestion;
