import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getWeakPracticeSession,
  getWeakPracticeSummary,
  submitWeakPracticeAnswer,
} from "../api/weakVocabularyApi";
import "./WeakVocabulary.css";
export default function WeakPracticeSession() {
  const { id } = useParams(),
    nav = useNavigate(),
    [s, setS] = useState(null),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(""),
    [result, setResult] = useState(null),
    [summary, setSummary] = useState(null);
  useEffect(() => {
    getWeakPracticeSession(id).then((r) => setS(r.data));
  }, [id]);
  if (summary)
    return (
      <main className="weak-page">
        <div className="glass-panel empty">
          <h1>Hoàn thành!</h1>
          <p>
            {summary.correctAnswers}/{summary.totalQuestions} đúng ·{" "}
            {summary.accuracy}%
          </p>
          <button
            className="btn btn-primary"
            onClick={() => nav("/weak-vocabulary/practice")}
          >
            Ôn luyện tiếp
          </button>{" "}
          <button
            className="btn btn-glass"
            onClick={() => nav("/weak-vocabulary")}
          >
            Danh sách từ yếu
          </button>
        </div>
      </main>
    );
  if (!s) return <main className="weak-page">Đang tải...</main>;
  const q = s.questions[index],
    option = q.options?.length;
  const check = async () =>
    setResult((await submitWeakPracticeAnswer(id, q.itemId, answer)).data);
  const next = async () => {
    if (index + 1 < s.questions.length) {
      setIndex(index + 1);
      setAnswer("");
      setResult(null);
    } else setSummary((await getWeakPracticeSummary(id)).data);
  };
  return (
    <main className="weak-page">
      <div className="glass-panel practice">
        <p>
          Câu {index + 1} / {s.totalQuestions}
        </p>
        <div className="progress">
          <i style={{ width: `${(index / s.totalQuestions) * 100}%` }} />
        </div>
        <h1>{q.question}</h1>
        {option ? (
          <div className="options">
            {q.options.map((o) => (
              <button
                className={answer === o ? "selected" : ""}
                disabled={!!result}
                onClick={() => setAnswer(o)}
                key={o}
              >
                {o}
              </button>
            ))}
          </div>
        ) : (
          <input
            className="glass-input"
            disabled={!!result}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Nhập câu trả lời..."
          />
        )}
        {!result ? (
          <button
            disabled={!answer.trim()}
            className="btn btn-primary"
            onClick={check}
          >
            Kiểm tra
          </button>
        ) : (
          <div className={result.correct ? "feedback ok" : "feedback bad"}>
            <b>{result.correct ? "✓ Chính xác" : "✕ Chưa chính xác"}</b>
            <p>Đáp án đúng: {result.correctAnswer}</p>
            <button className="btn btn-primary" onClick={next}>
              {index + 1 === s.questions.length
                ? "Xem kết quả"
                : "Câu tiếp theo"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
