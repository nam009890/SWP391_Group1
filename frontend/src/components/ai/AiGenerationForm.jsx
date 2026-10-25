import { t } from '../../i18n/index.js';
export default function AiGenerationForm({ form, onChange, options, disabled, onSubmit }) {
  const update = (field, value) => onChange({ ...form, [field]: value });
  return <form onSubmit={onSubmit} className="ai-v2-form">
    <label> {t('ai:chu_de_95f745')} <input required maxLength={300} value={form.topic} disabled={disabled} onChange={e => update('topic', e.target.value)} placeholder={t('ai:travel_business_english_hoac_chu_de_rien_f228fd')} /></label>
    <div className="ai-v2-grid">
      <label> {t('ai:muc_cefr_gan_dung_8b28e2')} <select disabled={disabled || options.source === 'DEMO_LIBRARY'} value={form.level} onChange={e => update('level', e.target.value)}>
        {options.levels.map(level => <option key={level}>{level}</option>)}
      </select></label>
      <label> {t('ai:so_the_b7746b')} <select disabled={disabled} value={form.count} onChange={e => update('count', Number(e.target.value))}>
        {options.counts.map(count => <option key={count}>{count}</option>)}
      </select></label>
      <label> {t('ai:loai_tu_235646')} <select disabled={disabled} value={form.type} onChange={e => update('type', e.target.value)}>
        <option value="WORD"> {t('ai:tu_don_8e4787')} </option><option value="PHRASE"> {t('ai:cum_tu_b59c9e')} </option><option value="MIXED"> {t('ai:ket_hop_729326')} </option>
      </select></label>
    </div>
    <label> {t('ai:ngu_canh_hoc_tuy_chon_74348e')} <input maxLength={300} value={form.context} disabled={disabled} onChange={e => update('context', e.target.value)} placeholder={t('ai:workplace_travel_ielts_a80963')} /></label>
    <button className="btn btn-primary" disabled={disabled || !options.enabled || !options.counts.length}> {t('ai:tao_ban_xem_truoc_a160b2')} </button>
  </form>;
}
