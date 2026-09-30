import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../api/axiosConfig';
import './CreateDeckModal.css';

const CreateDeckModal = ({ isOpen, onClose, onDeckCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Deck name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('http://localhost:8080/api/decks', {
        name: name,
        description: description
      });
      
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
      setError('Failed to create deck. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in">
        <h2>Create New Deck</h2>
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
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-glass" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateDeckModal;
