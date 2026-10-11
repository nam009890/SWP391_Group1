import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import './DeckDetails.css';

const DeckDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [example, setExample] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit card state
  const [editingCard, setEditingCard] = useState(null);
  const [editTerm, setEditTerm] = useState('');
  const [editDefinition, setEditDefinition] = useState('');
  const [editPhonetic, setEditPhonetic] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // AI Generation State
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    fetchDeckDetails();
  }, [id]);

  const fetchDeckDetails = async () => {
    try {
      const [deckRes, cardsRes] = await Promise.all([
        api.get(`/decks/${id}`),
        api.get(`/decks/${id}/flashcards`)
      ]);
      setDeck(deckRes.data);
      setFlashcards(cardsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch deck details:", error);
      setLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newTerm.trim() || !newDefinition.trim()) {
      setFormError('Vocabulary and Meaning are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const response = await api.post(`/decks/${id}/flashcards`, {
        vocabulary: newTerm,
        meaning: newDefinition,
        phonetic: phonetic,
        exampleSentence: example
      });

      setFlashcards([...flashcards, response.data]);
      setNewTerm('');
      setNewDefinition('');
      setPhonetic('');
      setExample('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add card:', err);
      setFormError('Failed to save the card. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAi = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      setAiError('Vui lòng nhập chủ đề bạn muốn tạo.');
      return;
    }

    setIsAiGenerating(true);
    setAiError('');

    try {
      const response = await api.post(`/decks/${id}/generate-ai`, {
        prompt: aiPrompt
      });
      
      // AI returns an array of newly created cards
      setFlashcards([...flashcards, ...response.data]);
      setAiPrompt('');
      setIsAiMode(false);
    } catch (err) {
      console.error('Failed to generate cards with AI:', err);
      setAiError('Có lỗi xảy ra khi gọi AI. Vui lòng thử lại.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const startEdit = (card) => {
    setEditingCard(card.id);
    setEditTerm(card.vocabulary);
    setEditDefinition(card.meaning);
    setEditPhonetic(card.phonetic || '');
    setEditExample(card.exampleSentence || '');
  };

  const cancelEdit = () => {
    setEditingCard(null);
  };

  const handleEditCard = async (e, cardId) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const response = await api.put(`/decks/${id}/flashcards/${cardId}`, {
        vocabulary: editTerm,
        meaning: editDefinition,
        phonetic: editPhonetic,
        exampleSentence: editExample
      });
      setFlashcards(flashcards.map(c => c.id === cardId ? response.data : c));
      setEditingCard(null);
    } catch (err) {
      console.error('Failed to update card:', err);
      alert('Failed to update the card. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ này?")) return;
    try {
      await api.delete(`/decks/${id}/flashcards/${cardId}`);
      setFlashcards(flashcards.filter(c => c.id !== cardId));
    } catch (err) {
      console.error('Failed to delete card:', err);
      alert('Failed to delete the card.');
    }
  };

  const handleDeleteDeck = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa BỘ THẺ này? Tất cả thẻ bên trong sẽ bị xóa.")) return;
    try {
      await api.delete(`/decks/${id}`);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete deck:', err);
      alert('Failed to delete the deck.');
    }
  };

  const speakWord = (word) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return <div className="details-container animate-fade-in" style={{ justifyContent: 'center' }}><div className="loader"></div></div>;
  }

  if (!deck) {
    return (
      <div className="details-container animate-fade-in" style={{ justifyContent: 'center' }}>
        <h2>Deck not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  const isOwner = user && user.id === deck.authorId;

  return (
    <div className="details-container animate-fade-in">
      <div className="details-header">
        <div className="deck-info">
          <h1>{deck.name}</h1>
          <p className="deck-desc">{deck.description}</p>
          <div className="deck-meta" style={{ justifyContent: 'flex-start', gap: '15px' }}>
            <span className="badge">{flashcards.length} cards</span>
            <span className="badge badge-secondary">{deck.isPublic ? 'Public' : 'Private'}</span>
          </div>
        </div>
        
        <div className="header-actions">
          {flashcards.length > 0 && (
            <button className="btn btn-primary" onClick={() => navigate(`/study/${id}`)}>
              ► Study Now
            </button>
          )}
          {isOwner && (
            <button className="btn" style={{ background: '#f43f5e', color: 'white', border: 'none', marginLeft: '10px' }} onClick={handleDeleteDeck}>
              Xóa Bộ Thẻ
            </button>
          )}
        </div>
      </div>

      <div className="cards-section">
        <div className="cards-header">
          <h2>Flashcards</h2>
          {isOwner && (
            <div className="header-actions">
              <button 
                className={`btn ${isAiMode ? 'btn-glass' : 'btn-ai'}`} 
                onClick={() => {
                  setIsAiMode(!isAiMode);
                  setIsAdding(false);
                }}
              >
                {isAiMode ? 'Cancel' : 'Tạo bằng AI 🪄'}
              </button>
              <button 
                className="btn btn-glass" 
                onClick={() => {
                  setIsAdding(!isAdding);
                  setIsAiMode(false);
                }}
              >
                {isAdding ? 'Cancel' : '+ Thêm thẻ thủ công'}
              </button>
            </div>
          )}
        </div>
        
        {isAiMode && (
          <form onSubmit={handleGenerateAi} className="add-card-form ai-form glass-panel animate-fade-in">
            <h3 style={{ background: 'linear-gradient(90deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tạo thẻ tự động bằng AI
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Nhập chủ đề bạn muốn học (VD: "Từ vựng tiếng Anh về các loài hoa", "10 từ chuyên ngành IT"). AI sẽ tự động sinh ra thẻ bài cho bạn!
            </p>
            {aiError && <div className="form-error">{aiError}</div>}
            
            <div className="form-row">
              <div className="form-group flex-1">
                <input 
                  type="text" 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)} 
                  className="glass-input" 
                  placeholder="Nhập chủ đề bạn muốn học vào đây..."
                  autoFocus
                  disabled={isAiGenerating}
                />
              </div>
              <button type="submit" className="btn btn-ai" disabled={isAiGenerating}>
                {isAiGenerating ? (
                  <span className="loading-dots">Đang suy nghĩ...</span>
                ) : 'Tạo thẻ ngay'}
              </button>
            </div>
          </form>
        )}

        {isAdding && (
          <form onSubmit={handleAddCard} className="add-card-form glass-panel animate-fade-in">
            {formError && <div className="form-error">{formError}</div>}
            
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Vocabulary *</label>
                <input 
                  type="text" 
                  value={newTerm} 
                  onChange={(e) => setNewTerm(e.target.value)} 
                  className="glass-input" 
                  placeholder="e.g. Obfuscate"
                  autoFocus
                />
              </div>
              <div className="form-group flex-1">
                <label>Meaning *</label>
                <input 
                  type="text" 
                  value={newDefinition} 
                  onChange={(e) => setNewDefinition(e.target.value)} 
                  className="glass-input" 
                  placeholder="e.g. Làm mờ mịt, khó hiểu"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Phonetic (Optional)</label>
                <input 
                  type="text" 
                  value={phonetic} 
                  onChange={(e) => setPhonetic(e.target.value)} 
                  className="glass-input" 
                  placeholder="e.g. /əbˈfʌs.keɪt/"
                />
              </div>
              <div className="form-group flex-2">
                <label>Example Sentence (Optional)</label>
                <input 
                  type="text" 
                  value={example} 
                  onChange={(e) => setExample(e.target.value)} 
                  className="glass-input" 
                  placeholder="e.g. The company obfuscated the fact that they were losing money."
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary submit-btn" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Card'}
            </button>
          </form>
        )}

        <div className="cards-list">
          {flashcards.length === 0 && !isAdding && !isAiMode ? (
            <div className="empty-state glass-panel">
              <p>Bộ thẻ này chưa có từ vựng nào.</p>
              {isOwner && <button className="btn btn-primary" onClick={() => setIsAdding(true)}>Thêm thẻ đầu tiên</button>}
            </div>
          ) : (
            flashcards.map((card, index) => (
              <div key={card.id} className="list-card glass-panel" style={{ position: 'relative' }}>
                {editingCard === card.id ? (
                  <form onSubmit={(e) => handleEditCard(e, card.id)} style={{ width: '100%' }}>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <input 
                          type="text" 
                          value={editTerm} 
                          onChange={(e) => setEditTerm(e.target.value)} 
                          className="glass-input" 
                          placeholder="Vocabulary"
                          autoFocus
                        />
                      </div>
                      <div className="form-group flex-1">
                        <input 
                          type="text" 
                          value={editDefinition} 
                          onChange={(e) => setEditDefinition(e.target.value)} 
                          className="glass-input" 
                          placeholder="Meaning"
                        />
                      </div>
                    </div>
                    <div className="form-row" style={{ marginTop: '10px' }}>
                      <div className="form-group flex-1">
                        <input 
                          type="text" 
                          value={editPhonetic} 
                          onChange={(e) => setEditPhonetic(e.target.value)} 
                          className="glass-input" 
                          placeholder="Phonetic (Optional)"
                        />
                      </div>
                      <div className="form-group flex-2">
                        <input 
                          type="text" 
                          value={editExample} 
                          onChange={(e) => setEditExample(e.target.value)} 
                          className="glass-input" 
                          placeholder="Example Sentence (Optional)"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-glass" onClick={cancelEdit} disabled={editSubmitting}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="list-card-number">{index + 1}</div>
                    <div className="list-card-term">
                      <h4>
                        {card.vocabulary} 
                        <button onClick={() => speakWord(card.vocabulary)} style={{background:"none",border:"none",cursor:"pointer",fontSize:"16px",marginLeft:"5px"}} title="Nghe phát âm">🔊</button>
                      </h4>
                      {card.phonetic && <span className="phonetic">{card.phonetic}</span>}
                    </div>
                    <div className="list-card-divider"></div>
                    <div className="list-card-def">
                      <p>{card.meaning}</p>
                      {card.exampleSentence && <p className="example">"{card.exampleSentence}"</p>}
                    </div>
                    {isOwner && (
                      <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '10px' }}>
                        <button onClick={() => startEdit(card)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✏️</button>
                        <button onClick={() => handleDeleteCard(card.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e' }}>🗑️</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckDetails;