import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWeakPracticeSession, getWeakVocabularies } from '../api/weakVocabularyApi';
import WeakVocabularyFilters, { defaultWeakFilters } from './WeakVocabularyFilters';
import './WeakVocabulary.css';
const methods = [['FILL_BLANK', 'Điền từ theo ngữ cảnh'], ['MULTIPLE_CHOICE', 'Chọn từ đúng'], ['WORD_TO_MEANING', 'Từ → Nghĩa'], ['MEANING_TO_WORD', 'Nghĩa → Từ']];

export default function WeakPracticeSetup() {
  const navigate = useNavigate();
  const [questionType, setQuestionType] = useState('');
  const [data, setData] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pending, setPending] = useState(defaultWeakFilters);
  const [applied, setApplied] = useState(defaultWeakFilters);
  const [page, setPage] = useState(0);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const load = async (nextPage = page) => {
    try { const response = await getWeakVocabularies({ ...applied, keyword, page: nextPage, size: 10 }); setData(response.data); setPage(nextPage); setError(''); }
    catch { setError('Không thể tải danh sách từ yếu để ôn luyện.'); }
  };
  useEffect(() => { load(0); }, [keyword, applied]);
  const toggle = (id) => setSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const currentIds = data?.items.map((item) => item.weakVocabularyId) || [];
  const allCurrentSelected = currentIds.length > 0 && currentIds.every((id) => selectedIds.has(id));
  const toggleCurrentPage = () => setSelectedIds((current) => { const next = new Set(current); if (allCurrentSelected) currentIds.forEach((id) => next.delete(id)); else currentIds.forEach((id) => next.add(id)); return next; });
  const reset = () => { setInput(''); setKeyword(''); setPending(defaultWeakFilters); setApplied(defaultWeakFilters); setPage(0); };
  const start = async () => {
    setStarting(true); setError('');
    try { const response = await createWeakPracticeSession({ questionType, weakVocabularyIds: Array.from(selectedIds) }); navigate(`/weak-vocabulary/practice/${response.data.sessionId}`); }
    catch { setError('Không thể tạo phiên ôn luyện. Vui lòng kiểm tra lại các từ đã chọn.'); setStarting(false); }
  };
  return <main className="weak-page animate-fade-in"><section className="weak-head"><div><h1>Ôn luyện từ yếu</h1><p>Chọn phương thức và các từ muốn luyện.</p></div><span className="selected-count">Đã chọn {selectedIds.size} từ</span></section><section className="weak-grid setup">{methods.map(([value, label]) => <button key={value} className={`glass-panel method ${questionType === value ? 'selected' : ''}`} onClick={() => setQuestionType(value)}><b>{questionType === value ? '✓ ' : ''}{label}</b></button>)}</section><WeakVocabularyFilters input={input} onInputChange={setInput} onSearch={() => setKeyword(input)} pending={pending} onPendingChange={setPending} onApply={() => { setApplied({ ...pending }); setPage(0); }} onReset={reset} />{error && <div className="weak-error">{error}</div>}<section className="glass-panel choices"><div className="choice-head"><h2>Chọn từ yếu</h2><div><button className="btn btn-glass" onClick={toggleCurrentPage}>{allCurrentSelected ? 'Bỏ chọn trang này' : 'Chọn tất cả trang này'}</button><button className="btn btn-glass" onClick={() => setSelectedIds(new Set())} disabled={!selectedIds.size}>Bỏ chọn tất cả</button></div></div>{!data ? <p>Đang tải...</p> : data.items.map((word) => <label className="choice-row" key={word.weakVocabularyId}><input type="checkbox" checked={selectedIds.has(word.weakVocabularyId)} onChange={() => toggle(word.weakVocabularyId)} /><span><b>{word.vocabulary}</b> — {word.meaning}</span></label>)}{data && !data.items.length && <p>Không tìm thấy từ phù hợp.</p>}<div className="pager"><button disabled={!data || data.first} onClick={() => load(page - 1)}>← Trước</button><span>{data ? `Trang ${data.page + 1} / ${Math.max(data.totalPages, 1)}` : ''}</span><button disabled={!data || data.last} onClick={() => load(page + 1)}>Sau →</button></div></section><button className="btn btn-primary start-practice" disabled={!questionType || !selectedIds.size || starting} onClick={start}>{starting ? 'Đang tạo phiên...' : 'Bắt đầu luyện tập'}</button></main>;
}
