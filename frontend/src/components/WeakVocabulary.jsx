import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteWeakVocabulary, getWeakVocabularies, updateWeakVocabulary } from '../api/weakVocabularyApi';
import WeakVocabularyFilters, { defaultWeakFilters } from './WeakVocabularyFilters';
import './WeakVocabulary.css';

export default function WeakVocabulary() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pendingFilters, setPendingFilters] = useState(defaultWeakFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultWeakFilters);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      setError('');
      const response = await getWeakVocabularies({ ...appliedFilters, keyword, page: nextPage, size: 10 });
      setData(response.data);
      setPage(nextPage);
    } catch { setError('Không thể tải danh sách từ yếu.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(0); }, [keyword, appliedFilters]);
  const reset = () => { setInput(''); setKeyword(''); setPendingFilters(defaultWeakFilters); setAppliedFilters(defaultWeakFilters); setPage(0); };
  const editNote = async (word) => { const weakNote = window.prompt('Ghi chú', word.weakNote || ''); if (weakNote !== null) { await updateWeakVocabulary(word.weakVocabularyId, { weakNote }); load(); } };
  const filtered = keyword || JSON.stringify(appliedFilters) !== JSON.stringify(defaultWeakFilters);
  return <main className="weak-page animate-fade-in">
    <section className="weak-head"><div><h1>Từ cần ôn luyện</h1><p>Củng cố những từ bạn còn chưa tự tin.</p></div><button className="btn btn-primary" onClick={() => navigate('/weak-vocabulary/practice')}>Ôn luyện</button></section>
    <WeakVocabularyFilters input={input} onInputChange={setInput} onSearch={() => setKeyword(input)} pending={pendingFilters} onPendingChange={setPendingFilters} onApply={() => { setAppliedFilters({ ...pendingFilters }); setPage(0); }} onReset={reset} />
    {error && <div className="weak-error">{error} <button onClick={() => load()}>Thử lại</button></div>}
    {!data ? <p>Đang tải...</p> : <>{loading && <p className="weak-loading">Đang cập nhật...</p>}<div className="weak-grid">{data.items.map((word) => <article className="weak-card glass-panel" key={word.weakVocabularyId}><div className="word-row"><h2>{word.vocabulary}</h2><span>{word.manualMarked && word.autoDetected ? 'BOTH' : word.manualMarked ? 'MANUAL' : 'AUTO'}</span></div><em>{word.phonetic}</em><p>{word.meaning}</p><small>{word.exampleSentence}</small><div className="stats"><b>{word.masteryScore}% mastery</b><span>Đúng {word.correctCount} · Sai {word.wrongCount} · {word.accuracy}%</span></div><p className="reason">{word.weakReason}</p>{word.weakNote && <p className="note">{word.weakNote}</p>}<div className="card-actions"><button className="btn btn-glass" onClick={() => editNote(word)}>Sửa ghi chú</button><button className="btn btn-glass" onClick={() => navigate('/weak-vocabulary/practice')}>Ôn luyện</button><button className="btn danger" onClick={async () => { if (window.confirm('Xóa từ này khỏi danh sách?')) { await deleteWeakVocabulary(word.weakVocabularyId); load(); } }}>Xóa</button></div></article>)}</div>{!data.items.length && <div className="glass-panel empty">{filtered ? <>Không tìm thấy từ phù hợp với bộ lọc hiện tại. <button onClick={reset}>Đặt lại bộ lọc</button></> : 'Bạn chưa có từ nào cần ôn luyện.'}</div>}<div className="pager"><button disabled={data.first} onClick={() => load(page - 1)}>← Trước</button><span>Trang {data.page + 1} / {Math.max(data.totalPages, 1)} · {data.totalElements} từ</span><button disabled={data.last} onClick={() => load(page + 1)}>Sau →</button></div></>}
  </main>;
}
