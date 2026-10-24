import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { saveDeck } from '../api/deckApi';
import './CreateDeckModal.css';

const CreateDeckModal = ({ isOpen, onClose, onDeckCreated, deck = null }) => {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [visibility, setVisibility] = useState(deck?.visibility || 'PRIVATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (!name.trim()) {
      setError('Deck name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await saveDeck({ name: name.trim(), description: description.trim(), visibility }, deck?.id);
      
      // Clear form
      setName('');
      setDescription('');
      
      // Notify parent
      if (onDeckCreated) {
        onDeckCreated(response.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create deck:', err);
      setError(err.response?.data?.message || 'Failed to save deck. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="deck-modal-title" onKeyDown={e => { if (e.key === 'Escape' && !loading) onClose(); }}>
        <h2 id="deck-modal-title">{deck ? 'Edit Deck' : 'Create New Deck'}</h2>
        <p className="modal-subtitle">Organize your flashcards into a new collection</p>
        
        {error && <div className="modal-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="deck-form">
          <div className="form-group">
            <label htmlFor="deckName">Deck Name</label>
            <input 
              type="text" 
              id="deckName" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TOEFL Vocabulary"
              className="glass-input"
              autoFocus
              required
              maxLength={255}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="deckDesc">Description (Optional)</label>
            <textarea 
              id="deckDesc" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you learning in this deck?"
              className="glass-input textarea"
              rows="3"
              maxLength={5000}
            />
          </div>
          <div className="form-group"><label htmlFor="deckVisibility">Visibility</label><select className="glass-input" id="deckVisibility" value={visibility} onChange={e => setVisibility(e.target.value)}><option value="PRIVATE">Private — only you</option><option value="PUBLIC">Public — everyone can learn</option></select></div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-glass" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : deck ? 'Save Changes' : 'Create Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateDeckModal;
