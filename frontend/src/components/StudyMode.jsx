import { t , localizeMessage } from '../i18n/index.js';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDeckCards } from '../api/deckApi';
import api from '../api/axiosConfig';
import { submitStudyReview } from '../api/studyApi';
import { studyDetectionMessage } from './weakVocabularyPresentation';
import './StudyMode.css';
import './DeckExplorer.css';

function StudyMode({ user }) {
  const { id } = useParams(); // Deck ID
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const [pendingReview, setPendingReview] = useState(null);
  const pendingRef = useRef(null);
  const savingRef = useRef(false);
  const sessionRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    sessionRef.current += 1;
    pendingRef.current = null;
    savingRef.current = false;
    setPendingReview(null);
    setSaving(false);
    setNotice('');
    setLoading(true); setError(''); setFlashcards([]); setCurrentIndex(0); setIsFlipped(false); setFinished(false);
    // Guest chỉ đọc public cards, không gọi API review và không ghi tiến độ.
    const request = user?.id ? api.get(`/study/decks/${id}/due`, { signal: controller.signal }) : getDeckCards(id, false, controller.signal);
    request.then(({ data }) => { if (!controller.signal.aborted) { setFlashcards(data); setFinished(data.length === 0); } })
      .catch(err => { if (err.code !== 'ERR_CANCELED') setError(t('study:this_deck_is_unavailable_or_could_not_be_6e6df5')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => {
      sessionRef.current += 1;
      controller.abort();
    };
  }, [id, user?.id, revision]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (quality) => {
    if (!user || savingRef.current) return;
    const session = sessionRef.current;
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;
    // Một hành động chọn mức nhớ có một UUID; timeout/retry phải giữ nguyên payload và UUID.
    const pending = pendingRef.current || {
      flashcardId: currentCard.id,
      quality,
      requestId: crypto.randomUUID(),
    };
    pendingRef.current = pending;
    setPendingReview(pending);
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const { data } = await submitStudyReview(pending.flashcardId, pending.quality, pending.requestId);
      if (session !== sessionRef.current) return;
      setNotice(studyDetectionMessage(currentCard.vocabulary, data.weakDetection));
      pendingRef.current = null;
      setPendingReview(null);
      setIsFlipped(false);
      // Chỉ tiến tới thẻ tiếp theo sau khi backend đã xác nhận transaction thành công.
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(index => index + 1);
      } else {
        setFinished(true);
      }
    } catch (failure) {
      if (session !== sessionRef.current) return;
      setError(failure.response?.data?.message || t('study:khong_luu_duoc_danh_gia_thu_lai_se_giu_n_d3404b'));
    } finally {
      if (session === sessionRef.current) {
        savingRef.current = false;
        setSaving(false);
      }
    }
  };

  const detectionNotice = notice && (
    <aside className="study-detection-notice" role="status" aria-live="polite">
      <p>{notice}</p>
      <Link to="/weak-vocabulary"> {t('study:xem_danh_sach_tu_yeu_b70841')} </Link>
      <button type="button" aria-label={t('study:ong_thong_bao_813b12')} onClick={() => setNotice('')}>×</button>
    </aside>
  );

  if (loading) {
    return <div className="study-container"><div className="loader"></div></div>;
  }

  if (finished) {
    return (
      <div className="study-container finished-state">
        {detectionNotice}
        <div className="glass-panel finished-panel">
          <h2>{flashcards.length ? t('study:session_complete_7c5251') : t('study:all_caught_up_47cbaf')}</h2>
          <p>{user ? t('study:you_have_reviewed_all_cards_currently_du_0671d0') : flashcards.length ? t('study:you_have_explored_every_card_in_this_ses_1cd969') : t('study:this_deck_has_no_flashcards_yet_1be861')}</p>
          <button className="btn btn-primary" onClick={() => navigate(`/deck/${id}`)}> {t('study:back_to_deck_8ab1bc')} </button>
          {!user && flashcards.length > 0 && <button className="btn btn-glass" onClick={() => { setCurrentIndex(0); setIsFlipped(false); setFinished(false); }}> {t('study:restart_session_c4abcf')} </button>}
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  if (!currentCard) return <main className="study-container study-error"><p role="alert">{error || t('study:no_flashcards_available_12e793')}</p><button className="btn btn-primary" onClick={() => setRevision(r => r + 1)}> {t('study:retry_9f5cd8')} </button><Link className="btn btn-glass" to={`/deck/${id}`}> {t('study:back_to_deck_8ab1bc')} </Link></main>;

  return (
    <div className="study-container">
      <div className="study-header">
        <button className="back-btn" onClick={() => navigate(`/deck/${id}`)}> {t('study:back_to_deck_ab2615')} </button>
        <div className="progress-indicator"> {t('study:card_4d4ce7')} {currentIndex + 1} {t('study:of_de04fa')} {flashcards.length}
        </div>
      </div>

      {detectionNotice}
      {!user && <p className="deck-guest-note"> {t('study:guest_session_f83b36')} <Link to="/login" state={{ from: `/study/${id}` }}> {t('study:log_in_f7c400')} </Link> {t('study:to_save_your_learning_progress_8c41f1')} </p>}
      {error && <div role="alert" className="form-error">
        <p>{localizeMessage(error)}</p>
        {pendingReview && <button className="btn btn-primary" disabled={saving} onClick={() => handleReview(pendingReview.quality)}>
          {saving ? t('study:ang_luu_b98712') : t('study:thu_luu_lai_danh_gia_d0fdcd')}
        </button>}
      </div>}
      <div className="progress" role="progressbar" aria-label={t('study:session_progress_7585f2')} aria-valuenow={currentIndex} aria-valuemin={0} aria-valuemax={flashcards.length}><i style={{ width: `${currentIndex / flashcards.length * 100}%` }}/></div>

      <div className="flashcard-3d-wrapper" role="button" tabIndex={0} aria-label={t('study:flip_flashcard_cdb3c7')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(); } }} onClick={handleFlip}>
        <div className={`flashcard-3d-inner ${isFlipped ? 'is-flipped' : ''}`}>
          
          {/* MẶT TRƯỚC */}
          <div className="flashcard-face flashcard-front" aria-hidden={isFlipped}>
            <h1 className="study-vocab">{currentCard.vocabulary}</h1>
            {currentCard.phonetic && <p className="study-phonetic">{currentCard.phonetic}</p>}
            <div className="flip-hint"> {t('study:click_or_press_enter_to_flip_b8477a')} </div>
          </div>

          {/* MẶT SAU */}
          <div className="flashcard-face flashcard-back" aria-hidden={!isFlipped}>
            <h2 className="study-meaning">{currentCard.meaning}</h2>
            {currentCard.exampleSentence && (
              <div className="study-example-box">
                <p className="study-example">"{currentCard.exampleSentence}"</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CÁC NÚT ĐÁNH GIÁ (Chỉ hiện khi đã lật thẻ) */}
      {user ? <fieldset disabled={saving || !isFlipped || Boolean(pendingReview)} style={{ border: 0 }} className={`review-actions ${isFlipped ? 'show' : ''}`}>
        <p className="review-question"> {t('study:how_well_did_you_remember_this_word_8c4e26')} </p>
        <div className="review-buttons">
          <button className="review-btn btn-again" onClick={() => handleReview(1)}> {t('study:again_fcd761')} <br/><span> {t('study:forgot_the_word_908e94')} </span>
          </button>
          <button className="review-btn btn-hard" onClick={() => handleReview(3)}> {t('study:hard_20a899')} <br/><span> {t('study:needed_a_hint_446dee')} </span>
          </button>
          <button className="review-btn btn-good" onClick={() => handleReview(4)}> {t('study:good_61dedc')} <br/><span> {t('study:remembered_it_2de991')} </span>
          </button>
          <button className="review-btn btn-easy" onClick={() => handleReview(5)}> {t('study:easy_00f031')} <br/><span> {t('study:remembered_instantly_bc44c0')} </span>
          </button>
        </div>
      </fieldset> : <div className="study-guest-controls"><button className="btn btn-glass" disabled={currentIndex === 0} onClick={() => { setCurrentIndex(i => i - 1); setIsFlipped(false); }}> {t('study:previous_471492')} </button><button className="btn btn-primary" onClick={() => { setIsFlipped(false); if (currentIndex + 1 === flashcards.length) setFinished(true); else setCurrentIndex(i => i + 1); }}>{currentIndex + 1 === flashcards.length ? t('study:finish_session_5fe14d') : t('study:next_2f04eb')}</button></div>}
    </div>
  );
}

export default StudyMode;
