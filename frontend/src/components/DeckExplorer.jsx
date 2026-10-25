import { t, localizeMessage, locale } from '../i18n/index.js';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listDecks, setDeckVisibility, deleteDeck } from '../api/deckApi';
import CreateDeckModal from './CreateDeckModal';
import './Dashboard.css';
import './DeckExplorer.css';

const sorts = () => ([['NEWEST', 'Newest'], ['OLDEST', 'Oldest'], ['NAME_ASC', t('decks:name_a_z_5d3eb2')], ['NAME_DESC', t('decks:name_z_a_080ec6')], ['MOST_FLASHCARDS', t('decks:most_flashcards_c4648a')]]);

function DeckCard({ deck, mine, busy, onEdit, onVisibility, onDelete }) {
  return <article className="deck-card glass-panel explorer-card"><div className="deck-card-content">
    <div className="explorer-card-meta"><span className={`visibility-badge ${deck.visibility.toLowerCase()}`}>{t(deck.visibility === 'PUBLIC' ? 'decks:public_dc5eb7' : 'decks:private_237dfa')}</span><span>{deck.flashcardCount} {t('decks:cards_c8d375')} </span></div>
    <h3><Link to={`/deck/${deck.id}`}>{deck.name}</Link></h3>
    <p className="explorer-description">{deck.description || t('decks:a_vocabulary_collection_ready_to_explore_86911f')}</p>
    <small className="explorer-author"> {t('decks:by_cfadbd')} {deck.ownerName || t('common:community')}{mine && deck.createdAt ? ` · ${new Date(deck.createdAt).toLocaleDateString(locale())}` : ''}</small>
    <div className="explorer-actions"><Link className="btn btn-glass" to={`/deck/${deck.id}`}> {t('decks:view_deck_177f78')} </Link><Link className="btn btn-primary" to={`/study/${deck.id}`}> {t('decks:study_now_e5bd1a')} </Link></div>
    {mine && <div className="explorer-manage"><button disabled={busy} onClick={() => onEdit(deck)}> {t('decks:edit_530164')} </button><button disabled={busy} onClick={() => onVisibility(deck)}>{deck.visibility === 'PUBLIC' ? t('common:unpublish') : t('common:publish')}</button><button className="delete-link" disabled={busy} onClick={() => onDelete(deck)}> {t('decks:delete_f6fdbe')} </button></div>}
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
      .catch(err => { if (err.code !== 'ERR_CANCELED') setError(t('decks:could_not_load_decks_please_try_again_ae32c1')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [mine, keyword, sort, visibility, page, size, revision]);
  const mutate = async (deck, remove = false) => {
    const action = remove ? 'Delete' : deck.visibility === 'PUBLIC' ? 'Unpublish' : 'Publish';
    if (!window.confirm(`${t('common:' + action.toLowerCase())} “${deck.name}”? ${remove ? t('decks:learning_history_will_be_preserved_a12b8e') : action === 'Unpublish' ? t('decks:other_learners_will_lose_access_to_this__3adaba') : t('decks:everyone_will_be_able_to_view_and_study__eca14b')}`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (remove) await deleteDeck(deck.id);
      else await setDeckVisibility(deck.id, deck.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC');
      setNotice(t('common:action_success', { action: t('common:' + action.toLowerCase()) })); setRevision(r => r + 1);
    } catch { setError(t('common:action_failed', { action: t('common:' + action.toLowerCase()) })); }
    finally { setBusy(false); }
  };
  return <main className="dashboard-container animate-fade-in">
    <header className="dashboard-header"><div><span className="dashboard-kicker"> {t('decks:studye_2c2891')} {mine ? t('common:your_collections') : t('common:community_library')}</span><h1>{mine ? t('decks:my_decks_4f3291') : t('decks:explore_public_decks_fdb8e1')}</h1><p className="subtitle">{mine ? t('decks:manage_your_personal_flashcard_collectio_7e7256') : t('decks:discover_and_learn_vocabulary_from_the_c_9a2918')}</p><p className="explorer-welcome">{user ? t('common:welcome', { name: user.name }) : t('decks:browse_freely_and_start_learning_no_acco_e73731')}</p></div>
      {mine ? <button className="btn btn-primary" onClick={() => setModal({})}> {t('decks:create_deck_6a1c29')} </button> : <Link className="btn btn-primary" to={user ? '/my-decks' : '/login'}>{user ? t('decks:manage_my_decks_4d6aca') : t('decks:login_to_create_your_own_deck_3d6dd5')}</Link>}
    </header>
    <form className="explorer-toolbar glass-panel" onSubmit={e => { e.preventDefault(); setKeyword(input.trim()); setPage(0); }}>
      <div className="explorer-search"><input aria-label={t('decks:search_decks_430770')} value={input} onChange={e => setInput(e.target.value)} placeholder={t('decks:search_deck_names_or_descriptions_d444e6')}/><button className="btn btn-primary"> {t('decks:search_bce064')} </button></div>
      {mine && <label> {t('decks:visibility_7d9ff4')} <select value={visibility} onChange={e => { setVisibility(e.target.value); setPage(0); }}><option value=""> {t('decks:all_6a7208')} </option><option value="PUBLIC"> {t('decks:public_dc5eb7')} </option><option value="PRIVATE"> {t('decks:private_237dfa')} </option></select></label>}
      <label> {t('decks:sort_by_a2a5bd')} <select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}>{sorts().map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label> {t('decks:per_page_e9a138')} <select value={size} onChange={e => { setSize(Number(e.target.value)); setPage(0); }}>{[6, 12, 24].map(n => <option key={n}>{n}</option>)}</select></label>
    </form>
    {notice && <p className="explorer-notice" role="status">{notice}</p>}
    {error && <div className="explorer-error" role="alert">{localizeMessage(error)} <button className="btn btn-glass" onClick={() => setRevision(r => r + 1)}> {t('decks:retry_9f5cd8')} </button></div>}
    <section aria-label={t('decks:deck_collections_dd4eb6')} aria-busy={loading}>
      {loading && !data ? <div className="decks-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="deck-skeleton glass-panel"><i/><i/><i/></div>)}</div> : data?.content.length ? <>
        <p className="explorer-result" role="status">{loading ? t('decks:updating_3ab0d7') : t('common:decks_found', { count: data.totalElements })}</p>
        <div className="decks-grid">{data.content.map(deck => <DeckCard key={deck.id} deck={deck} mine={mine} busy={busy || loading} onEdit={setModal} onVisibility={mutate} onDelete={deck => mutate(deck, true)}/>)}</div>
      </> : !loading && !error && <div className="explorer-empty glass-panel"><h2>{keyword || visibility ? t('decks:no_matching_decks_84baf5') : mine ? t('decks:your_first_deck_starts_here_f69149') : t('decks:no_public_decks_yet_cc4506')}</h2><p>{keyword || visibility ? t('decks:try_a_different_keyword_or_clear_the_fil_5545ba') : mine ? t('decks:create_a_private_collection_and_publish__f45389') : t('decks:check_back_soon_for_new_collections_7ef2e8')}</p>{keyword || visibility ? <button className="btn btn-glass" onClick={() => { setInput(''); setKeyword(''); setVisibility(''); setPage(0); }}> {t('decks:clear_filters_412226')} </button> : mine && <button className="btn btn-primary" onClick={() => setModal({})}> {t('decks:create_deck_140803')} </button>}</div>}
      {data && data.totalPages > 0 && <nav className="explorer-pagination" aria-label={t('decks:deck_pages_d0f734')}><button className="btn btn-glass" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}> {t('decks:previous_471492')} </button><span> {t('decks:page_fb0627')} {page + 1} {t('decks:of_de04fa')} {data.totalPages}</span><button className="btn btn-glass" disabled={data.last || loading} onClick={() => setPage(p => p + 1)}> {t('decks:next_2f04eb')} </button></nav>}
    </section>
    {modal && <CreateDeckModal isOpen onClose={() => setModal(null)} deck={modal.id ? modal : null} onDeckCreated={deck => { if (modal.id) { setRevision(r => r + 1); setNotice('Deck updated.'); } else navigate(`/deck/${deck.id}`); }}/>} 
  </main>;
}
