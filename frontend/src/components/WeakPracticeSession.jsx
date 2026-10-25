import { t , localizeMessage } from '../i18n/index.js';
import { useEffect, useState, useRef } from "react";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  useEffect(() => {
    getWeakPracticeSession(id).then((r) => setS(r.data))
      .catch(() => setError(t('practice:khong_tai_duoc_phien_on_luyen_d8975b')));
  }, [id]);
  if (summary)
    return (
      <main className="weak-page">
        <div className="glass-panel empty">
          <h1> {t('practice:hoan_thanh_db4a22')} </h1>
          <p>
            {summary.correctAnswers}/{summary.totalQuestions} {t('practice:dung_a3c454')} {" "}
            {summary.accuracy}%
          </p>
          <button
            className="btn btn-primary"
            onClick={() => nav("/weak-vocabulary/practice")}
          > {t('practice:on_luyen_tiep_44ba78')} </button>{" "}
          <button
            className="btn btn-glass"
            onClick={() => nav("/weak-vocabulary")}
          > {t('practice:danh_sach_tu_yeu_e985bb')} </button>
        </div>
      </main>
    );
  if (!s) return <main className="weak-page">{error || t('practice:ang_tai_3d8a48')}</main>;
  const q = s.questions[index],
    option = q.options?.length;
  const check = async () => {
    if (savingRef.current || result) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      setResult((await submitWeakPracticeAnswer(id, q.itemId, answer)).data);
    } catch (failure) {
      setError(failure.response?.data?.message || t('practice:khong_luu_duoc_cau_tra_loi_vui_long_thu__5da625'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
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
        <p> {t('practice:cau_c99b5e')} {index + 1} / {s.totalQuestions}
        </p>
        <div className="progress">
          <i style={{ width: `${(index / s.totalQuestions) * 100}%` }} />
        </div>
        <h1>{q.question}</h1>
        {error && <p className="weak-error" role="alert">{localizeMessage(error)}</p>}
        {option ? (
          <div className="options">
            {q.options.map((o) => (
              <button
                className={answer === o ? "selected" : ""}
                disabled={saving || !!result}
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
            disabled={saving || !!result}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('practice:nhap_cau_tra_loi_d44ba6')}
          />
        )}
        {!result ? (
          <button
            disabled={saving || !answer.trim()}
            className="btn btn-primary"
            onClick={check}
          > {t('practice:kiem_tra_6449af')} </button>
        ) : (
          <div className={result.correct ? "feedback ok" : "feedback bad"}>
            <b>{result.correct ? t('practice:chinh_xac_794567') : t('practice:chua_chinh_xac_7a5f96')}</b>
            <p> {t('practice:ap_an_dung_43609c')} {result.correctAnswer}</p>
            <button className="btn btn-primary" onClick={next}>
              {index + 1 === s.questions.length
                ? t('practice:xem_ket_qua_9ab7d3')
                : t('practice:cau_tiep_theo_789aa4')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
