import { useState } from 'react'
export default function OptionQuestion({ question, onSubmit, submitting }) {
  const [answer, setAnswer] = useState(''); const [result, setResult] = useState(null); const options = Array.isArray(question?.options) ? question.options : []
  async function submit() { if (!answer || result) return; const data = await onSubmit(answer); if (data) setResult(data) }
  return <section className="card"><h2>{question.question}</h2>{question.hint && <p>Gợi ý: {question.hint}</p>}{options.map((option) => <label key={option}><input type="radio" disabled={submitting || result} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>)}<button type="button" disabled={!answer || submitting || result} onClick={submit}>Kiểm tra</button>{result && <><p>{result.correct ? '✓ Chính xác!' : '✕ Chưa chính xác'}</p><p>Đáp án đúng: {result.correctAnswer}</p></>}</section>
}
