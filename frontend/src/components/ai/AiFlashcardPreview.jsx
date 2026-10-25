import { t, locale , localizeMessage } from '../../i18n/index.js';
import { useEffect, useRef, useState } from 'react';
import { commitAiPreview } from '../../api/aiFlashcardApi';

export default function AiFlashcardPreview({ deckId, preview, onSaved, onBusy }) {
  const [cards, setCards] = useState(preview.cards);
  const [selected, setSelected] = useState(() => new Set(preview.cards.map(card => card.candidateId)));
  const [editing, setEditing] = useState(new Set());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const dialog = useRef(null);
  const inFlight = useRef(false);
  const pendingCommit = useRef(null);
  useEffect(() => {
    if (confirm) dialog.current.showModal();
  }, [confirm]);
  const update = (id, field, value) => setCards(current => current.map(card => card.candidateId === id ? { ...card, [field]: value } : card));
  const toggle = id => setSelected(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const save = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    onBusy(true);
    setError('');
    const payload = pendingCommit.current || { generationId: preview.generationId, selectedCards: cards.filter(card => selected.has(card.candidateId)) };
    pendingCommit.current = payload;
    try {
      const { data } = await commitAiPreview(deckId, payload);
      onSaved(data);
    } catch (failure) {
      const unknown = !failure.response || failure.response.status >= 500;
      setUncertain(unknown);
      if (!unknown) pendingCommit.current = null;
      setError(failure.response?.data?.message || t('ai:mat_ket_noi_khi_luu_thu_lai_cung_lua_cho_52e8b8'));
      setConfirm(false);
    } finally {
      inFlight.current = false;
      setSaving(false);
      onBusy(false);
    }
  };
  return <section className="ai-v2-preview">
    <header><h3> {t('ai:xem_truoc_va_chon_the_1e5090')} </h3><p> {t('ai:nguon_dcd2b5')} <strong>{preview.source}</strong> {t('ai:nhan_8a92c6')} {preview.generatedCount} {t('ai:hop_le_dd6e92')} {preview.validCount} {t('ai:a_chon_b67db9')} {selected.size}</p>
      <p> {t('ai:loai_trung_c22309')} {preview.duplicatesExcluded} {t('ai:khong_hop_le_dd3f8b')} {preview.invalidExcluded}</p><p>{preview.message}</p>
      <p> {t('ai:het_han_186bf3')} {new Date(preview.expiresAt + 'Z').toLocaleString(locale())} {t('ai:noi_dung_can_duoc_ban_kiem_tra_truoc_khi_5487b4')} </p>
    </header>
    {error && <p className="form-error" role="alert">{localizeMessage(error)}</p>}
    {uncertain && <p role="status"> {t('ai:ang_giu_nguyen_lua_chon_cua_lan_luu_truo_117a99')} </p>}
    <div className="ai-v2-actions"><button className="btn btn-glass" disabled={saving || uncertain} onClick={() => setSelected(new Set(cards.map(card => card.candidateId)))}> {t('ai:chon_tat_ca_d14d3f')} </button><button className="btn btn-glass" disabled={saving || uncertain} onClick={() => setSelected(new Set())}> {t('ai:bo_chon_tat_ca_c1aecf')} </button></div>
    <div className="ai-v2-candidates">{cards.map((card, index) => {
      const warning = !card.vocabulary.trim() || !card.meaning.trim() || !card.exampleSentence.trim();
      return <article className="ai-v2-candidate" key={card.candidateId}>
        <header><label className="ai-v2-select"><input type="checkbox" checked={selected.has(card.candidateId)} disabled={saving || uncertain} onChange={() => toggle(card.candidateId)} /> {t('ai:the_729dc7')} {index + 1}: {card.vocabulary}</label>
          <button className="btn btn-glass" disabled={saving || uncertain} onClick={() => setEditing(current => {
            const next = new Set(current);
            if (next.has(card.candidateId)) next.delete(card.candidateId); else next.add(card.candidateId);
            return next;
          })}>{editing.has(card.candidateId) ? t('common:done') : t('ai:chinh_sua_b59e65')}</button></header>
        {editing.has(card.candidateId) ? <div className="ai-v2-form">
          {[['vocabulary',t('ai:tu_cum_tu_959aae'),255],['meaning',t('ai:nghia_tieng_viet_73d86d'),255],['phonetic',t('ai:ipa_de_trong_neu_khong_chac_404e23'),255],['exampleSentence',t('ai:cau_vi_du_co_chua_tu_898195'),1000]].map(([field,label,max]) => <label key={field}>{label}<input required={field !== 'phonetic'} maxLength={max} disabled={saving || uncertain} value={card[field] || ''} onChange={e => update(card.candidateId,field,e.target.value)} /></label>)}
        </div> : <><p><strong>{card.meaning}</strong> {card.phonetic && <span>{card.phonetic}</span>}</p><p>{card.exampleSentence}</p></>}
        {warning && <p className="form-error"> {t('ai:the_con_thieu_noi_dung_bat_buoc_sua_hoac_cfd302')} </p>}
      </article>;
    })}</div>
    <button className="btn btn-primary" disabled={saving || selected.size === 0 || cards.some(card => selected.has(card.candidateId) && (!card.vocabulary.trim() || !card.meaning.trim() || !card.exampleSentence.trim()))} onClick={() => setConfirm(true)}>
      {saving ? t('ai:ang_luu_b98712') : uncertain ? t('ai:thu_lai_lan_luu_truoc_063d68') : t('ai:them_the_da_chon_vao_deck_fb9949')}
    </button>
    {confirm && <dialog ref={dialog} className="ai-v2-confirm" onCancel={e => { e.preventDefault(); if (!saving) setConfirm(false); }} aria-labelledby="ai-confirm-title">
      <h3 id="ai-confirm-title"> {t('ai:xac_nhan_them_the_07e8ab')} </h3><p> {t('ai:them_cc8868')} {selected.size} {t('ai:the_da_xem_lai_tu_nguon_b527be')} {preview.source} {t('ai:vao_deck_nay_f2978e')} </p>
      <div className="ai-v2-actions"><button className="btn btn-glass" disabled={saving} onClick={() => setConfirm(false)}> {t('ai:quay_lai_8a09e0')} </button><button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? t('ai:ang_luu_b98712') : t('ai:xac_nhan_luu_3b6603')}</button></div>
    </dialog>}
  </section>;
}
