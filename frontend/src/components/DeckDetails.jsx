import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDeck, getDeckCards } from '../api/deckApi';
import { setDeckVisibility } from '../api/deckApi';
import CreateDeckModal from './CreateDeckModal';
import api from '../api/axiosConfig';
import { addWeakVocabulary, getWeakVocabularies } from '../api/weakVocabularyApi';
import './DeckDetails.css';
import './DeckExplorer.css';

const DeckDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [deck, setDeck] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New Card Form State
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [example, setExample] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // AI Generation State
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [weakAdded, setWeakAdded] = useState({});
  const [editing, setEditing] = useState(false);
  const [managing, setManaging] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setDeck(null); setFlashcards([]); setWeakAdded({});
    setLoadError('');
    setIsAdding(false); setIsAiMode(false);
    const fetchDeckData = async () => {
      try {
        const [deckRes, cardsRes, weakRes] = await Promise.all([
          getDeck(id, Boolean(user), controller.signal),
          getDeckCards(id, Boolean(user), controller.signal),
          user ? getWeakVocabularies({ deckId: id, page: 0, size: 100 })
            .catch(() => ({ data: { items: [] } })) : Promise.resolve({ data: { items: [] } })
        ]);
        if (controller.signal.aborted) return;
        setDeck(deckRes.data);
        setFlashcards(cardsRes.data);
        setWeakAdded(Object.fromEntries(
          weakRes.data.items.map((item) => [item.flashcardId, true])
        ));
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error.response?.status === 404 ? 'Deck not found or unavailable.' : 'Could not load this deck. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    
    fetchDeckData();
    return () => controller.abort();
  }, [id, user, revision]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) {
      setFormError('Term and Definition are required.');
      return;
    }
    
    setSubmitting(true);
    setFormError('');
    
    try {
      const response = await api.post(`/decks/${id}/flashcards`, {
        vocabulary: term,
        meaning: definition,
        phonetic: phonetic,
        exampleSentence: example
      });
      
      setFlashcards([...flashcards, response.data]);
      
      // Reset form
      setTerm('');
      setDefinition('');
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
      setAiError('Please enter a topic to generate flashcards.');
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
      setAiError('Could not generate flashcards. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="details-container animate-fade-in" style={{ justifyContent: 'center' }}>
        <h2>Loading deck...</h2>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="details-container animate-fade-in" style={{ justifyContent: 'center' }}>
        <h2>{loadError || 'Deck not found'}</h2>
        <button className="btn btn-glass" onClick={() => setRevision(r => r + 1)}>Retry</button>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="details-container animate-fade-in">
      <div className="details-header">
        <button className="btn btn-glass back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <div className="deck-info">
          <h1>{deck.name}</h1>
          {deck.description && <p className="deck-desc">{deck.description}</p>}
          <span className="card-count-badge">{flashcards.length} terms</span>
          <p className="deck-desc">{deck.visibility} · By {deck.ownerName || 'Community'}</p>
        </div>
        <button 
          className="btn btn-primary study-btn-large" 
          onClick={() => navigate(`/study/${id}`)}
          disabled={flashcards.length === 0}
        >
          Study Now
        </button>
      </div>

      {!user && <p className="deck-guest-note"><Link to="/login" state={{ from: `/deck/${id}` }}>Log in</Link> to save your learning progress and create your own flashcards.</p>}
      {deck.isOwner && <div className="explorer-manage"><button disabled={managing} onClick={() => setEditing(true)}>Edit Deck</button><button disabled={managing} onClick={async () => {
        const visibility = deck.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
        if (!window.confirm(visibility === 'PRIVATE' ? 'Unpublish this deck? Other learners will lose access.' : 'Publish this deck for everyone to learn?')) return;
        setManaging(true);
        try { const response = await setDeckVisibility(id, visibility); setDeck(response.data); setFormError(''); }
        catch { setFormError('Could not update visibility. Please try again.'); }
        finally { setManaging(false); }
      }}>{deck.visibility === 'PUBLIC' ? 'Unpublish Deck' : 'Publish Deck'}</button></div>}
      {editing && <CreateDeckModal isOpen deck={deck} onClose={() => setEditing(false)} onDeckCreated={setDeck} />}
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="cards-section">
        <div className="section-header">
          <h2>Terms in this set</h2>
          {deck.isOwner && <div className="header-actions">
            <button 
              className={`btn ${isAiMode ? 'btn-glass' : 'btn-ai'}`} 
              onClick={() => {
                setIsAiMode(!isAiMode);
                setIsAdding(false);
              }}
            >
              {isAiMode ? 'Cancel' : 'Generate with AI'}
            </button>
            <button 
              className="btn btn-glass" 
              onClick={() => {
                setIsAdding(!isAdding);
                setIsAiMode(false);
              }}
            >
              {isAdding ? 'Cancel' : '+ Add Card'}
            </button>
          </div>}
        </div>
        
        {deck.isOwner && isAiMode && (
          <form onSubmit={handleGenerateAi} className="add-card-form ai-form glass-panel animate-fade-in">
            <h3 style={{ background: 'linear-gradient(90deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Generate flashcards with AI
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Choose a topic, such as travel vocabulary or 10 useful words for work.
            </p>
            {aiError && <div className="form-error">{aiError}</div>}
            
            <div className="form-row">
              <div className="form-group flex-1">
                <input 
                  type="text" 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)} 
                  className="glass-input" 
                  placeholder="What would you like to learn?"
                  autoFocus
                  disabled={isAiGenerating}
                />
              </div>
              <button type="submit" className="btn btn-ai" disabled={isAiGenerating}>
                {isAiGenerating ? (
                  <span className="loading-dots">Generating...</span>
                ) : 'Generate Cards'}
              </button>
            </div>
          </form>
        )}

        {deck.isOwner && isAdding && (
          <form onSubmit={handleAddCard} className="add-card-form glass-panel animate-fade-in">
            <h3>Add a New Card</h3>
            {formError && <div className="form-error">{formError}</div>}
            
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Term (Vocabulary) *</label>
                <input 
                  type="text" 
                  value={term} 
                  onChange={(e) => setTerm(e.target.value)} 
                  className="glass-input" 
                  placeholder="e.g. Obfuscate"
                  autoFocus
                />
              </div>
              <div className="form-group flex-1">
                <label>Definition (Meaning) *</label>
                <input 
                  type="text" 
                  value={definition} 
                  onChange={(e) => setDefinition(e.target.value)} 
                  className="glass-input" 
                  placeholder="e.g. Make obscure, unclear, or unintelligible"
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
                  placeholder="e.g. The spelling changes will obfuscate the original intent."
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Card'}
              </button>
            </div>
          </form>
        )}

        <div className="cards-list">
          {flashcards.length === 0 && !isAdding ? (
            <div className="empty-state glass-panel">
              <p>This deck has no cards yet.</p>
              {deck.isOwner && <button className="btn btn-primary" onClick={() => setIsAdding(true)}>Add your first card</button>}
            </div>
          ) : (
            flashcards.map((card, index) => (
              <div key={card.id} className="list-card glass-panel">
                <div className="list-card-number">{index + 1}</div>
                <div className="list-card-term">
                  <h4>{card.vocabulary}</h4>
                  {card.phonetic && <span className="phonetic">{card.phonetic}</span>}
                </div>
                <div className="list-card-divider"></div>
                <div className="list-card-def">
                  <p>{card.meaning}</p>
                  {card.exampleSentence && <p className="example">"{card.exampleSentence}"</p>}
                </div>
                {user && !weakAdded[card.id] && (
                  <button className="btn btn-glass" onClick={async () => {
                    try {
                      await addWeakVocabulary(card.id);
                      setWeakAdded((current) => ({ ...current, [card.id]: true }));
                      setFormError('');
                    } catch { setFormError('Could not add weak vocabulary. Please try again.'); }
                  }}>
                    Add to weak vocabulary
                  </button>
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
