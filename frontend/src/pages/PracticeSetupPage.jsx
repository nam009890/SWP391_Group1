import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WeakVocabularyFilters, { DEFAULT_FILTERS } from '../components/WeakVocabularyFilters.jsx'
import { APP_CONFIG } from '../config/appConfig.js'
import { getWeakVocabularies, startFillBlankPractice } from '../services/weakVocabularyService.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

const METHODS = [
  ['FILL_BLANK', 'Aa', 'Điền từ theo ngữ cảnh', 'Điền từ phù hợp vào câu ví dụ.'],
  ['MULTIPLE_CHOICE', '✓', 'Chọn từ đúng', 'Chọn đáp án đúng theo ngữ cảnh.'],
  ['WORD_TO_MEANING', 'W→N', 'Từ → Nghĩa', 'Chọn nghĩa tiếng Việt phù hợp.'],
  ['MEANING_TO_WORD', 'N→W', 'Nghĩa → Từ', 'Gõ từ tiếng Anh tương ứng với nghĩa.'],
]

function apiFilters(keyword, filters) {
  const [masteryMin, masteryMax] = filters.masteryRange ? filters.masteryRange.split('-') : []
  return { keyword, cefrLevel: filters.cefrLevel || undefined, partOfSpeech: filters.partOfSpeech || undefined, masteryMin: masteryMin || undefined, masteryMax: masteryMax || undefined, sort: filters.sort }
}

export default function PracticeSetupPage() {
  const userId = APP_CONFIG.demoUserId
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [type, setType] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [meta, setMeta] = useState({ totalPages: 0, first: true, last: true })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const data = await getWeakVocabularies(userId, apiFilters(searchKeyword, appliedFilters), page)
        if (active) { setItems(data.items); setMeta(data); setError('') }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải từ yếu.'))
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [userId, searchKeyword, appliedFilters, page])

  const toggle = (id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id])
  const changeFilter = (event) => setPendingFilters({ ...pendingFilters, [event.target.name]: event.target.value })
  function search(event) { event.preventDefault(); setPage(0); setSearchKeyword(searchInput.trim()) }
  function applyFilters() { setPage(0); setAppliedFilters({ ...pendingFilters }) }
  function resetFilters() { setSearchInput(''); setSearchKeyword(''); setPendingFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); setPage(0) }

  async function start() {
    try {
      setBusy(true)
      const session = await startFillBlankPractice(userId, type, selectedIds)
      navigate(`/weak-vocabulary/practice/${session.sessionId}`)
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Không thể tạo phiên ôn luyện.')) } finally { setBusy(false) }
  }

  return <main>
    <div className="page-heading"><div><h1>Thiết lập ôn luyện</h1><p>Chọn phương thức và các từ muốn ôn.</p></div><span className="selected-count">Đã chọn {selectedIds.length} từ</span></div>
    {error && <p role="alert" className="error-message">{error}</p>}
    <section className="card"><h2>Phương thức luyện tập</h2><div className="method-grid">{METHODS.map(([id, icon, title, description]) => <label key={id} className={`method-card ${type === id ? 'method-card--selected' : ''}`}><input className="visually-hidden" type="radio" name="type" checked={type === id} onChange={() => setType(id)} /><span className="method-icon">{icon}</span><span><strong>{title}</strong><small>{description}</small></span><span className="method-check" aria-hidden="true">✓</span></label>)}</div></section>
    <section className="card"><h2>Chọn từ để luyện</h2><form className="filter-toolbar" onSubmit={search}><div className="search-row"><input placeholder="Tìm kiếm từ yếu..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><button className="btn-primary" type="submit">Tìm kiếm</button></div><WeakVocabularyFilters filters={pendingFilters} onChange={changeFilter} includeAccuracy={false} /><div className="toolbar-actions"><button className="btn-primary" type="button" onClick={applyFilters}>Áp dụng</button><button type="button" onClick={resetFilters}>Đặt lại</button>{loading && <span className="loading-note">Đang tải…</span>}</div></form>
      <div className="selection-list">{items.map((item) => <label key={item.userVocabularyId} className="selection-row"><input type="checkbox" checked={selectedIds.includes(item.userVocabularyId)} onChange={() => toggle(item.userVocabularyId)} /><span><strong>{item.word}</strong> — {item.meaningVi}</span><small>{item.cefrLevel || '—'} · {item.partOfSpeech || '—'}</small></label>)}</div>
      {!loading && items.length === 0 && <p>Không tìm thấy từ phù hợp với bộ lọc hiện tại.</p>}
      {meta.totalPages > 1 && <nav className="pagination" aria-label="Phân trang"><button disabled={meta.first} onClick={() => setPage(page - 1)}>← Trước</button>{Array.from({ length: meta.totalPages }, (_, index) => <button key={index} className={index === page ? 'active-page' : ''} onClick={() => setPage(index)}>{index + 1}</button>)}<button disabled={meta.last} onClick={() => setPage(page + 1)}>Sau →</button></nav>}
    </section>
    <button className="btn-primary start-practice" disabled={!type || !selectedIds.length || busy} onClick={start}>{busy ? 'Đang tạo phiên…' : `Bắt đầu ôn ${selectedIds.length} từ`}</button>
  </main>
}
