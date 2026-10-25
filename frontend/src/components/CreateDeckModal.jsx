import { t , localizeMessage } from '../i18n/index.js';
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { saveDeck } from '../api/deckApi';
import './CreateDeckModal.css';

const CreateDeckModal = ({ isOpen, onClose, onDeckCreated, deck = null }) => {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [visibility, setVisibility] = useState(deck?.visibility || 'PRIVATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dialog = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector('input')?.focus();
    const trap = event => {
      if (event.key === 'Escape' && !loading) onClose();
      if (event.key !== 'Tab') return;
      const elements = [...dialog.current.querySelectorAll('button:not(:disabled), input, select, textarea')];
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); document.body.style.overflow = overflow; previous?.focus(); };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (!name.trim()) {
      setError(t('decks:deck_name_is_required_e15dec'));
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
      setError(err.response?.data?.message || t('decks:failed_to_save_deck_please_try_again_9d0db1'));
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay deck-modal-overlay">
      <div ref={dialog} className="modal-content deck-modal-content glass-panel animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="deck-modal-title">
        <LanguageSwitcher />
        <h2 id="deck-modal-title">{deck ? t('decks:edit_deck_e7bb8d') : t('decks:create_new_deck_fd6a43')}</h2>
        <p className="modal-subtitle"> {t('decks:organize_your_flashcards_into_a_new_coll_021680')} </p>
        
        {error && <div className="modal-error">{localizeMessage(error)}</div>}
        
        <form onSubmit={handleSubmit} className="deck-form">
          <div className="form-group">
            <label htmlFor="deckName"> {t('decks:deck_name_b1fce3')} </label>
            <input 
              type="text" 
              id="deckName" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('decks:e_g_toefl_vocabulary_f4faa0')}
              className="glass-input"
              autoFocus
              required
              maxLength={255}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="deckDesc"> {t('decks:description_optional_f1da5c')} </label>
            <textarea 
              id="deckDesc" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('decks:what_are_you_learning_in_this_deck_bb88ee')}
              className="glass-input textarea"
              rows="3"
              maxLength={5000}
            />
          </div>
          <div className="form-group"><label htmlFor="deckVisibility"> {t('decks:visibility_7d9ff4')} </label><select className="glass-input" id="deckVisibility" value={visibility} onChange={e => setVisibility(e.target.value)}><option value="PRIVATE"> {t('decks:private_only_you_b3589b')} </option><option value="PUBLIC"> {t('decks:public_everyone_can_learn_e1da98')} </option></select></div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-glass" onClick={onClose} disabled={loading}> {t('decks:cancel_77dfd2')} </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('common:saving') : deck ? t('decks:save_changes_fa2984') : t('decks:create_deck_140803')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateDeckModal;
