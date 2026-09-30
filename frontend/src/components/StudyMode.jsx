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

  useEffect(() => {
    fetchDueFlashcards();
  }, [id]);

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

  const handleReview = async (quality) => {
    const currentCard = flashcards[currentIndex];
    
    try {
      // Gửi đánh giá lên server
      await api.post(`/study/flashcards/${currentCard.id}/review`, { quality });
      
      // Chuyển sang thẻ tiếp theo
      setIsFlipped(false);
      
      // Đợi hiệu ứng lật thẻ kết thúc rồi mới đổi nội dung
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
        <div className="progress-indicator">
          Đang học: {currentIndex + 1} / {flashcards.length}
        </div>
      </div>

      <div className="flashcard-3d-wrapper" onClick={handleFlip}>
        <div className={`flashcard-3d-inner ${isFlipped ? 'is-flipped' : ''}`}>
          
          {/* MẶT TRƯỚC */}
          <div className="flashcard-face flashcard-front">
            <h1 className="study-vocab">{currentCard.vocabulary}</h1>
            {currentCard.phonetic && <p className="study-phonetic">/{currentCard.phonetic}/</p>}
            <div className="flip-hint">Chạm để lật mặt sau 👆</div>
          </div>

          {/* MẶT SAU */}
          <div className="flashcard-face flashcard-back">
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
      <div className={`review-actions ${isFlipped ? 'show' : ''}`}>
        <p className="review-question">Bạn nhớ từ này có rõ không?</p>
        <div className="review-buttons">
          <button className="review-btn btn-again" onClick={() => handleReview(1)}>
            Quên<br/><span>(&lt; 1 phút)</span>
          </button>
          <button className="review-btn btn-hard" onClick={() => handleReview(3)}>
            Khó<br/><span>(1 ngày)</span>
          </button>
          <button className="review-btn btn-good" onClick={() => handleReview(4)}>
            Tốt<br/><span>(2 ngày)</span>
          </button>
          <button className="review-btn btn-easy" onClick={() => handleReview(5)}>
            Dễ<br/><span>(4 ngày)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudyMode;
