import { t , localizeMessage } from '../i18n/index.js';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createWeakPracticeSession,
  getWeakVocabularies,
} from "../api/weakVocabularyApi";
import WeakVocabularyFilters, {
  defaultWeakFilters,
} from "./WeakVocabularyFilters";
import "./WeakVocabulary.css";
const methods = () => ([
  ["FILL_BLANK", "✎", t('practice:ien_tu_theo_ngu_canh_ea2ceb'), t('practice:tu_nho_va_hoan_thanh_cau_1775c2')],
  ["MULTIPLE_CHOICE", "A", t('practice:chon_tu_dung_23003c'), t('practice:chon_dap_an_phu_hop_nhat_be06d8')],
  ["WORD_TO_MEANING", "→", t('practice:tu_nghia_ce0ace'), t('practice:nhin_tu_va_chon_nghia_68914f')],
  ["MEANING_TO_WORD", "←", t('practice:nghia_tu_e8c6fc'), t('practice:nhin_nghia_va_chon_tu_160175')],
]);

export default function WeakPracticeSetup() {
  const navigate = useNavigate();
  const [questionType, setQuestionType] = useState("");
  const [data, setData] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState(defaultWeakFilters);
  const [page, setPage] = useState(0);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const load = async (nextPage = page) => {
    try {
      const response = await getWeakVocabularies({
        ...filters,
        keyword,
        page: nextPage,
        size: 10,
      });
      setData(response.data);
      setPage(nextPage);
      setError("");
    } catch {
      setError(t('practice:khong_the_tai_danh_sach_tu_yeu_de_on_luy_eec7c2'));
    }
  };
  useEffect(() => {
    load(0);
  }, [keyword, filters]);
  const toggle = (id) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const currentIds = data?.items.map((item) => item.weakVocabularyId) || [];
  const allCurrentSelected =
    currentIds.length > 0 && currentIds.every((id) => selectedIds.has(id));
  const toggleCurrentPage = () =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allCurrentSelected) currentIds.forEach((id) => next.delete(id));
      else currentIds.forEach((id) => next.add(id));
      return next;
    });
  const reset = () => {
    setInput("");
    setKeyword("");
    setFilters(defaultWeakFilters);
    setPage(0);
  };
  const start = async () => {
    setStarting(true);
    setError("");
    try {
      const response = await createWeakPracticeSession({
        questionType,
        weakVocabularyIds: Array.from(selectedIds),
      });
      navigate(`/weak-vocabulary/practice/${response.data.sessionId}`);
    } catch {
      setError(
        t('practice:khong_the_tao_phien_on_luyen_vui_long_ki_384fc9'),
      );
      setStarting(false);
    }
  };
  return (
    <main className="weak-page animate-fade-in">
      <section className="weak-head">
        <div>
          <h1> {t('practice:on_luyen_tu_yeu_055a6c')} </h1>
          <p> {t('practice:chon_phuong_thuc_va_cac_tu_muon_luyen_126023')} </p>
        </div>
        <span className="selected-count"> {t('practice:a_chon_40b56a')} {selectedIds.size} {t('practice:tu_c826c3')} </span>
      </section>
      <section className="weak-grid setup">
        {methods().map(([value, icon, label, description]) => (
          <button
            key={value}
            className={`glass-panel method ${questionType === value ? "selected" : ""}`}
            aria-pressed={questionType === value}
            onClick={() => setQuestionType(value)}
          >
            <span className="method-icon" aria-hidden="true">{questionType === value ? "✓" : icon}</span>
            <span><b>{label}</b><small>{description}</small></span>
          </button>
        ))}
      </section>
      <WeakVocabularyFilters
        input={input}
        onInputChange={setInput}
        onSearch={() => setKeyword(input)}
        filters={filters}
        onFiltersChange={(nextFilters) => {
          setFilters(nextFilters);
          setPage(0);
        }}
        onReset={reset}
      />
      {error && <div className="weak-error">{localizeMessage(error)}</div>}
      <section className="glass-panel choices">
        <div className="choice-head">
          <h2> {t('practice:chon_tu_yeu_e45cb6')} </h2>
          <div>
            <button className="btn btn-glass" onClick={toggleCurrentPage} disabled={!currentIds.length}>
              {allCurrentSelected
                ? t('practice:bo_chon_trang_nay_49c611')
                : t('practice:chon_tat_ca_trang_nay_a179f4')}
            </button>
            <button
              className="btn btn-glass"
              onClick={() => setSelectedIds(new Set())}
              disabled={!selectedIds.size}
            > {t('practice:bo_chon_tat_ca_c1aecf')} </button>
          </div>
        </div>
        {!data ? (
          <p> {t('practice:ang_tai_3d8a48')} </p>
        ) : (
          data.items.map((word) => (
            <label className={`choice-row ${selectedIds.has(word.weakVocabularyId) ? "is-selected" : ""}`} key={word.weakVocabularyId}>
              <input
                type="checkbox"
                checked={selectedIds.has(word.weakVocabularyId)}
                onChange={() => toggle(word.weakVocabularyId)}
              />
              <span className="choice-check" aria-hidden="true">✓</span>
              <span>
                <b>{word.vocabulary}</b> — {word.meaning}
              </span>
            </label>
          ))
        )}
        {data && !data.items.length && <p> {t('practice:khong_tim_thay_tu_phu_hop_ee7dbd')} </p>}
        <div className="pager">
          <button disabled={!data || data.first} onClick={() => load(page - 1)}> {t('practice:truoc_f6b296')} </button>
          <span>
            {data
              ? t('common:page_of', { page: data.page + 1, total: Math.max(data.totalPages, 1) })
              : ""}
          </span>
          <button disabled={!data || data.last} onClick={() => load(page + 1)}> {t('practice:sau_e76068')} </button>
        </div>
      </section>
      <button
        className="btn btn-primary start-practice"
        disabled={!questionType || !selectedIds.size || starting}
        onClick={start}
      >
        {starting ? t('practice:ang_tao_phien_df0094') : t('practice:bat_dau_luyen_tap_34fe28')}
      </button>
    </main>
  );
}
