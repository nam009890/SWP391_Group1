import { t , localizeMessage } from '../../i18n/index.js';
import { useEffect, useRef, useState } from 'react';
import { setUserLock } from '../../api/adminApi';
export default function ConfirmActionModal({ user, onClose, onSuccess }) {
  const dialog = useRef(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = user.status !== 'LOCKED';
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    if (lock && (reason.trim().length < 5 || reason.trim().length > 500)) { setError(t('admin:ly_do_can_5_500_ky_tu_c2483d')); return; }
    setBusy(true); setError('');
    try { const { data } = await setUserLock(user.id, lock, reason.trim()); onSuccess(data); }
    catch (err) { setError(err.response?.data?.message || t('admin:thao_tac_that_bai_vui_long_thu_lai_51fffc')); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="account-modal" aria-labelledby="lock-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={submit} className="account-form"><h2 id="lock-title">{lock ? t('admin:khoa_tai_khoan_72b316') : t('admin:mo_khoa_tai_khoan_68f02e')}</h2>
      <p><strong>{user.name}</strong><br />{user.email}</p>
      <p>{lock ? t('admin:ban_co_chac_muon_khoa_tai_khoan_nay_nguo_ebba47') : t('admin:sau_khi_mo_khoa_nguoi_dung_co_the_dang_n_e007c4')}</p>
      {lock && <label> {t('admin:ly_do_khoa_8bfd96')} <textarea autoFocus required minLength={5} maxLength={500} rows={4} value={reason} onChange={e => setReason(e.target.value)} /></label>}
      {error && <p className="account-error" role="alert">{localizeMessage(error)}</p>}
      <div className="account-actions"><button className="btn btn-glass" type="button" disabled={busy} onClick={onClose}> {t('admin:huy_34ca76')} </button><button className="btn btn-primary" disabled={busy}>{busy ? t('admin:ang_xu_ly_a2e96c') : t('admin:xac_nhan_d53daf')}</button></div>
    </form>
  </dialog>;
}
