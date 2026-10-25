import { t } from '../../../../i18n/index.js';
// ============================================================
// VIEW / COMPONENT — Spot the Error Question
// Renders an interactive sentence tokenizer for learners.
// ============================================================
import React, { useState } from 'react';

const SpotTheErrorQuestion = ({ question, onAnswerResult }) => {
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelectToken = (tokenId) => {
    if (submitted && isCorrect) return;
    setSelectedTokenId(tokenId);
    if (submitted && !isCorrect) {
      setSubmitted(false);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedTokenId) return;
    const correct = selectedTokenId === question.correct_token_id;
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) {
      setShowExplanation(true);
      if (onAnswerResult) onAnswerResult(true);
    } else {
      if (onAnswerResult) onAnswerResult(false);
    }
  };

  const handleReset = () => {
    setSelectedTokenId(null);
    setSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(false);
    if (onAnswerResult) onAnswerResult(false);
  };

  return (
    <div className="exercise-card glass-panel">
      <div className="exercise-meta-tag"> {t('grammar:dang_bai_tim_loi_sai_trong_cau_bf747b')} </div>

      <div className="exercise-instruction">
        {question.instruction || t('grammar:chi_ra_loi_sai_trong_cau_sau_bang_cach_c_2a92da')}
      </div>

      {/* Interactive Sentence Tokens */}
      <div className="tokens-sentence-container">
        {question.tokens?.map((token) => {
          const isSelected = selectedTokenId === token.id;
          const isTargetErrorToken = token.id === question.correct_token_id;

          let statusClass = '';
          if (submitted) {
            if (isSelected) statusClass = isCorrect ? 'correct' : 'incorrect';
          } else if (isSelected) {
            statusClass = 'selected';
          }

          const isLocked = submitted && isCorrect;

          return (
            <span
              key={token.id}
              className={`token-chip ${statusClass} ${isLocked ? 'locked' : ''}`}
              onClick={() => handleSelectToken(token.id)}
              title={t('grammar:click_de_chon_vi_tri_nay_626f1e')}
            >
              {submitted && isCorrect && isTargetErrorToken ? (
                <>
                  <span className="strikethrough-error">{token.text}</span>
                  <span className="replacement-text">→ {question.correction || 'went'}</span>
                </>
              ) : (
                token.text
              )}
            </span>
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="exercise-action-bar">
        <div className="action-buttons-group">
          {!isCorrect ? (
            <button
              className="btn btn-primary"
              onClick={handleCheckAnswer}
              disabled={!selectedTokenId}
              style={{ opacity: !selectedTokenId ? 0.6 : 1 }}
            > {t('grammar:kiem_tra_99c4b0')} </button>
          ) : (
            <button
              className="btn btn-glass"
              onClick={() => setShowExplanation(!showExplanation)}
            >
              {showExplanation ? t('grammar:an_giai_thich_9a2cfa') : t('grammar:xem_giai_thich_chi_tiet_d45cfb')}
            </button>
          )}

          {submitted && (
            <button className="btn btn-glass" onClick={handleReset}> {t('grammar:thu_lai_761e13')} </button>
          )}
        </div>

        {submitted && (
          <div style={{ fontSize: '15px', fontWeight: '600' }}>
            {isCorrect ? (
              <span style={{ color: '#34d399' }}> {t('grammar:chinh_xac_ban_da_tim_dung_loi_sai_8ae525')} </span>
            ) : (
              <span style={{ color: '#fb7185' }}> {t('grammar:chua_chinh_xac_vui_long_chon_lai_42c786')} </span>
            )}
          </div>
        )}
      </div>

      {/* Explanation Box */}
      {showExplanation && (
        <div className="feedback-box success-box">
          <div className="feedback-title">
            <span> {t('grammar:phan_tich_ngu_phap_chi_tiet_94056b')} </span>
            {question.error_type && (
              <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                {question.error_type}
              </span>
            )}
          </div>
          <div className="feedback-content" style={{ marginTop: '8px' }}>
            <p>
              <strong> {t('grammar:loi_sai_76d948')} </strong> "{question.tokens?.find(t => t.id === question.correct_token_id)?.text}" ➔{' '}
              <strong> {t('grammar:sua_thanh_b15e0f')} </strong> "{question.correction}"
            </p>
            <p style={{ marginTop: '6px' }}>{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotTheErrorQuestion;
