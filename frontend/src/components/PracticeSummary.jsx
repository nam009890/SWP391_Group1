import { Link } from 'react-router-dom'

export default function PracticeSummary({ summary }) {
  const accuracy = summary?.accuracy ?? 0

  return (
    <section className="card">
      <h1>Hoàn thành!</h1>
      <p>Tổng số câu: {summary?.totalQuestions ?? 0}</p>
      <p>Đúng: {summary?.correctAnswers ?? 0}</p>
      <p>Sai: {summary?.wrongAnswers ?? 0}</p>
      <p>Accuracy: {accuracy}%</p>
      <Link to="/weak-vocabulary">Quay lại danh sách từ cần ôn</Link>
    </section>
  )
}
