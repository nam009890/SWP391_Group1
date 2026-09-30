const CEFR_LEVELS = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const PARTS_OF_SPEECH = [
  ['', 'Tất cả loại từ'],
  ['noun', 'Noun'],
  ['verb', 'Verb'],
  ['adjective', 'Adjective'],
  ['adverb', 'Adverb'],
  ['preposition', 'Preposition'],
  ['pronoun', 'Pronoun'],
  ['other', 'Other'],
]

export const DEFAULT_FILTERS = {
  cefrLevel: '', partOfSpeech: '', masteryRange: '', accuracyRange: '', manualWeak: '', sort: 'WEAKEST_FIRST',
}

function SelectField({ label, name, value, onChange, children }) {
  return <label className="filter-field"><span>{label}</span><select name={name} value={value} onChange={onChange}>{children}</select></label>
}

export default function WeakVocabularyFilters({ filters, onChange, includeAccuracy = true }) {
  return <div className="filter-grid">
    <SelectField label="CEFR" name="cefrLevel" value={filters.cefrLevel} onChange={onChange}><option value="">Tất cả trình độ</option>{CEFR_LEVELS.slice(1).map((level) => <option key={level} value={level}>{level}</option>)}</SelectField>
    <SelectField label="Loại từ" name="partOfSpeech" value={filters.partOfSpeech} onChange={onChange}>{PARTS_OF_SPEECH.map(([value, label]) => <option key={value || 'all'} value={value}>{label}</option>)}</SelectField>
    <SelectField label="Mastery" name="masteryRange" value={filters.masteryRange} onChange={onChange}><option value="">Tất cả mức độ</option><option value="0-25">Rất yếu: 0–25</option><option value="26-50">Yếu: 26–50</option><option value="51-75">Đang cải thiện: 51–75</option><option value="76-100">Gần thuộc: 76–100</option></SelectField>
    {includeAccuracy && <SelectField label="Độ chính xác" name="accuracyRange" value={filters.accuracyRange} onChange={onChange}><option value="">Tất cả độ chính xác</option><option value="0-24">&lt; 25%</option><option value="25-50">25% – 50%</option><option value="51-75">50% – 75%</option><option value="76-100">≥ 75%</option></SelectField>}
    <SelectField label="Nguồn từ yếu" name="manualWeak" value={filters.manualWeak} onChange={onChange}><option value="">Tất cả</option><option value="false">Tự động phát hiện</option><option value="true">Đánh dấu thủ công</option></SelectField>
    <SelectField label="Sắp xếp" name="sort" value={filters.sort} onChange={onChange}><option value="WEAKEST_FIRST">Yếu nhất trước</option><option value="MASTERY_ASC">Mastery thấp → cao</option><option value="MASTERY_DESC">Mastery cao → thấp</option><option value="ACCURACY_ASC">Accuracy thấp → cao</option><option value="ACCURACY_DESC">Accuracy cao → thấp</option><option value="UPDATED_DESC">Mới cập nhật</option><option value="WORD_ASC">Từ A → Z</option><option value="WORD_DESC">Từ Z → A</option></SelectField>
  </div>
}
