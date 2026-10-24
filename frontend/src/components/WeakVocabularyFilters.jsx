import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
export const defaultWeakFilters = {
  source: "ALL",
  sort: "WEAKEST_FIRST",
  deckId: "",
  masteryMin: "",
  masteryMax: "",
  accuracyMin: "",
  accuracyMax: "",
};
const mastery = [
  ["", "", "Tất cả"],
  ["0", "25", "0–25"],
  ["26", "50", "26–50"],
  ["51", "75", "51–75"],
  ["76", "100", "76–100"],
];
const accuracy = [
  ["", "", "Tất cả"],
  ["", "24.99", "< 25%"],
  ["25", "50", "25% – 50%"],
  ["50", "75", "50% – 75%"],
  ["75", "", ">= 75%"],
];
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
    api
      .get("/decks")
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
            placeholder="Tìm từ hoặc nghĩa..."
            aria-label="Tìm từ hoặc nghĩa"
          />
          <button className="weak-search-button" aria-label="Tìm kiếm">Tìm kiếm</button>
        </div>
        <button type="button" className="weak-reset-button" onClick={onReset}>
          <span aria-hidden="true">↺</span> Đặt lại
        </button>
      </div>
        <div className="weak-filter-fields">
          <label><span>Bộ từ</span><select value={filters.deckId} onChange={(event) => update("deckId", event.target.value)}>
            <option value="">Tất cả</option>
            {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
          </select></label>
          <label><span>Nguồn</span><select value={filters.source} onChange={(event) => update("source", event.target.value)}>
            <option value="ALL">Tất cả</option><option value="AUTO">Tự động phát hiện</option>
            <option value="MANUAL">Đánh dấu thủ công</option><option value="BOTH">Cả hai</option>
          </select></label>
          <label><span>Mức độ thành thạo</span><select value={`${filters.masteryMin}:${filters.masteryMax}`} onChange={(event) => range("mastery", mastery, event.target.value)}>
            {mastery.map(([min, max, label]) => <option key={`${min}:${max}`} value={`${min}:${max}`}>{label}</option>)}
          </select></label>
          <label><span>Độ chính xác</span><select value={`${filters.accuracyMin}:${filters.accuracyMax}`} onChange={(event) => range("accuracy", accuracy, event.target.value)}>
            {accuracy.map(([min, max, label]) => <option key={`${min}:${max}`} value={`${min}:${max}`}>{label}</option>)}
          </select></label>
          <label><span>Sắp xếp</span><select value={filters.sort} onChange={(event) => update("sort", event.target.value)}>
            <option value="WEAKEST_FIRST">Yếu nhất trước</option><option value="MASTERY_ASC">Mastery thấp → cao</option>
            <option value="MASTERY_DESC">Mastery cao → thấp</option><option value="ACCURACY_ASC">Accuracy thấp → cao</option>
            <option value="ACCURACY_DESC">Accuracy cao → thấp</option><option value="UPDATED_DESC">Mới cập nhật</option>
            <option value="WORD_ASC">Từ A → Z</option><option value="WORD_DESC">Từ Z → A</option>
          </select></label>
        </div>
    </form>
  );
}
