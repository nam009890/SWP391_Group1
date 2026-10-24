import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDeckCards } from '../api/deckApi';
import api from '../api/axiosConfig';
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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setFlashcards([]); setCurrentIndex(0); setIsFlipped(false); setFinished(false);
    // Guest chỉ đọc public cards, không gọi API review và không ghi tiến độ.
    const request = user ? api.get(`/study/decks/${id}/due`, { signal: controller.signal }) : getDeckCards(id, false, controller.signal);
    request.then(({ data }) => { if (!controller.signal.aborted) { setFlashcards(data); setFinished(data.length === 0); } })
      .catch(err => { if (err.code !== 'ERR_CANCELED') setError('This deck is unavailable or could not be loaded.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, user, revision]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (quality) => {
    if (!user || saving) return;
    const currentCard = flashcards[currentIndex];
    setSaving(true); setError('');
    try {
      // Gửi đánh giá lên server
      await api.post(`/study/flashcards/${currentCard.id}/review`, { quality });
      
      // Chuyển sang thẻ tiếp theo
      setIsFlipped(false);
      
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setFinished(true);
        }
      
    } catch (error) {
      console.error("Lỗi khi lưu kết quả ôn tập:", error);
      setError('Could not save your review. Please try again.');
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="study-container"><div className="loader"></div></div>;
  }

  if (finished) {
    return (
      <div className="study-container finished-state">
        <div className="glass-panel finished-panel">
          <h2>{flashcards.length ? 'Session complete!' : 'All caught up'}</h2>
          <p>{user ? 'You have reviewed all cards currently due in this deck.' : flashcards.length ? 'You have explored every card in this session.' : 'This deck has no flashcards yet.'}</p>
          <button className="btn btn-primary" onClick={() => navigate(`/deck/${id}`)}>
            Back to deck
          </button>
          {!user && flashcards.length > 0 && <button className="btn btn-glass" onClick={() => { setCurrentIndex(0); setIsFlipped(false); setFinished(false); }}>Restart session</button>}
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  if (!currentCard) return <main className="study-container study-error"><p role="alert">{error || 'No flashcards available.'}</p><button className="btn btn-primary" onClick={() => setRevision(r => r + 1)}>Retry</button><Link className="btn btn-glass" to={`/deck/${id}`}>Back to deck</Link></main>;

  return (
    <div className="study-container">
      <div className="study-header">
        <button className="back-btn" onClick={() => navigate(`/deck/${id}`)}>
          ← Back to deck
        </button>
        <div className="progress-indicator">
          Card {currentIndex + 1} of {flashcards.length}
        </div>
      </div>

      {!user && <p className="deck-guest-note">Guest session · <Link to="/login" state={{ from: `/study/${id}` }}>Log in</Link> to save your learning progress.</p>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="progress" role="progressbar" aria-label="Session progress" aria-valuenow={currentIndex} aria-valuemin={0} aria-valuemax={flashcards.length}><i style={{ width: `${currentIndex / flashcards.length * 100}%` }}/></div>

      <div className="flashcard-3d-wrapper" role="button" tabIndex={0} aria-label="Flip flashcard" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(); } }} onClick={handleFlip}>
        <div className={`flashcard-3d-inner ${isFlipped ? 'is-flipped' : ''}`}>
          
          {/* MẶT TRƯỚC */}
          <div className="flashcard-face flashcard-front" aria-hidden={isFlipped}>
            <h1 className="study-vocab">{currentCard.vocabulary}</h1>
            {currentCard.phonetic && <p className="study-phonetic">{currentCard.phonetic}</p>}
            <div className="flip-hint">Click or press Enter to flip</div>
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
      {user ? <fieldset disabled={saving || !isFlipped} style={{ border: 0 }} className={`review-actions ${isFlipped ? 'show' : ''}`}>
        <p className="review-question">How well did you remember this word?</p>
        <div className="review-buttons">
          <button className="review-btn btn-again" onClick={() => handleReview(1)}>
            Again<br/><span>Forgot the word</span>
          </button>
          <button className="review-btn btn-hard" onClick={() => handleReview(3)}>
            Hard<br/><span>Needed a hint</span>
          </button>
          <button className="review-btn btn-good" onClick={() => handleReview(4)}>
            Good<br/><span>Remembered it</span>
          </button>
          <button className="review-btn btn-easy" onClick={() => handleReview(5)}>
            Easy<br/><span>Remembered instantly</span>
          </button>
        </div>
      </fieldset> : <div className="study-guest-controls"><button className="btn btn-glass" disabled={currentIndex === 0} onClick={() => { setCurrentIndex(i => i - 1); setIsFlipped(false); }}>← Previous</button><button className="btn btn-primary" onClick={() => { setIsFlipped(false); if (currentIndex + 1 === flashcards.length) setFinished(true); else setCurrentIndex(i => i + 1); }}>{currentIndex + 1 === flashcards.length ? 'Finish session' : 'Next →'}</button></div>}
    </div>
  );
}

export default StudyMode;
