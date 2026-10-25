import { t } from '../i18n/index.js';
import { useEffect, useState } from "react";
import { getWeakVocabularyDecks } from "../api/weakVocabularyApi";
export const defaultWeakFilters = {
  source: "ALL",
  sort: "WEAKEST_FIRST",
  deckId: "",
  masteryMin: "",
  masteryMax: "",
  accuracyMin: "",
  accuracyMax: "",
};
const mastery = () => ([
  ["", "", t('weakVocabulary:tat_ca_f7a578')],
  ["0", "25", "0–25"],
  ["26", "50", "26–50"],
  ["51", "75", "51–75"],
  ["76", "100", "76–100"],
]);
const accuracy = () => ([
  ["", "", t('weakVocabulary:tat_ca_f7a578')],
  ["", "24.99", "< 25%"],
  ["25", "50", "25% – 50%"],
  ["50", "75", "50% – 75%"],
  ["75", "", ">= 75%"],
]);
export default function WeakVocabularyFilters({
  input,
  onInputChange,
  onSearch,
  filters,
  onFiltersChange,
  onReset,
}) {
  const [decks, setDecks] = useState([]);
  useEffect(() => {
    getWeakVocabularyDecks()
      .then((r) => setDecks(r.data))
      .catch(() => setDecks([]));
  }, []);
  const update = (field, value) =>
    onFiltersChange({ ...filters, [field]: value });
  const range = (field, options, value) => {
    const [min, max] = options.find(([a, b]) => `${a}:${b}` === value);
    onFiltersChange({ ...filters, [`${field}Min`]: min, [`${field}Max`]: max });
  };
  return (
    <form
      className="weak-filters glass-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <div className="weak-filter-topline">
        <div className="weak-search-group">
          <svg className="weak-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>
          <input
            className="glass-input"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={t('weakVocabulary:tim_tu_hoac_nghia_26910d')}
            aria-label={t('weakVocabulary:tim_tu_hoac_nghia_ff132e')}
          />
          <button className="weak-search-button" aria-label={t('weakVocabulary:tim_kiem_667192')}> {t('weakVocabulary:tim_kiem_667192')} </button>
        </div>
        <button type="button" className="weak-reset-button" onClick={onReset}>
          <span aria-hidden="true">↺</span> {t('weakVocabulary:at_lai_38f5bb')} </button>
      </div>
        <div className="weak-filter-fields">
          <label><span> {t('weakVocabulary:bo_tu_2bc90d')} </span><select value={filters.deckId} onChange={(event) => update("deckId", event.target.value)}>
            <option value=""> {t('weakVocabulary:tat_ca_f7a578')} </option>
            {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
          </select></label>
          <label><span> {t('weakVocabulary:nguon_2fbcee')} </span><select value={filters.source} onChange={(event) => update("source", event.target.value)}>
            <option value="ALL"> {t('weakVocabulary:tat_ca_f7a578')} </option><option value="AUTO"> {t('weakVocabulary:tu_dong_phat_hien_13205c')} </option>
            <option value="MANUAL"> {t('weakVocabulary:them_thu_cong_c374c3')} </option><option value="BOTH"> {t('weakVocabulary:thu_cong_tu_dong_937ffe')} </option>
          </select></label>
          <label><span> {t('weakVocabulary:muc_do_thanh_thao_cc6d3e')} </span><select value={`${filters.masteryMin}:${filters.masteryMax}`} onChange={(event) => range("mastery", mastery(), event.target.value)}>
            {mastery().map(([min, max, label]) => <option key={`${min}:${max}`} value={`${min}:${max}`}>{label}</option>)}
          </select></label>
          <label><span> {t('weakVocabulary:o_chinh_xac_on_luyen_10d818')} </span><select value={`${filters.accuracyMin}:${filters.accuracyMax}`} onChange={(event) => range("accuracy", accuracy(), event.target.value)}>
            {accuracy().map(([min, max, label]) => <option key={`${min}:${max}`} value={`${min}:${max}`}>{label}</option>)}
          </select></label>
          <label><span> {t('weakVocabulary:sap_xep_e4d524')} </span><select value={filters.sort} onChange={(event) => update("sort", event.target.value)}>
            <option value="WEAKEST_FIRST"> {t('weakVocabulary:yeu_nhat_truoc_ea531d')} </option><option value="MASTERY_ASC"> {t('weakVocabulary:mastery_thap_cao_299014')} </option>
            <option value="MASTERY_DESC"> {t('weakVocabulary:mastery_cao_thap_53402a')} </option><option value="ACCURACY_ASC"> {t('weakVocabulary:accuracy_thap_cao_86dd53')} </option>
            <option value="ACCURACY_DESC"> {t('weakVocabulary:accuracy_cao_thap_d62a10')} </option><option value="UPDATED_DESC"> {t('weakVocabulary:moi_cap_nhat_d2970e')} </option>
            <option value="WORD_ASC"> {t('weakVocabulary:tu_a_z_71fc53')} </option><option value="WORD_DESC"> {t('weakVocabulary:tu_z_a_10b207')} </option>
          </select></label>
        </div>
    </form>
  );
}
