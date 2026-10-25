import { t , localizeMessage } from '../../i18n/index.js';
import { useEffect, useRef, useState } from 'react';
import { generateAiPreview, generateOfflinePreview, getAiOptions } from '../../api/aiFlashcardApi';
import AiGenerationForm from './AiGenerationForm';
import AiFlashcardPreview from './AiFlashcardPreview';
import './AiFlashcardGenerator.css';

export default function AiFlashcardGenerator({ deckId, onSaved, onClose, onSavingChange }) {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState({ topic: 'Travel', level: 'B1', count: 10, type: 'MIXED', context: 'General English' });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(false);
  const [revision, setRevision] = useState(0);
  const pending = useRef(null);
  const inFlight = useRef(false);
  const controller = useRef(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const cancellation = new AbortController();
    getAiOptions(deckId,cancellation.signal).then(({ data }) => {
      setOptions(data);
      if (data.counts.length) setForm(current => data.counts.includes(current.count) ? current : { ...current, count: data.counts[0] });
    }).catch(failure => {
      if (failure.code !== 'ERR_CANCELED') setError(failure.response?.data?.message || t('ai:khong_tai_duoc_cau_hinh_tao_the_867873'));
    });
    return () => {
      mounted.current = false;
      cancellation.abort();
      controller.current?.abort();
    };
  // Deck đổi sẽ remount component để không dùng preview hoặc request của Deck cũ.
  }, [deckId, revision]);
  const generate = async (event, offline = false) => {
    event.preventDefault();
    if (inFlight.current) return;
    const request = pending.current || { body: { ...form, topic: form.topic.trim(), requestId: crypto.randomUUID() }, offline };
    pending.current = request;
    inFlight.current = true;
    setBusy(true);
    setRetry(false);
    setError('');
    controller.current = new AbortController();
    try {
      const { data } = await (request.offline ? generateOfflinePreview : generateAiPreview)(deckId,request.body,controller.current.signal);
      if (mounted.current) setPreview(data);
    } catch (failure) {
      if (mounted.current && failure.code !== 'ERR_CANCELED') {
        setError(failure.response?.data?.message || t('ai:mat_ket_noi_thu_lai_cung_requestid_de_la_3c7634'));
        setRetry(true);
      }
    } finally {
      if (mounted.current) setBusy(false);
      inFlight.current = false;
    }
  };
  return <section className="ai-v2-panel glass-panel">
    <header className="ai-v2-header"><h3> {t('ai:tao_the_tu_vung_xem_truoc_truoc_khi_luu_3aa946')} </h3><button className="btn btn-glass" disabled={saving} onClick={onClose}> {t('ai:ong_d2b73a')} </button></header>
    {error && <p className="form-error" role="alert">{localizeMessage(error)}</p>}
    {!options ? <button className="btn btn-glass" onClick={() => { setError(''); setRevision(value => value + 1); }}> {t('ai:tai_cau_hinh_thu_lai_8fa682')} </button> : <>
      <p> {t('ai:nguon_hien_tai_5ccb4d')} <strong>{options.source}</strong>. {options.source === 'DEMO_LIBRARY' ? t('ai:thu_vien_tuyen_chon_offline_travel_va_bu_90daf3') : ['OPENAI', 'GEMINI'].includes(options.source) ? t('common:feedback_0', { v0: options.source === 'GEMINI' ? 'Gemini' : 'OpenAI' }) : t('ai:khong_co_yeu_cau_nao_duoc_gui_toi_provid_db7e9d')}</p>
      {!options.enabled && <p role="status"> {t('ai:chuc_nang_dang_duoc_tat_boi_nguoi_van_ha_8f0710')} </p>}
      {!preview && <AiGenerationForm form={form} onChange={setForm} options={options} disabled={busy || retry} onSubmit={generate} />}
      {busy && <p role="status"> {t('ai:ang_tao_the_tu_vung_ban_co_the_dong_giao_eb9b0f')} </p>}
      {retry && <div className="ai-v2-actions"><button className="btn btn-primary" disabled={busy} onClick={generate}> {t('ai:thu_lai_cung_yeu_cau_6071f5')} </button><button className="btn btn-glass" disabled={busy} onClick={() => { pending.current = null; setRetry(false); setError(''); }}> {t('ai:bat_dau_yeu_cau_moi_tinh_han_muc_moi_0f7d25')} </button></div>}
      {retry && options.enabled && options.source !== 'DEMO_LIBRARY' && <div>
        <p> {t('ai:thu_vien_offline_co_san_chi_ho_tro_trave_0c722c')} </p>
        <button className="btn btn-glass" disabled={busy || form.level !== 'B1' || !options.demoTopics.some(topic => topic.toLowerCase() === form.topic.trim().toLowerCase())}
          onClick={event => { pending.current = null; generate(event, true); }}> {t('ai:dung_thu_vien_offline_cho_yeu_cau_nay_49abc9')} </button>
      </div>}
      {preview && <AiFlashcardPreview deckId={deckId} preview={preview} onSaved={onSaved} onBusy={value => { setSaving(value); onSavingChange?.(value); }} />}
    </>}
  </section>;
}
