import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Community = ({ user }) => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCloning, setIsCloning] = useState(null);

  const colors = ['var(--primary)', 'var(--secondary)', '#f43f5e', '#10b981', '#f59e0b'];

  const fetchPublicDecks = async (query = '') => {
    setLoading(true);
    try {
      const response = await api.get(`/community/decks?search=${query}`);
      setDecks(response.data);
    } catch (error) {
      console.error("Failed to fetch public decks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicDecks();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPublicDecks(search);
  };

  const cloneDeck = async (deckId) => {
    setIsCloning(deckId);
    try {
      const response = await api.post(`/community/decks/${deckId}/clone`);
      navigate(`/deck/${response.data.id}`);
    } catch (error) {
      console.error("Failed to clone deck:", error);
      alert("Failed to clone deck.");
    } finally {
      setIsCloning(null);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '20px' }}>
        <div>
          <h1>Community Decks</h1>
          <p className="subtitle">Discover and learn from flashcards created by others</p>
        </div>
        <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '600px', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Search by topic, keyword, or author..." 
            className="glass-input" 
            style={{ flex: 1, padding: '12px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>Search</button>
        </form>
      </header>

      <section className="decks-section">
        
        {loading ? (
          <p>Loading community decks...</p>
        ) : decks.length === 0 ? (
          <p>No public decks found. Try a different search.</p>
        ) : (
          <div className="decks-grid">
            {decks.map((deck, index) => {
              const deckColor = colors[index % colors.length];
              const isMyDeck = user && deck.authorId === user.id;
              
              return (
                <div 
                  key={deck.id} 
                  className="deck-card glass-panel"
                  style={{ cursor: 'default' }}
                >
                  <div className="deck-card-top" style={{ background: `linear-gradient(135deg, ${deckColor}80, transparent)` }}></div>
                  <div className="deck-card-content">
                    <h3>{deck.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '5px' }}>{deck.description || 'No description'}</p>
                    <p style={{ fontSize: '12px', color: 'var(--secondary)', marginBottom: '15px' }}>
                      By: <span 
                        style={{ cursor: 'pointer', textDecoration: 'underline' }} 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (deck.authorId) navigate(`/user/${deck.authorId}`);
                        }}
                      >
                        {deck.authorName || 'Unknown User'}
                      </span> {isMyDeck && '(You)'}
                    </p>
                    <div className="deck-meta">
                      <span className="card-count">{deck.flashcardCount || 0} terms</span>
                      
                      {!isMyDeck && (
                        <button 
                          className="btn btn-primary study-btn"
                          onClick={() => cloneDeck(deck.id)}
                          disabled={isCloning === deck.id}
                        >
                          {isCloning === deck.id ? 'Cloning...' : 'Clone & Study'}
                        </button>
                      )}
                      {isMyDeck && (
                        <button 
                          className="btn btn-glass study-btn"
                          onClick={() => navigate(`/deck/${deck.id}`)}
                        >
                          View Mine
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Community;
