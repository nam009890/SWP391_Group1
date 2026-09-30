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
  const colors = ['var(--primary)', 'var(--secondary)', '#f43f5e', '#10b981', '#f59e0b'];

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
          <h1>Welcome back, <span className="highlight">{user?.name || 'Student'}</span></h1>
          <p className="subtitle">Ready to conquer some new words today?</p>
        </div>
        <button className="btn btn-primary create-btn" onClick={() => setIsModalOpen(true)}>
          <span className="plus-icon">+</span> Create Deck
        </button>
      </header>

      <section className="decks-section">
        <h2>Your Flashcard Decks</h2>
        
        {loading ? (
          <p>Loading decks...</p>
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
                    <h3>{deck.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px' }}>{deck.description}</p>
                    <div className="deck-meta">
                      <span className="card-count">{deck.flashcardCount || 0} terms</span>
                      <button 
                        className="btn btn-glass study-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/study/${deck.id}`);
                        }}
                      >
                        Study Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="deck-card glass-panel add-deck-card" onClick={() => setIsModalOpen(true)}>
              <div className="add-icon">+</div>
              <h3>Create new deck</h3>
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
