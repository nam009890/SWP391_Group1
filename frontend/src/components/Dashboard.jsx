import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import CreateDeckModal from './CreateDeckModal';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // UI colors for decks
  const colors = ['#d9b394', '#efb4ca', '#efd38d', '#a9c5aa', '#c9b2d9'];

  const fetchDecks = async () => {
    try {
      const response = await api.get('http://localhost:8080/api/decks');
      setDecks(response.data);
    } catch (error) {
      console.error("Failed to fetch decks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleDeckCreated = (newDeck) => {
    // Navigate immediately to the new deck details page
    navigate(`/deck/${newDeck.id}`);
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-kicker">✦ Không gian học tập</span>
          <h1>Chào bạn, <span className="highlight">{user?.name || 'học viên'}</span>!</h1>
          <p className="subtitle">Hôm nay mình cùng học thêm một chút nhé.</p>
        </div>
        <button className="btn btn-primary create-btn" onClick={() => setIsModalOpen(true)}>
          <span className="plus-icon">+</span> Tạo bộ thẻ
        </button>
      </header>

      <section className="decks-section">
        <div className="section-heading"><div><span>Bộ sưu tập của bạn</span><h2>Flashcard đang học</h2></div><span className="deck-total">{decks.length} bộ thẻ</span></div>
        
        {loading ? (
          <div className="loading-note">Đang mở sổ học tập...</div>
        ) : (
          <div className="decks-grid">
            {decks.map((deck, index) => {
              const deckColor = colors[index % colors.length];
              return (
                <div 
                  key={deck.id} 
                  className="deck-card glass-panel"
                  onClick={() => navigate(`/deck/${deck.id}`)}
                >
                  <div className="deck-card-top" style={{ background: `linear-gradient(135deg, ${deckColor}80, transparent)` }}></div>
                  <div className="deck-card-content">
                    <span className="deck-label">Bộ thẻ {String(index + 1).padStart(2, '0')}</span>
                    <h3>{deck.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>{deck.description}</p>
                    <div className="deck-meta">
                      <span className="card-count">{deck.flashcardCount || 0} từ</span>
                      <button 
                        className="btn btn-glass study-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/study/${deck.id}`);
                        }}
                      >
                        Học ngay →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="deck-card glass-panel add-deck-card" onClick={() => setIsModalOpen(true)}>
              <div className="add-icon">+</div>
              <h3>Tạo bộ thẻ mới</h3>
            </div>
          </div>
        )}
      </section>

      <CreateDeckModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onDeckCreated={handleDeckCreated} 
      />
    </div>
  );
};

export default Dashboard;
