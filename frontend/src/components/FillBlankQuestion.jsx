import { useState } from 'react'

export default function FillBlankQuestion({ question, index, total, onSubmit, submitting }) {
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const submit = async (event) => {
    event.preventDefault()
    if (!answer.trim()) return
    const result = await onSubmit(answer)
    setFeedback(result)
  }
  return <section className="card">
    <p>Câu {index + 1} / {total}</p><h2>{question.question}</h2>
    {question.hint && <p>Gợi ý: {question.hint}</p>}
    <form onSubmit={submit}>
      <input value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={submitting || feedback} aria-label="Câu trả lời" />
      {!feedback && <button disabled={submitting}>{submitting ? 'Đang kiểm tra…' : 'Kiểm tra'}</button>}
    </form>
    {feedback && <div><p>{feedback.correct ? '✓ Chính xác' : '✗ Chưa chính xác'}</p>
      <p>Đáp án của bạn: {feedback.submittedAnswer}</p><p>Đáp án đúng: {feedback.correctAnswer}</p></div>}
  </section>
}
