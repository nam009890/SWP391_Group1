import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal.jsx'
import Toast from '../components/Toast.jsx'
import WeakVocabularyFilters, { DEFAULT_FILTERS } from '../components/WeakVocabularyFilters.jsx'
import WeakVocabularyItem from '../components/WeakVocabularyItem.jsx'
import { APP_CONFIG } from '../config/appConfig.js'
import { deleteWeakVocabulary, getWeakVocabularies, updateWeakVocabulary } from '../services/weakVocabularyService.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

function apiFilters(keyword, filters) {
  const [masteryMin, masteryMax] = filters.masteryRange ? filters.masteryRange.split('-') : []
  const [accuracyMin, accuracyMax] = filters.accuracyRange ? filters.accuracyRange.split('-') : []
  return { keyword, cefrLevel: filters.cefrLevel || undefined, partOfSpeech: filters.partOfSpeech || undefined, masteryMin: masteryMin || undefined, masteryMax: masteryMax || undefined, accuracyMin: accuracyMin || undefined, accuracyMax: accuracyMax || undefined, manualWeak: filters.manualWeak || undefined, sort: filters.sort }
}

export default function WeakVocabularyPage() {
  const navigate = useNavigate()
  const userId = APP_CONFIG.demoUserId
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [meta, setMeta] = useState({ page: 0, totalPages: 0, totalElements: 0, first: true, last: true })
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const data = await getWeakVocabularies(userId, apiFilters(searchKeyword, appliedFilters), page)
        if (active) { setItems(data.items); setMeta(data); setLoaded(true) }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách từ cần ôn.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [userId, searchKeyword, appliedFilters, page, reloadKey])

  const changeFilter = (event) => setPendingFilters({ ...pendingFilters, [event.target.name]: event.target.value })
  const hasFilters = searchKeyword !== '' || JSON.stringify(appliedFilters) !== JSON.stringify(DEFAULT_FILTERS)

  function submitSearch(event) { event.preventDefault(); setPage(0); setSearchKeyword(searchInput.trim()) }
  function applyFilters() { setPage(0); setAppliedFilters({ ...pendingFilters }) }
  function resetFilters() { setSearchInput(''); setSearchKeyword(''); setPendingFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); setPage(0) }

  async function saveEdit() {
    try {
      setSaving(true)
      await updateWeakVocabulary(userId, editing.userVocabularyId, { manualWeak: editing.manualWeak, weakNote: note })
      setEditing(null); setToast('Đã cập nhật từ yếu.'); setReloadKey((value) => value + 1)
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Không thể cập nhật từ yếu.')) } finally { setSaving(false) }
  }

  async function confirmDelete() {
    try {
      setDeleting(true)
      await deleteWeakVocabulary(userId, deleteTarget.userVocabularyId)
      setDeleteTarget(null); setToast('Đã xóa từ khỏi danh sách từ yếu.')
      if (items.length === 1 && page > 0) setPage(page - 1)
      else setReloadKey((value) => value + 1)
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Không thể xóa từ yếu.')) } finally { setDeleting(false) }
  }

  return <main>
    <div className="page-heading"><div><h1>Từ cần ôn luyện</h1><p>Theo dõi các từ bạn muốn tiếp tục củng cố.</p></div><button className="btn-primary" onClick={() => navigate('/weak-vocabulary/practice')}>Luyện tập</button></div>
    <form className="card filter-toolbar" onSubmit={submitSearch}>
      <div className="search-row"><input placeholder="Tìm kiếm từ yếu..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><button className="btn-primary" type="submit">Tìm kiếm</button></div>
      <WeakVocabularyFilters filters={pendingFilters} onChange={changeFilter} />
      <div className="toolbar-actions"><button className="btn-primary" type="button" onClick={applyFilters}>Áp dụng</button><button type="button" onClick={resetFilters}>Đặt lại</button>{loading && loaded && <span className="loading-note">Đang tải…</span>}</div>
    </form>
    {error && <p role="alert" className="error-message">{error}</p>}
    {!loaded && loading ? <p>Đang tải…</p> : items.length === 0 ? <section className="card empty-state"><h2>{hasFilters ? 'Không tìm thấy từ phù hợp với bộ lọc hiện tại.' : 'Bạn chưa có từ nào cần ôn luyện.'}</h2>{hasFilters && <button onClick={resetFilters}>Đặt lại bộ lọc</button>}</section> : <>
      <p className="result-count">{meta.totalElements} từ cần ôn</p>
      <div className="weak-list">{items.map((item) => <article className="weak-entry" key={item.userVocabularyId}><WeakVocabularyItem item={item} /><div className="entry-actions"><button onClick={() => { setEditing(item); setNote(item.weakNote || '') }}>Sửa</button><button className="danger-button" onClick={() => setDeleteTarget(item)}>Xóa</button></div></article>)}</div>
      {meta.totalPages > 1 && <nav className="pagination" aria-label="Phân trang"><button disabled={meta.first} onClick={() => setPage(page - 1)}>← Trước</button>{Array.from({ length: meta.totalPages }, (_, index) => <button key={index} className={index === page ? 'active-page' : ''} aria-current={index === page ? 'page' : undefined} onClick={() => setPage(index)}>{index + 1}</button>)}<button disabled={meta.last} onClick={() => setPage(page + 1)}>Sau →</button></nav>}
    </>}
    {editing && <div className="modal-overlay" role="presentation"><section className="card" role="dialog" aria-modal="true"><h2>Chỉnh sửa từ yếu</h2><p>{editing.word} — {editing.meaningVi}</p><label className="check-row"><input type="checkbox" checked={Boolean(editing.manualWeak)} onChange={(event) => setEditing({ ...editing, manualWeak: event.target.checked })} />Đánh dấu là từ yếu</label><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú cá nhân" /><div><button onClick={() => setEditing(null)} disabled={saving}>Hủy</button><button className="btn-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div></section></div>}
    <ConfirmModal open={Boolean(deleteTarget)} title="Xóa khỏi danh sách từ yếu?" message={deleteTarget ? `Bạn có chắc muốn xóa \"${deleteTarget.word}\"? Từ này không bị xóa khỏi từ điển.` : ''} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    <Toast message={toast} />
  </main>
}
