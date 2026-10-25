import { t, locale , localizeMessage } from '../../i18n/index.js';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUser } from '../../api/adminApi';
import Avatar from '../account/Avatar';
import ConfirmActionModal from './ConfirmActionModal';
const time = value => value ? new Date(value + 'Z').toLocaleString(locale()) : '—';
export default function AdminUserDetailsPage({ user: actor }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    getUser(id, controller.signal).then(r => setData(r.data))
      .catch(e => { if (e.code !== 'ERR_CANCELED') setError(e.response?.data?.message || t('admin:khong_tai_duoc_nguoi_dung_04d1fa')); });
    return () => controller.abort();
  }, [id, reload]);
  const u = data?.account;
  return <section><Link to="/admin/users"> {t('admin:danh_sach_nguoi_dung_f1ac84')} </Link><h1> {t('admin:chi_tiet_tai_khoan_d22e5f')} </h1>
    {error && <div className="account-error" role="alert">{localizeMessage(error)}<button onClick={() => setReload(v => v + 1)}> {t('admin:thu_lai_e353f2')} </button></div>}
    {message && <p className="account-success" role="status">{localizeMessage(message)}</p>}
    {!data && !error && <p role="status"> {t('admin:ang_tai_chi_tiet_2c4fb0')} </p>}
    {u && <article className="account-card"><header className="profile-header"><Avatar user={u} /><div><h2>{u.name}</h2><p>{u.email}</p><span className={'account-badge ' + (u.status === 'LOCKED' ? 'locked' : '')}>{u.status === 'LOCKED' ? t('admin:bi_khoa_ddc02b') : t('admin:hoat_dong_ad939f')}</span></div></header>
      <dl className="account-details">{[['ID',u.id],[t('admin:vai_tro_295353'),u.role],['Provider',u.provider],[t('admin:ngay_tao_8b2d9e'),time(u.createdAt)],[t('admin:cap_nhat_8f92d9'),time(data.updatedAt)],[t('admin:ang_nhap_gan_nhat_dc0a7f'),time(data.lastLoginAt)],[t('admin:gioi_thieu_f4272d'),data.bio || '—'],[t('admin:deck_so_huu_5c6140'),data.ownedDeckCount],[t('admin:ngay_khoa_82cf2f'),time(data.lockedAt)],[t('admin:ly_do_khoa_8bfd96'),data.lockedReason || '—'],[t('admin:id_nguoi_khoa_1c2ee1'),data.lockedBy || '—']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {u.role === 'ROLE_ADMIN' || u.id === actor.id ? <p> {t('admin:khong_the_khoa_chinh_minh_hoac_quan_tri__a1a444')} </p> : <button className="btn btn-primary" onClick={() => setModal(true)}>{u.status === 'LOCKED' ? t('admin:mo_khoa_tai_khoan_68f02e') : t('admin:khoa_tai_khoan_72b316')}</button>}
    </article>}
    {modal && <ConfirmActionModal user={u} onClose={() => setModal(false)} onSuccess={updated => { setData(updated); setModal(false); setMessage('Đã cập nhật trạng thái tài khoản.'); }} />}
  </section>;
}
