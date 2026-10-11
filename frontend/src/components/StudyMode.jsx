import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import './StudyMode.css';

function StudyMode() {
  const { id } = useParams(); // Deck ID
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  // States for Pronunciation
  const [isListening, setIsListening] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState(null);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    fetchDueFlashcards();
  }, [id]);

  // Reset pronunciation states when changing cards
  useEffect(() => {
    setPronunciationScore(null);
    setTranscript('');
    setIsListening(false);
  }, [currentIndex]);

  const fetchDueFlashcards = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/study/decks/${id}/due`);
      setFlashcards(response.data);
      setLoading(false);
      
      if (response.data.length === 0) {
        setFinished(true);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thẻ bài cần học:", error);
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSkip = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Đợi hiệu ứng lật thẻ (nếu có)
    setIsFlipped(false);
    
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setFinished(true);
      }
    }, 300);
  };

  const handleReview = async (quality) => {
    const currentCard = flashcards[currentIndex];
    
    try {
      await api.post(`/study/flashcards/${currentCard.id}/review`, { quality });
      setIsFlipped(false);
      
      setTimeout(() => {
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setFinished(true);
        }
      }, 300);
      
    } catch (error) {
      console.error("Lỗi khi lưu kết quả ôn tập:", error);
      alert("Có lỗi xảy ra khi lưu kết quả!");
    }
  };

  const speakWord = (e, word) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return alert('Trình duyệt không hỗ trợ phát âm');
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const calculateSimilarity = (s1, s2) => {
    let s1L = s1.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    let s2L = s2.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    
    if (s1L === s2L) return 100;
    
    const costs = [];
    for (let i = 0; i <= s1L.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2L.length; j++) {
        if (i === 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1L.charAt(i - 1) !== s2L.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2L.length] = lastValue;
    }
    const maxLen = Math.max(s1L.length, s2L.length);
    if (maxLen === 0) return 100;
    return Math.round(((maxLen - costs[s2L.length]) / maxLen) * 100);
  };

  const startListening = (e, targetWord) => {
    e.stopPropagation();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng dùng Chrome/Edge.');
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Đang nghe...');
      setPronunciationScore(null);
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setTranscript(speechResult);
      
      const score = calculateSimilarity(speechResult, targetWord);
      setPronunciationScore(score);
    };

    recognition.onerror = (event) => {
      setTranscript('Lỗi nghe: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50'; // Green
    if (score >= 50) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  if (loading) {
    return <div className="study-container"><div className="loader"></div></div>;
  }

  if (finished) {
    return (
      <div className="study-container finished-state">
        <div className="glass-panel finished-panel">
          <h2>🎉 Chúc mừng!</h2>
          <p>Bạn đã học xong tất cả các thẻ bài cần ôn tập hôm nay.</p>
          <button className="primary-btn" onClick={() => navigate(`/deck/${id}`)}>
            Quay lại bộ từ vựng
          </button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="study-container">
      <div className="study-header">
        <button className="back-btn" onClick={() => navigate(`/deck/${id}`)}>
          ← Quay lại
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="progress-indicator">
            Đang học: {currentIndex + 1} / {flashcards.length}
          </div>
          <button 
            className="btn btn-glass" 
            onClick={handleSkip}
            style={{ padding: '8px 15px', fontSize: '14px' }}
          >
            Bỏ qua ⏭
          </button>
        </div>
      </div>

      <div className="flashcard-3d-wrapper" onClick={handleFlip}>
        <div className={`flashcard-3d-inner ${isFlipped ? 'is-flipped' : ''}`}>
          
          {/* MẶT TRƯỚC */}
          <div className="flashcard-face flashcard-front">
            <h1 className="study-vocab">{currentCard.vocabulary}</h1>
            {currentCard.phonetic && <p className="study-phonetic">/{currentCard.phonetic}/</p>}
            
            <div className="pronunciation-actions" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-glass" onClick={(e) => speakWord(e, currentCard.vocabulary)} style={{ fontSize: '24px', padding: '10px 15px', borderRadius: '50%' }} title="Nghe phát âm">
                🔊
              </button>
              
              <button className={`btn ${isListening ? 'btn-primary' : 'btn-glass'}`} onClick={(e) => startListening(e, currentCard.vocabulary)} style={{ fontSize: '24px', padding: '10px 15px', borderRadius: '50%', backgroundColor: isListening ? '#f44336' : '' }} title="Luyện đọc">
                🎤
              </button>
            </div>

            {(transcript || pronunciationScore !== null) && (
              <div className="pronunciation-result" onClick={e => e.stopPropagation()} style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', minWidth: '200px' }}>
                <div style={{ fontSize: '14px', color: '#ccc' }}>
                  {isListening ? transcript : `Bạn nói: "${transcript}"`}
                </div>
                {pronunciationScore !== null && (
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(pronunciationScore), marginTop: '5px' }}>
                    {pronunciationScore}% {pronunciationScore >= 80 ? '🌟' : pronunciationScore >= 50 ? '👍' : '💪'}
                  </div>
                )}
              </div>
            )}

            <div className="flip-hint" style={{ marginTop: 'auto' }}>Chạm để lật mặt sau 👆</div>
          </div>

          {/* MẶT SAU */}
          <div className="flashcard-face flashcard-back">
            <h2 className="study-meaning">{currentCard.meaning}</h2>
            {currentCard.exampleSentence && (
              <div className="study-example-box">
                <p className="study-example">"{currentCard.exampleSentence}"</p>
                <button className="btn btn-glass" onClick={(e) => speakWord(e, currentCard.exampleSentence)} style={{ fontSize: '16px', padding: '5px 10px', marginTop: '10px' }} title="Nghe câu ví dụ">
                  🔊 Nghe câu
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CÁC NÚT ĐÁNH GIÁ (Chỉ hiện khi đã lật thẻ) */}
      <div className={`review-actions ${isFlipped ? 'show' : ''}`} style={{ paddingBottom: '40px' }}>
        <div className="review-buttons" style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => handleReview(4)} 
            style={{ padding: '15px 40px', fontSize: '18px', borderRadius: '30px', minWidth: '200px' }}
          >
            Tiếp theo ➔
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudyMode;
