import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FillBlankQuestion from '../components/FillBlankQuestion.jsx'
import PracticeSummary from '../components/PracticeSummary.jsx'
import { APP_CONFIG } from '../config/appConfig.js'
import { getPracticeSession, getPracticeSummary, submitFillBlankAnswer } from '../services/weakVocabularyService.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'

export default function FillBlankPracticePage() {
  const { sessionId } = useParams()
  const userId = APP_CONFIG.demoUserId
  const [session, setSession] = useState(null)
  const [index, setIndex] = useState(0)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        setError('')
        setIndex(0)
        setAnswered(false)
        const data = await getPracticeSession(userId, sessionId)
        if (!active) return
        setSession(data)

        if (data.status === 'COMPLETED' || data.pendingQuestions.length === 0) {
          const summaryData = await getPracticeSummary(userId, sessionId)
          if (active) setSummary(summaryData)
        }
      } catch (requestError) {
        console.error('Failed to load practice session.', requestError)
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải phiên luyện tập.'))
      }
    }

    loadSession()
    return () => { active = false }
  }, [sessionId, userId])

  async function submit(answer) {
    const question = session?.pendingQuestions?.[index]
    if (!question || submitting || answered) return null

    try {
      setSubmitting(true)
      setError('')
      const result = await submitFillBlankAnswer(userId, sessionId, question.itemId, answer)
      setAnswered(true)
      return result
    } catch (requestError) {
      console.error('Failed to submit fill-blank answer.', requestError)
      setError(getApiErrorMessage(requestError, 'Không thể gửi câu trả lời.'))
      return null
    } finally {
      setSubmitting(false)
    }
  }

  async function nextQuestion() {
    if (!session) return
    if (index + 1 < session.pendingQuestions.length) {
      setIndex(index + 1)
      setAnswered(false)
      return
    }

    try {
      const summaryData = await getPracticeSummary(userId, sessionId)
      setSummary(summaryData)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải tổng kết phiên luyện tập.'))
    }
  }

  if (error) return <p role="alert">{error}</p>
  if (summary) return <PracticeSummary summary={summary} />
  if (!session) return <p>Đang tải…</p>

  const question = session.pendingQuestions[index]
  if (!question) return <p>Không còn câu hỏi đang chờ.</p>

  return (
    <main>
      <FillBlankQuestion key={question.itemId} question={question} index={index} total={session.totalQuestions} onSubmit={submit} submitting={submitting} />
      {answered && <button onClick={nextQuestion}>Câu tiếp theo</button>}
    </main>
  )
}
