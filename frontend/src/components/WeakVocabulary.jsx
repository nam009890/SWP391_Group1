import { t , localizeMessage , formatNumber } from '../i18n/index.js';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteWeakVocabulary,
  getWeakVocabularies,
  updateWeakVocabulary,
} from "../api/weakVocabularyApi";
import WeakVocabularyFilters, {
  defaultWeakFilters,
} from "./WeakVocabularyFilters";
import "./WeakVocabulary.css";
import { weakReasonLabel, weakSourceLabel } from "./weakVocabularyPresentation";

export default function WeakVocabulary() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState(defaultWeakFilters);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      setError("");
      const response = await getWeakVocabularies({
        ...filters,
        keyword,
        page: nextPage,
        size: 10,
      });
      setData(response.data);
      setPage(nextPage);
    } catch {
      setError(t('weakVocabulary:khong_the_tai_danh_sach_tu_yeu_ba9ee9'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load(0);
  }, [keyword, filters]);
  const reset = () => {
    setInput("");
    setKeyword("");
    setFilters(defaultWeakFilters);
    setPage(0);
  };
  const editNote = async (word) => {
    const weakNote = window.prompt(t('weakVocabulary:ghi_chu_02f03f'), word.weakNote || "");
    if (weakNote !== null) {
      await updateWeakVocabulary(word.weakVocabularyId, { weakNote });
      load();
    }
  };
  const filtered =
    keyword ||
    JSON.stringify(filters) !== JSON.stringify(defaultWeakFilters);
  return (
    <main className="weak-page animate-fade-in">
      <section className="weak-head">
        <div>
          <h1> {t('weakVocabulary:tu_can_on_luyen_6b88b7')} </h1>
          <p> {t('weakVocabulary:cung_co_nhung_tu_ban_con_chua_tu_tin_775f3f')} </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/weak-vocabulary/practice")}
        > {t('weakVocabulary:on_luyen_c66012')} </button>
      </section>
      <details className="weak-detection-help glass-panel">
        <summary> {t('weakVocabulary:tu_yeu_duoc_phat_hien_nhu_the_nao_018bae')} </summary>
        <p> {t('weakVocabulary:again_them_ngay_hard_it_nhat_2_lan_trong_b7d638')} </p>
        <p> {t('weakVocabulary:on_luyen_sai_2_lan_lien_tiep_hoac_do_chi_7a58e8')} </p>
      </details>
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
      {error && (
        <div className="weak-error">
          {localizeMessage(error)} <button onClick={() => load()}> {t('weakVocabulary:thu_lai_e353f2')} </button>
        </div>
      )}
      {!data ? (
        <p> {t('weakVocabulary:ang_tai_3d8a48')} </p>
      ) : (
        <>
          {loading && <p className="weak-loading"> {t('weakVocabulary:ang_cap_nhat_9f3d40')} </p>}
          <div className="weak-grid">
            {data.items.map((word) => (
              <article
                className="weak-card glass-panel"
                key={word.weakVocabularyId}
              >
                <div className="word-row">
                  <h2>{word.vocabulary}</h2>
                  <span>
                    {weakSourceLabel(word)}
                  </span>
                </div>
                <em>{word.phonetic}</em>
                <p>{word.meaning}</p>
                <small>{word.exampleSentence}</small>
                <div className="stats weak-learning-metrics">
                  <section aria-label={t('weakVocabulary:ket_qua_hoc_flashcard_508086')}>
                    <b> {t('weakVocabulary:hoc_flashcard_340d51')} </b>
                    <span> {t('weakVocabulary:so_lan_danh_gia_e40a0a')} {word.studyReviewCount ?? 0}</span>
                    <span> {t('weakVocabulary:ty_le_ghi_nho_tot_c2de7b')} {word.studyAccuracy == null ? t('weakVocabulary:chua_co_du_lieu_e77813') : formatNumber(word.studyAccuracy) + '%'}</span>
                  </section>
                  <section aria-label={t('weakVocabulary:ket_qua_on_luyen_tu_yeu_a6e152')}>
                    <b> {t('weakVocabulary:on_luyen_tu_yeu_055a6c')} </b>
                    <span> {t('weakVocabulary:so_lan_tra_loi_29b99d')} {word.totalAttempts}</span>
                    <span> {t('weakVocabulary:ung_07bcaf')} {word.correctCount} {t('weakVocabulary:sai_e6b0d8')} {word.wrongCount}</span>
                    <span> {t('weakVocabulary:o_chinh_xac_e3ea5f')} {word.totalAttempts === 0 ? t('weakVocabulary:chua_luyen_tap_1239e1') : formatNumber(word.accuracy) + '%'}</span>
                    <span> {t('weakVocabulary:muc_thanh_thao_00eb94')} {word.masteryScore}%</span>
                  </section>
                </div>
                <p className="reason">{weakReasonLabel(word.detectionReason || word.weakReason)}</p>
                {word.weakNote && <p className="note">{word.weakNote}</p>}
                <div className="card-actions">
                  <button
                    className="btn btn-glass"
                    onClick={() => editNote(word)}
                  > {t('weakVocabulary:sua_ghi_chu_03d300')} </button>
                  <button
                    className="btn btn-glass"
                    onClick={() => navigate("/weak-vocabulary/practice")}
                  > {t('weakVocabulary:on_luyen_c66012')} </button>
                  <button
                    className="btn danger"
                    onClick={async () => {
                      if (window.confirm("Xóa từ này khỏi danh sách?")) {
                        await deleteWeakVocabulary(word.weakVocabularyId);
                        load();
                      }
                    }}
                  > {t('weakVocabulary:xoa_aa1d94')} </button>
                </div>
              </article>
            ))}
          </div>
          {!data.items.length && (
            <div className="glass-panel empty">
              {filtered ? (
                <> {t('weakVocabulary:khong_tim_thay_tu_phu_hop_voi_bo_loc_hie_8f49a7')} {" "}
                  <button onClick={reset}> {t('weakVocabulary:at_lai_bo_loc_a3c216')} </button>
                </>
              ) : (
                t('weakVocabulary:ban_chua_co_tu_nao_can_on_luyen_1416c7')
              )}
            </div>
          )}
          <div className="pager">
            <button disabled={data.first} onClick={() => load(page - 1)}> {t('weakVocabulary:truoc_f6b296')} </button>
            <span> {t('weakVocabulary:trang_aec122')} {data.page + 1} / {Math.max(data.totalPages, 1)} ·{" "}
              {data.totalElements} {t('weakVocabulary:tu_c826c3')} </span>
            <button disabled={data.last} onClick={() => load(page + 1)}> {t('weakVocabulary:sau_e76068')} </button>
          </div>
        </>
      )}
    </main>
  );
}
