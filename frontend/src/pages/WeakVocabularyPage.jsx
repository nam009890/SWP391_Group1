import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WeakVocabularyItem from '../components/WeakVocabularyItem.jsx'
import { APP_CONFIG } from '../config/appConfig.js'
import { getWeakVocabularies, startFillBlankPractice } from '../services/weakVocabularyService.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import { deleteWeakVocabulary, updateWeakVocabulary } from '../services/weakVocabularyService.js'
import ConfirmModal from '../components/ConfirmModal.jsx'
import Toast from '../components/Toast.jsx'

export default function WeakVocabularyPage() {
  const navigate = useNavigate()
  const userId = APP_CONFIG.demoUserId
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [meta, setMeta] = useState({ page: 0, totalPages: 0, totalElements: 0, first: true, last: true })
  const [editing, setEditing] = useState(null)
  const [note, setNote] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true

    async function loadWeakVocabularies() {
      try {
        setLoading(true)
        setError('')
        const data = await getWeakVocabularies(userId, keyword, page)
        if (active) { setItems(data.items); setMeta(data) }
      } catch (requestError) {
        console.error('Failed to load weak vocabularies.', requestError)
        if (active) {
          setItems([])
          setError(getApiErrorMessage(requestError, 'Không thể tải danh sách từ cần ôn.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadWeakVocabularies()
    return () => { active = false }
  }, [userId, keyword, page, reloadKey])

  async function startPractice() {
    try {
      setStarting(true)
      setError('')
      const session = await startFillBlankPractice(userId, 'FILL_BLANK', items.map((item) => item.userVocabularyId))
      navigate(`/weak-vocabulary/practice/${session.sessionId}`)
    } catch (requestError) {
      console.error('Failed to start fill-blank practice.', requestError)
      setError(getApiErrorMessage(requestError, 'Không thể bắt đầu phiên luyện tập.'))
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <p>Đang tải…</p>
  if (!Array.isArray(items)) return <p role="alert">Phản hồi từ server không đúng định dạng.</p>

  return (
    <main>
      <h1>Từ cần ôn luyện</h1>
      <input placeholder="Tìm kiếm từ yếu..." value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(0) }} />
      {error && <p role="alert">{error}</p>}
      {items.length === 0 ? <p>Hiện tại bạn không có từ nào cần ôn luyện.</p> : <>
        <button onClick={startPractice} disabled={starting}>
          {starting ? 'Đang tạo phiên…' : 'Bắt đầu luyện điền từ'}
        </button>
        {items.map((item) => <div key={item.userVocabularyId}><WeakVocabularyItem item={item} /><button onClick={() => { setEditing(item); setNote(item.weakNote || '') }}>Sửa</button><button onClick={() => setDeleteTarget(item)}>Xóa</button></div>)}
      </>}
      {meta.totalPages > 1 && <p><button disabled={meta.first} onClick={() => setPage(page - 1)}>← Trước</button>{Array.from({ length: meta.totalPages }, (_, i) => <button key={i} disabled={i === page} onClick={() => setPage(i)}>{i + 1}</button>)}<button disabled={meta.last} onClick={() => setPage(page + 1)}>Sau →</button></p>}
      {editing && <div role="dialog" className="card"><h2>Chỉnh sửa từ yếu</h2><p>{editing.word} — {editing.meaningVi}</p><label><input type="checkbox" checked={Boolean(editing.manualWeak)} onChange={(e) => setEditing({ ...editing, manualWeak: e.target.checked })} />Đánh dấu là từ yếu</label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú cá nhân" /><button onClick={() => setEditing(null)} disabled={saving}>Hủy</button><button onClick={async () => { try { setSaving(true); await updateWeakVocabulary(userId, editing.userVocabularyId, { manualWeak: editing.manualWeak, weakNote: note }); setEditing(null); setToast('Đã cập nhật từ yếu.'); setReloadKey(v => v + 1) } catch (e) { setError(getApiErrorMessage(e, 'Không thể cập nhật từ yếu.')) } finally { setSaving(false) } }} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>}
      <ConfirmModal open={Boolean(deleteTarget)} title="Xóa khỏi danh sách từ yếu?" message={deleteTarget ? `Bạn có chắc muốn xóa "${deleteTarget.word}"? Từ này không bị xóa khỏi từ điển.` : ''} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={async () => { try { setDeleting(true); await deleteWeakVocabulary(userId, deleteTarget.userVocabularyId); setDeleteTarget(null); setToast('Đã xóa từ khỏi danh sách từ yếu.'); if (items.length === 1 && page > 0) setPage(page - 1); else setReloadKey(v => v + 1) } catch (e) { setError(getApiErrorMessage(e, 'Không thể xóa từ yếu.')) } finally { setDeleting(false) } }} /><Toast message={toast} />
    </main>
  )
}
