import { Link } from 'react-router-dom'

export default function PracticeSummary({ summary }) {
  return <section className="card"><h1>Hoàn thành!</h1>
    <p>Tổng số câu: {summary.totalQuestions}</p><p>Đúng: {summary.correctAnswers}</p>
    <p>Sai: {summary.wrongAnswers}</p><p>Accuracy: {summary.accuracy}%</p>
    <Link to="/weak-vocabulary">Quay lại danh sách từ cần ôn</Link>
  </section>
}
