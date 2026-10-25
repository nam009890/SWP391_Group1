import { t } from '../i18n/index.js';
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDeck, getDeckCards } from '../api/deckApi';
import { setDeckVisibility } from '../api/deckApi';
import CreateDeckModal from './CreateDeckModal';
import api from '../api/axiosConfig';
import { addWeakVocabulary, getWeakVocabularies } from '../api/weakVocabularyApi';
import './DeckDetails.css';
import './DeckExplorer.css';

const AiFlashcardGenerator = lazy(() => import('./ai/AiFlashcardGenerator'));

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
  const [aiSuccess, setAiSuccess] = useState('');
  const [aiSaving, setAiSaving] = useState(false);
  const [weakAdded, setWeakAdded] = useState({});
  const [editing, setEditing] = useState(false);
  const [managing, setManaging] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setDeck(null); setFlashcards([]); setWeakAdded({});
    setLoadError('');
    setIsAdding(false); setIsAiMode(false); setAiSuccess('');
    const fetchDeckData = async () => {
      try {
        const [deckRes, cardsRes, weakRes] = await Promise.all([
          getDeck(id, Boolean(user?.id), controller.signal),
          getDeckCards(id, Boolean(user?.id), controller.signal),
          user?.id ? getWeakVocabularies({ deckId: id, page: 0, size: 100 }, controller.signal)
            .catch(() => ({ data: { items: [] } })) : Promise.resolve({ data: { items: [] } })
        ]);
        if (controller.signal.aborted) return;
        setDeck(deckRes.data);
        setFlashcards(cardsRes.data);
        setWeakAdded(Object.fromEntries(
          weakRes.data.items.map((item) => [item.flashcardId, true])
        ));
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error.response?.status === 404 ? t('decks:deck_not_found_or_unavailable_d4f4fe') : t('decks:could_not_load_this_deck_please_try_agai_f705f0'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    
    fetchDeckData();
    return () => controller.abort();
  }, [id, user?.id, user?.role, revision]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) {
      setFormError(t('decks:term_and_definition_are_required_3d2436'));
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
      setFormError(err.response?.data?.message || t('decks:failed_to_save_the_card_please_try_again_8d5a9b'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="details-container animate-fade-in" style={{ justifyContent: 'center' }}>
        <h2> {t('decks:loading_deck_4da96d')} </h2>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="details-container animate-fade-in" style={{ justifyContent: 'center' }}>
        <h2>{loadError || t('decks:deck_not_found_0a62b5')}</h2>
        <button className="btn btn-glass" onClick={() => setRevision(r => r + 1)}> {t('decks:retry_9f5cd8')} </button>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}> {t('decks:back_to_dashboard_8fb719')} </button>
      </div>
    );
  }

  return (
    <div className="details-container animate-fade-in">
      <div className="details-header">
        <button className="btn btn-glass back-btn" onClick={() => navigate('/')}> {t('decks:back_c32ae9')} </button>
        <div className="deck-info">
          <h1>{deck.name}</h1>
          {deck.description && <p className="deck-desc">{deck.description}</p>}
          <span className="card-count-badge">{flashcards.length} {t('decks:terms_ce620d')} </span>
          <p className="deck-desc">{deck.visibility} {t('decks:by_dd4394')} {deck.ownerName || 'Community'}</p>
        </div>
        <button 
          className="btn btn-primary study-btn-large" 
          onClick={() => navigate(`/study/${id}`)}
          disabled={flashcards.length === 0}
        > {t('decks:study_now_ba15d1')} </button>
      </div>

      {!user && <p className="deck-guest-note"><Link to="/login" state={{ from: `/deck/${id}` }}> {t('decks:log_in_f7c400')} </Link> {t('decks:to_save_your_learning_progress_and_creat_8f70b4')} </p>}
      {deck.isOwner && <div className="explorer-manage"><button disabled={managing} onClick={() => setEditing(true)}> {t('decks:edit_deck_e7bb8d')} </button><button disabled={managing} onClick={async () => {
        const visibility = deck.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
        if (!window.confirm(visibility === 'PRIVATE' ? 'Unpublish this deck? Other learners will lose access.' : 'Publish this deck for everyone to learn?')) return;
        setManaging(true);
        try { const response = await setDeckVisibility(id, visibility); setDeck(response.data); setFormError(''); }
        catch { setFormError('Could not update visibility. Please try again.'); }
        finally { setManaging(false); }
      }}>{deck.visibility === 'PUBLIC' ? t('decks:unpublish_deck_b31308') : t('decks:publish_deck_85d6b1')}</button></div>}
      {editing && <CreateDeckModal isOpen deck={deck} onClose={() => setEditing(false)} onDeckCreated={setDeck} />}
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="cards-section">
        <div className="section-header">
          <h2> {t('decks:terms_in_this_set_5dfe86')} </h2>
          {deck.isOwner && <div className="header-actions">
            <button 
              className={`btn ${isAiMode ? 'btn-glass' : 'btn-ai'}`} 
              disabled={aiSaving}
              onClick={() => {
                setIsAiMode(!isAiMode);
                setIsAdding(false);
              }}
            >
              {isAiMode ? t('common:cancel') : t('decks:generate_with_ai_d517b5')}
            </button>
            <button 
              className="btn btn-glass" 
              disabled={aiSaving}
              onClick={() => {
                setIsAdding(!isAdding);
                setIsAiMode(false);
              }}
            >
              {isAdding ? t('common:cancel') : t('decks:add_card_af7e5b')}
            </button>
          </div>}
        </div>
        
        {aiSuccess && <p className="account-success" role="status">{aiSuccess}</p>}
        {deck.isOwner && isAiMode && <Suspense fallback={<p role="status">{t('decks:loading_deck_4da96d')}</p>}><AiFlashcardGenerator key={id} deckId={id} onClose={() => setIsAiMode(false)} onSavingChange={setAiSaving} onSaved={result => {
          setFlashcards(current => Array.from(new Map([...current, ...result.cards].map(card => [card.id, card])).values()));
          setAiSuccess('Đã thêm ' + result.savedCount + ' thẻ vào Deck.');
          setIsAiMode(false);
        }} /></Suspense>}

        {deck.isOwner && isAdding && (
          <form onSubmit={handleAddCard} className="add-card-form glass-panel animate-fade-in">
            <h3> {t('decks:add_a_new_card_b67041')} </h3>
            {formError && <div className="form-error">{formError}</div>}
            
            <div className="form-row">
              <div className="form-group flex-1">
                <label> {t('decks:term_vocabulary_851fcf')} </label>
                <input 
                  type="text" 
                  value={term} 
                  onChange={(e) => setTerm(e.target.value)} 
                  className="glass-input" 
                  placeholder={t('decks:e_g_obfuscate_3cb3a0')}
                  autoFocus
                />
              </div>
              <div className="form-group flex-1">
                <label> {t('decks:definition_meaning_6d2ad9')} </label>
                <input 
                  type="text" 
                  value={definition} 
                  onChange={(e) => setDefinition(e.target.value)} 
                  className="glass-input" 
                  placeholder={t('decks:e_g_make_obscure_unclear_or_unintelligib_322f3a')}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group flex-1">
                <label> {t('decks:phonetic_optional_c93df1')} </label>
                <input 
                  type="text" 
                  value={phonetic} 
                  onChange={(e) => setPhonetic(e.target.value)} 
                  className="glass-input" 
                  placeholder={t('decks:e_g_b_f_s_ke_t_e4855b')}
                />
              </div>
              <div className="form-group flex-2">
                <label> {t('decks:example_sentence_optional_8a350a')} </label>
                <input 
                  type="text" 
                  value={example} 
                  onChange={(e) => setExample(e.target.value)} 
                  className="glass-input" 
                  placeholder={t('decks:e_g_the_spelling_changes_will_obfuscate__a1856a')}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? t('common:saving') : t('decks:save_card_5ea0d5')}
              </button>
            </div>
          </form>
        )}

        <div className="cards-list">
          {flashcards.length === 0 && !isAdding ? (
            <div className="empty-state glass-panel">
              <p> {t('decks:this_deck_has_no_cards_yet_106832')} </p>
              {deck.isOwner && <button className="btn btn-primary" disabled={aiSaving} onClick={() => setIsAdding(true)}> {t('decks:add_your_first_card_5f1a5e')} </button>}
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
                  }}> {t('decks:add_to_weak_vocabulary_cfba94')} </button>
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
