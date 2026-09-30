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
  ["", "", "Tất cả mức độ"],
  ["0", "25", "0–25"],
  ["26", "50", "26–50"],
  ["51", "75", "51–75"],
  ["76", "100", "76–100"],
];
const accuracy = [
  ["", "", "Tất cả độ chính xác"],
  ["", "24.99", "< 25%"],
  ["25", "50", "25% – 50%"],
  ["50", "75", "50% – 75%"],
  ["75", "", ">= 75%"],
];
export default function WeakVocabularyFilters({
  input,
  onInputChange,
  onSearch,
  pending,
  onPendingChange,
  onApply,
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
    onPendingChange({ ...pending, [field]: value });
  const range = (field, options, value) => {
    const [min, max] = options.find(([a, b]) => `${a}:${b}` === value);
    onPendingChange({ ...pending, [`${field}Min`]: min, [`${field}Max`]: max });
  };
  return (
    <form
      className="weak-filters glass-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <input
        className="glass-input"
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Tìm từ hoặc nghĩa..."
      />
      <select
        value={pending.deckId}
        onChange={(event) => update("deckId", event.target.value)}
      >
        <option value="">Tất cả bộ từ</option>
        {decks.map((deck) => (
          <option key={deck.id} value={deck.id}>
            {deck.name}
          </option>
        ))}
      </select>
      <select
        value={pending.source}
        onChange={(event) => update("source", event.target.value)}
      >
        <option value="ALL">Tất cả nguồn</option>
        <option value="AUTO">Tự động phát hiện</option>
        <option value="MANUAL">Đánh dấu thủ công</option>
        <option value="BOTH">Cả hai</option>
      </select>
      <select
        value={`${pending.masteryMin}:${pending.masteryMax}`}
        onChange={(event) => range("mastery", mastery, event.target.value)}
      >
        {mastery.map(([min, max, label]) => (
          <option key={`${min}:${max}`} value={`${min}:${max}`}>
            {label}
          </option>
        ))}
      </select>
      <select
        value={`${pending.accuracyMin}:${pending.accuracyMax}`}
        onChange={(event) => range("accuracy", accuracy, event.target.value)}
      >
        {accuracy.map(([min, max, label]) => (
          <option key={`${min}:${max}`} value={`${min}:${max}`}>
            {label}
          </option>
        ))}
      </select>
      <select
        value={pending.sort}
        onChange={(event) => update("sort", event.target.value)}
      >
        <option value="WEAKEST_FIRST">Yếu nhất trước</option>
        <option value="MASTERY_ASC">Mastery thấp → cao</option>
        <option value="MASTERY_DESC">Mastery cao → thấp</option>
        <option value="ACCURACY_ASC">Accuracy thấp → cao</option>
        <option value="ACCURACY_DESC">Accuracy cao → thấp</option>
        <option value="UPDATED_DESC">Mới cập nhật</option>
        <option value="WORD_ASC">Từ A → Z</option>
        <option value="WORD_DESC">Từ Z → A</option>
      </select>
      <button className="btn btn-primary">Tìm kiếm</button>
      <button type="button" className="btn btn-glass" onClick={onApply}>
        Áp dụng
      </button>
      <button type="button" className="btn btn-glass" onClick={onReset}>
        Đặt lại
      </button>
    </form>
  );
}
