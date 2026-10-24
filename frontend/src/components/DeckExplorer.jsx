import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listDecks, setDeckVisibility, deleteDeck } from '../api/deckApi';
import CreateDeckModal from './CreateDeckModal';
import './Dashboard.css';
import './DeckExplorer.css';

const sorts = [['NEWEST', 'Newest'], ['OLDEST', 'Oldest'], ['NAME_ASC', 'Name A–Z'], ['NAME_DESC', 'Name Z–A'], ['MOST_FLASHCARDS', 'Most flashcards']];

function DeckCard({ deck, mine, busy, onEdit, onVisibility, onDelete }) {
  return <article className="deck-card glass-panel explorer-card"><div className="deck-card-content">
    <div className="explorer-card-meta"><span className={`visibility-badge ${deck.visibility.toLowerCase()}`}>{deck.visibility}</span><span>{deck.flashcardCount} cards</span></div>
    <h3><Link to={`/deck/${deck.id}`}>{deck.name}</Link></h3>
    <p className="explorer-description">{deck.description || 'A vocabulary collection ready to explore.'}</p>
    <small className="explorer-author">By {deck.ownerName || 'Community'}{mine && deck.createdAt ? ` · ${new Date(deck.createdAt).toLocaleDateString()}` : ''}</small>
    <div className="explorer-actions"><Link className="btn btn-glass" to={`/deck/${deck.id}`}>View Deck</Link><Link className="btn btn-primary" to={`/study/${deck.id}`}>Study Now →</Link></div>
    {mine && <div className="explorer-manage"><button disabled={busy} onClick={() => onEdit(deck)}>Edit</button><button disabled={busy} onClick={() => onVisibility(deck)}>{deck.visibility === 'PUBLIC' ? 'Unpublish' : 'Publish'}</button><button className="delete-link" disabled={busy} onClick={() => onDelete(deck)}>Delete</button></div>}
  </div></article>;
}

export default function DeckExplorer({ user, mine = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('NEWEST');
  const [visibility, setVisibility] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    listDecks(mine, { keyword, sort, page, size, ...(mine && visibility ? { visibility } : {}) }, controller.signal)
      .then(({ data: result }) => {
        if (result.totalPages > 0 && page >= result.totalPages) setPage(result.totalPages - 1);
        else setData(result);
      })
      .catch(err => { if (err.code !== 'ERR_CANCELED') setError('Could not load decks. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [mine, keyword, sort, visibility, page, size, revision]);
  const mutate = async (deck, remove = false) => {
    const action = remove ? 'Delete' : deck.visibility === 'PUBLIC' ? 'Unpublish' : 'Publish';
    if (!window.confirm(`${action} “${deck.name}”? ${remove ? 'Learning history will be preserved.' : action === 'Unpublish' ? 'Other learners will lose access to this deck.' : 'Everyone will be able to view and study this deck.'}`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (remove) await deleteDeck(deck.id);
      else await setDeckVisibility(deck.id, deck.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC');
      setNotice(`${action} successful.`); setRevision(r => r + 1);
    } catch { setError(`${action} failed. Please try again.`); }
    finally { setBusy(false); }
  };
  return <main className="dashboard-container animate-fade-in">
    <header className="dashboard-header"><div><span className="dashboard-kicker">STUDYE · {mine ? 'YOUR COLLECTIONS' : 'COMMUNITY LIBRARY'}</span><h1>{mine ? 'My Decks' : 'Explore Public Decks'}</h1><p className="subtitle">{mine ? 'Manage your personal flashcard collections.' : 'Discover and learn vocabulary from the community.'}</p><p className="explorer-welcome">{user ? `Welcome, ${user.name}. Make a little progress today.` : 'Browse freely and start learning. No account needed.'}</p></div>
      {mine ? <button className="btn btn-primary" onClick={() => setModal({})}>+ Create Deck</button> : <Link className="btn btn-primary" to={user ? '/my-decks' : '/login'}>{user ? 'Manage My Decks' : 'Login to Create Your Own Deck'}</Link>}
    </header>
    <form className="explorer-toolbar glass-panel" onSubmit={e => { e.preventDefault(); setKeyword(input.trim()); setPage(0); }}>
      <div className="explorer-search"><input aria-label="Search decks" value={input} onChange={e => setInput(e.target.value)} placeholder="Search deck names or descriptions…"/><button className="btn btn-primary">Search</button></div>
      {mine && <label>Visibility<select value={visibility} onChange={e => { setVisibility(e.target.value); setPage(0); }}><option value="">All</option><option value="PUBLIC">Public</option><option value="PRIVATE">Private</option></select></label>}
      <label>Sort by<select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}>{sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Per page<select value={size} onChange={e => { setSize(Number(e.target.value)); setPage(0); }}>{[6, 12, 24].map(n => <option key={n}>{n}</option>)}</select></label>
    </form>
    {notice && <p className="explorer-notice" role="status">{notice}</p>}
    {error && <div className="explorer-error" role="alert">{error} <button className="btn btn-glass" onClick={() => setRevision(r => r + 1)}>Retry</button></div>}
    <section aria-label="Deck collections" aria-busy={loading}>
      {loading && !data ? <div className="decks-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="deck-skeleton glass-panel"><i/><i/><i/></div>)}</div> : data?.content.length ? <>
        <p className="explorer-result" role="status">{loading ? 'Updating…' : `${data.totalElements} decks found`}</p>
        <div className="decks-grid">{data.content.map(deck => <DeckCard key={deck.id} deck={deck} mine={mine} busy={busy || loading} onEdit={setModal} onVisibility={mutate} onDelete={deck => mutate(deck, true)}/>)}</div>
      </> : !loading && !error && <div className="explorer-empty glass-panel"><h2>{keyword || visibility ? 'No matching decks' : mine ? 'Your first deck starts here' : 'No public decks yet'}</h2><p>{keyword || visibility ? 'Try a different keyword or clear the filters.' : mine ? 'Create a private collection and publish it whenever you are ready.' : 'Check back soon for new collections.'}</p>{keyword || visibility ? <button className="btn btn-glass" onClick={() => { setInput(''); setKeyword(''); setVisibility(''); setPage(0); }}>Clear filters</button> : mine && <button className="btn btn-primary" onClick={() => setModal({})}>Create Deck</button>}</div>}
      {data && data.totalPages > 0 && <nav className="explorer-pagination" aria-label="Deck pages"><button className="btn btn-glass" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>← Previous</button><span>Page {page + 1} of {data.totalPages}</span><button className="btn btn-glass" disabled={data.last || loading} onClick={() => setPage(p => p + 1)}>Next →</button></nav>}
    </section>
    {modal && <CreateDeckModal isOpen onClose={() => setModal(null)} deck={modal.id ? modal : null} onDeckCreated={deck => { if (modal.id) { setRevision(r => r + 1); setNotice('Deck updated.'); } else navigate(`/deck/${deck.id}`); }}/>} 
  </main>;
}
