import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WeakVocabularyItem from '../components/WeakVocabularyItem.jsx'
import { APP_CONFIG } from '../config/appConfig.js'
import { getWeakVocabularies, startFillBlankPractice } from '../services/weakVocabularyService.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

export default function WeakVocabularyPage() {
  const navigate = useNavigate()
  const userId = APP_CONFIG.demoUserId
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let active = true

    async function loadWeakVocabularies() {
      try {
        setLoading(true)
        setError('')
        const data = await getWeakVocabularies(userId)
        if (active) setItems(data)
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
  }, [userId])

  async function startPractice() {
    try {
      setStarting(true)
      setError('')
      const session = await startFillBlankPractice(userId, 10)
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
      {error && <p role="alert">{error}</p>}
      {items.length === 0 ? <p>Hiện tại bạn không có từ nào cần ôn luyện.</p> : <>
        <button onClick={startPractice} disabled={starting}>
          {starting ? 'Đang tạo phiên…' : 'Bắt đầu luyện điền từ'}
        </button>
        {items.map((item) => <WeakVocabularyItem key={item.userVocabularyId} item={item} />)}
      </>}
    </main>
  )
}
