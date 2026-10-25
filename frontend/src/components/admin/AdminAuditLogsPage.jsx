import { t, locale , localizeMessage } from '../../i18n/index.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuditLogs } from '../../api/adminApi';
import Pagination from '../account/Pagination';
export default function AdminAuditLogsPage() {
  const [query, setQuery] = useState({ page: 0, size: 10, action: 'ALL', targetUserId: '', adminId: '' });
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError('');
    const params = { ...query, targetUserId: query.targetUserId || undefined, adminId: query.adminId || undefined };
    getAuditLogs(params, controller.signal).then(r => setData(r.data))
      .catch(e => { if (e.code !== 'ERR_CANCELED') setError(e.response?.data?.message || t('admin:khong_tai_duoc_nhat_ky_71d8ec')); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [query, reload]);
  return <section><h1> {t('admin:nhat_ky_quan_tri_24196d')} </h1><p> {t('admin:lich_su_thao_tac_khoa_va_mo_khoa_nhat_ky_f6235e')} </p>
    <div className="admin-filters account-card"><label> {t('admin:hanh_dong_8e9fdd')} <select value={query.action} onChange={e => setQuery(q => ({ ...q, page: 0, action: e.target.value }))}><option value="ALL"> {t('admin:tat_ca_f7a578')} </option><option value="LOCK_USER"> {t('admin:khoa_tai_khoan_72b316')} </option><option value="UNLOCK_USER"> {t('admin:mo_khoa_tai_khoan_68f02e')} </option></select></label>
      <label> {t('admin:id_nguoi_dung_a56c58')} <input type="number" min="1" value={query.targetUserId} onChange={e => setQuery(q => ({ ...q, page: 0, targetUserId: e.target.value }))} /></label>
      <label> {t('admin:id_quan_tri_vien_2e37a8')} <input type="number" min="1" value={query.adminId} onChange={e => setQuery(q => ({ ...q, page: 0, adminId: e.target.value }))} /></label>
    </div>
    {error && <div role="alert" className="account-error">{localizeMessage(error)}<button onClick={() => setReload(v => v + 1)}> {t('admin:thu_lai_e353f2')} </button></div>}
    {busy && <p role="status"> {t('admin:ang_tai_nhat_ky_ebb4ad')} </p>}
    <div className="account-card account-table" aria-busy={busy}><table><thead><tr>{[t('admin:thoi_gian_83cf09'),t('admin:quan_tri_vien_2aeb82'),t('admin:nguoi_dung_0f366f'),t('admin:hanh_dong_8e9fdd'),t('admin:ly_do_ecdb46')].map(l => <th key={l}>{l}</th>)}</tr></thead><tbody>
      {data?.content.map(l => <tr key={l.id}><td>{new Date(l.createdAt + 'Z').toLocaleString(locale())}</td><td>{l.adminName}<br />{l.adminEmail}</td><td><Link to={'/admin/users/' + l.targetUserId}>{l.targetUserName}</Link><br />{l.targetUserEmail}</td><td><span className={'account-badge ' + (l.action === 'LOCK_USER' ? 'locked' : '')}>{l.action === 'LOCK_USER' ? t('admin:khoa_tai_khoan_72b316') : t('admin:mo_khoa_tai_khoan_68f02e')}</span></td><td>{l.reason || '—'}</td></tr>)}
      {!busy && !error && !data?.content.length && <tr><td colSpan={5}> {t('admin:chua_co_thao_tac_phu_hop_e91cbb')} </td></tr>}
    </tbody></table></div>
    <Pagination data={data} busy={busy} onPage={page => setQuery(q => ({ ...q, page }))} onSize={size => setQuery(q => ({ ...q, size, page: 0 }))} />
  </section>;
}
