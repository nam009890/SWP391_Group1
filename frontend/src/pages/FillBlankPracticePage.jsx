import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FillBlankQuestion from '../components/FillBlankQuestion.jsx'
import PracticeSummary from '../components/PracticeSummary.jsx'
import { getPracticeSession, getPracticeSummary, submitFillBlankAnswer } from '../services/weakVocabularyService.js'

export default function FillBlankPracticePage() {
  const { sessionId } = useParams(); const userId = import.meta.env.VITE_DEMO_USER_ID
  const [session, setSession] = useState(null); const [index, setIndex] = useState(0); const [summary, setSummary] = useState(null); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false); const [answered, setAnswered] = useState(false)
  useEffect(() => { getPracticeSession(userId, sessionId).then(({data}) => { setSession(data); if (data.status === 'COMPLETED') return getPracticeSummary(userId, sessionId).then((r) => setSummary(r.data)) }).catch(() => setError('Không thể tải phiên luyện tập.')) }, [userId, sessionId])
  const submit = async (answer) => { setSubmitting(true); try { const { data } = await submitFillBlankAnswer(userId, sessionId, session.pendingQuestions[index].itemId, answer); setAnswered(true); return data } catch (e) { setError(e.response?.data?.message || 'Không thể gửi câu trả lời.'); return null } finally { setSubmitting(false) } }
  const next = async () => { if (index + 1 < session.pendingQuestions.length) { setIndex(index + 1); setAnswered(false); return } const { data } = await getPracticeSummary(userId, sessionId); setSummary(data) }
  if (error) return <p role="alert">{error}</p>; if (summary) return <PracticeSummary summary={summary} />; if (!session) return <p>Đang tải…</p>; if (!session.pendingQuestions.length) return <p>Không còn câu hỏi đang chờ.</p>
  return <main><FillBlankQuestion question={session.pendingQuestions[index]} index={index} total={session.totalQuestions} onSubmit={submit} submitting={submitting} />{answered && <button onClick={next}>Câu tiếp theo</button>}</main>
}
