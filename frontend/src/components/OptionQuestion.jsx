import { useState } from 'react'
export default function OptionQuestion({ question, onSubmit, submitting }) {
  const [answer, setAnswer] = useState(''); const [result, setResult] = useState(null); const options = Array.isArray(question?.options) ? question.options : []
  async function submit() { if (!answer || result) return; const data = await onSubmit(answer); if (data) setResult(data) }
  return <section className="card practice-card"><h2>{question.question}</h2>{options.map((option) => <label className={`practice-option ${answer === option ? 'practice-option--selected' : ''}`} key={option}><input type="radio" disabled={submitting || result} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>)}<button className="btn btn-primary" type="button" disabled={!answer || submitting || result} onClick={submit}>Kiểm tra</button>{result && <div className="feedback"><p>{result.correct ? '✓ Chính xác!' : '✕ Chưa chính xác'}</p><p>Đáp án đúng: {result.correctAnswer}</p></div>}</section>
}
