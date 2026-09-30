import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import './FlashcardPlayer.css';

const FlashcardPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await api.get(`http://localhost:8080/api/decks/${id}/flashcards`);
        setFlashcards(response.data);
      } catch (error) {
        console.error("Failed to fetch flashcards:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlashcards();
  }, [id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
    }
  };

  if (loading) {
    return (
      <div className="study-container animate-fade-in" style={{ justifyContent: 'center' }}>
        <h2>Loading flashcards...</h2>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="study-container animate-fade-in" style={{ justifyContent: 'center' }}>
        <h2>This deck is empty!</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="study-container animate-fade-in">
      <div className="study-header">
        <button className="btn btn-glass" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </button>
        <div className="progress-text">
          {currentIndex + 1} / {flashcards.length}
        </div>
      </div>

      <div className="flashcard-wrapper perspective-1000">
        <div 
          className={`flashcard preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={handleFlip}
        >
          {/* Front of card */}
          <div className="flashcard-face flashcard-front glass-panel backface-hidden">
            <span className="face-label">TERM</span>
            <h2 className="card-text">{currentCard.vocabulary}</h2>
            {currentCard.phonetic && <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>{currentCard.phonetic}</p>}
            <p className="flip-hint">Click to flip</p>
          </div>

          {/* Back of card */}
          <div className="flashcard-face flashcard-back glass-panel backface-hidden rotate-y-180">
            <span className="face-label">DEFINITION</span>
            <p className="card-text">{currentCard.meaning}</p>
            {currentCard.exampleSentence && (
              <p style={{ color: 'var(--primary)', marginTop: '20px', fontStyle: 'italic', fontSize: '18px' }}>
                "{currentCard.exampleSentence}"
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="controls">
        <button 
          className="btn btn-glass control-btn" 
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        <button 
          className="btn btn-primary control-btn" 
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          Next
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="progress-bar-container glass-panel">
        <div 
          className="progress-bar-fill"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default FlashcardPlayer;
