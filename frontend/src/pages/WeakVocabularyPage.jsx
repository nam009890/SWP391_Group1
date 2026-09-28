import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WeakVocabularyItem from '../components/WeakVocabularyItem.jsx'
import { getWeakVocabularies, startFillBlankPractice } from '../services/weakVocabularyService.js'

export default function WeakVocabularyPage() {
  const userId = import.meta.env.VITE_DEMO_USER_ID
  const navigate = useNavigate(); const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [starting, setStarting] = useState(false)
  useEffect(() => { getWeakVocabularies(userId).then((r) => setItems(r.data)).catch(() => setError('Không thể tải danh sách từ cần ôn.')).finally(() => setLoading(false)) }, [userId])
  const start = async () => { setStarting(true); setError(''); try { const { data } = await startFillBlankPractice(userId, 10); navigate(`/weak-vocabulary/practice/${data.sessionId}`) } catch (e) { setError(e.response?.data?.message || 'Không thể bắt đầu phiên luyện tập.') } finally { setStarting(false) } }
  if (loading) return <p>Đang tải…</p>; if (error && !items.length) return <p role="alert">{error}</p>
  return <main><h1>Từ cần ôn luyện</h1>{error && <p role="alert">{error}</p>}
    {!items.length ? <p>Hiện tại bạn không có từ nào cần ôn luyện.</p> : <><button onClick={start} disabled={starting}>{starting ? 'Đang tạo phiên…' : 'Bắt đầu luyện điền từ'}</button>{items.map((item) => <WeakVocabularyItem key={item.userVocabularyId} item={item} />)}</>}</main>
}
