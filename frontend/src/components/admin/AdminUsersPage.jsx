import { t, locale , localizeMessage } from '../../i18n/index.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../../api/adminApi';
import Avatar from '../account/Avatar';
import Pagination from '../account/Pagination';
import ConfirmActionModal from './ConfirmActionModal';
export default function AdminUsersPage({ user: actor }) {
  const [query, setQuery] = useState({ page: 0, size: 10, keyword: '', role: 'ALL', status: 'ALL', sort: 'NEWEST' });
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError('');
    getUsers(query, controller.signal).then(r => setData(r.data))
      .catch(e => { if (e.code !== 'ERR_CANCELED') setError(e.response?.data?.message || t('admin:khong_tai_duoc_danh_sach_f6dbb3')); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [query, reload]);
  const filter = (key, value) => setQuery(q => ({ ...q, [key]: value, page: 0 }));
  return <section><h1> {t('admin:quan_ly_nguoi_dung_422bb6')} </h1>
    <form className="admin-filters account-card" onSubmit={e => { e.preventDefault(); filter('keyword', keyword.trim()); }}>
      <label> {t('admin:tim_ten_hoac_email_d4eb6e')} <input value={keyword} maxLength={255} onChange={e => setKeyword(e.target.value)} placeholder={t('admin:nhap_ten_hoac_email_082989')} /></label>
      <button className="btn btn-primary"> {t('admin:tim_kiem_667192')} </button><button className="btn btn-glass" type="button" onClick={() => { setKeyword(''); filter('keyword', ''); }}> {t('admin:xoa_tim_kiem_d8f702')} </button>
      <label> {t('admin:vai_tro_295353')} <select value={query.role} onChange={e => filter('role', e.target.value)}><option value="ALL"> {t('admin:tat_ca_f7a578')} </option><option value="ROLE_USER"> {t('admin:hoc_vien_b3aa7e')} </option><option value="ROLE_ADMIN"> {t('admin:quan_tri_vien_2aeb82')} </option></select></label>
      <label> {t('admin:trang_thai_e03c14')} <select value={query.status} onChange={e => filter('status', e.target.value)}><option value="ALL"> {t('admin:tat_ca_f7a578')} </option><option value="ACTIVE"> {t('admin:hoat_dong_ad939f')} </option><option value="LOCKED"> {t('admin:bi_khoa_ddc02b')} </option></select></label>
      <label> {t('admin:sap_xep_e4d524')} <select value={query.sort} onChange={e => filter('sort', e.target.value)}>{[['NEWEST',t('admin:moi_nhat_41fd3e')],['OLDEST',t('admin:cu_nhat_9d3b37')],['NAME_ASC',t('admin:ten_a_z_73ace6')],['NAME_DESC',t('admin:ten_z_a_cee789')],['EMAIL_ASC',t('admin:email_a_z_19608e')],['EMAIL_DESC',t('admin:email_z_a_4d8a92')]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
    </form>
    {message && <p role="status" className="account-success">{localizeMessage(message)}</p>}
    {error && <div className="account-error" role="alert">{localizeMessage(error)}<button onClick={() => setReload(v => v + 1)}> {t('admin:thu_lai_e353f2')} </button></div>}
    {busy && <p role="status"> {t('admin:ang_tai_nguoi_dung_81face')} </p>}
    <div className="account-card account-table" aria-busy={busy}><table><thead><tr>{['ID',t('admin:anh_c893f9'),t('admin:ho_ten_3da3c8'),'Email',t('admin:vai_tro_295353'),'Provider',t('admin:trang_thai_e03c14'),t('admin:ngay_tao_8b2d9e'),t('admin:thao_tac_fed024')].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
      {data?.content.map(u => <tr key={u.id}><td>{u.id}</td><td><Avatar user={u} /></td><td><Link to={'/admin/users/' + u.id}>{u.name || t('admin:chua_dat_ten_dfb078')}</Link></td><td>{u.email}</td><td>{u.role === 'ROLE_ADMIN' ? t('admin:quan_tri_vien_2aeb82') : t('admin:hoc_vien_b3aa7e')}</td><td>{u.provider}</td><td><span className={'account-badge ' + (u.status === 'LOCKED' ? 'locked' : '')}>{u.status === 'LOCKED' ? t('admin:bi_khoa_ddc02b') : t('admin:hoat_dong_ad939f')}</span></td><td>{u.createdAt ? new Date(u.createdAt + 'Z').toLocaleDateString(locale()) : '—'}</td><td><Link to={'/admin/users/' + u.id}> {t('admin:chi_tiet_d72a63')} </Link>{u.role !== 'ROLE_ADMIN' && u.id !== actor.id && <button className="btn btn-glass" disabled={busy} onClick={() => setTarget(u)}>{u.status === 'LOCKED' ? t('admin:mo_khoa_ae457c') : t('admin:khoa_08f750')}</button>}</td></tr>)}
      {!busy && !error && !data?.content.length && <tr><td colSpan={9}> {t('admin:khong_tim_thay_nguoi_dung_phu_hop_b87a68')} </td></tr>}
    </tbody></table></div>
    <Pagination data={data} busy={busy} onPage={page => setQuery(q => ({ ...q, page }))} onSize={size => setQuery(q => ({ ...q, size, page: 0 }))} />
    {target && <ConfirmActionModal user={target} onClose={() => setTarget(null)} onSuccess={() => { setTarget(null); setMessage('Đã cập nhật trạng thái tài khoản.'); setReload(v => v + 1); }} />}
  </section>;
}
