import { t , localizeMessage } from '../../i18n/index.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword } from '../../api/profileApi';
import Avatar from './Avatar';
import './account.css';

export default function ProfilePage({ onProfileUpdated, onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', avatarUrl: '', bio: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reload, setReload] = useState(0);
  const reset = data => setForm({ name: data.name || '', avatarUrl: data.avatarUrl || '', bio: data.bio || '' });
  useEffect(() => {
    let active = true;
    getProfile().then(({ data }) => { if (active) { setProfile(data); reset(data); setError(''); } })
      .catch(e => { if (active) setError(e.response?.data?.message || t('profile:khong_tai_duoc_ho_so_08daa3')); });
    return () => { active = false; };
  }, [reload]);
  const save = async e => {
    e.preventDefault();
    if (busy) return;
    setError(''); setMessage('');
    if (form.name.trim().length < 2 || form.name.trim().length > 100) { setError(t('profile:ten_can_2_100_ky_tu_19763d')); return; }
    if (form.avatarUrl && !/^https?:\/\//i.test(form.avatarUrl.trim())) { setError(t('profile:anh_dai_dien_phai_la_url_http_s_4fbdf9')); return; }
    setBusy(true);
    try {
      const { data } = await updateProfile(form);
      setProfile(data); reset(data);
      await onProfileUpdated();
      setMessage(t('profile:a_cap_nhat_ho_so_6cb498'));
    } catch (err) { setError(err.response?.data?.message || t('profile:khong_luu_duoc_ho_so_vui_long_thu_lai_ffa65b')); }
    finally { setBusy(false); }
  };
  const savePassword = async e => {
    e.preventDefault();
    if (busy) return;
    setError(''); setMessage('');
    if (password.newPassword !== password.confirmPassword) { setError(t('profile:mat_khau_xac_nhan_khong_khop_848a9c')); return; }
    if (password.newPassword.length < 10 || !/[A-Z]/.test(password.newPassword) || !/[a-z]/.test(password.newPassword) || !/[0-9]/.test(password.newPassword) || new TextEncoder().encode(password.newPassword).length > 72) {
      setError(t('profile:mat_khau_can_it_nhat_10_ky_tu_co_chu_hoa_fdbc58')); return;
    }
    setBusy(true);
    try {
      await changePassword(password);
      onLogout();
      navigate('/login', { replace: true, state: { message: t('profile:oi_mat_khau_thanh_cong_vui_long_dang_nha_454cc7') } });
    } catch (err) { setError(err.response?.data?.message || t('profile:khong_doi_duoc_mat_khau_29d3a3')); }
    finally { setBusy(false); }
  };
  return <main className="account-page">
    <h1> {t('profile:ho_so_ca_nhan_b70d1e')} </h1>
    {error && <div className="account-error" role="alert">{localizeMessage(error)}{!profile && <button onClick={() => setReload(v => v + 1)}> {t('profile:thu_lai_e353f2')} </button>}</div>}
    {message && <p className="account-success" role="status">{localizeMessage(message)}</p>}
    {!profile ? <p role="status"> {t('profile:ang_tai_ho_so_04959b')} </p> : <>
      <header className="account-card profile-header"><Avatar user={{ ...profile, avatarUrl: form.avatarUrl }} /><div><h2>{profile.name}</h2><p>{profile.email}</p><p>{profile.role === 'ROLE_ADMIN' ? t('profile:quan_tri_vien_2aeb82') : t('profile:hoc_vien_b3aa7e')} · {profile.provider}</p></div></header>
      <div className="profile-columns">
        <form className="account-card account-form" onSubmit={save}>
          <h2> {t('profile:thong_tin_ca_nhan_5de3e5')} </h2>
          <label> {t('profile:ho_ten_3da3c8')} <input required minLength={2} maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label> {t('profile:email_84add5')} <input value={profile.email} readOnly /></label>
          <label> {t('profile:url_anh_dai_dien_9d47af')} <input type="url" maxLength={255} value={form.avatarUrl} placeholder="https://…" onChange={e => setForm({ ...form, avatarUrl: e.target.value })} /></label>
          <label> {t('profile:gioi_thieu_f4272d')} <textarea rows={4} maxLength={500} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></label>
          <small>{form.bio.length} {t('profile:500_ky_tu_57bc4e')} </small>
          <div className="account-actions"><button className="btn btn-primary" disabled={busy}>{busy ? t('profile:ang_luu_b98712') : t('profile:luu_thay_doi_c05f72')}</button><button className="btn btn-glass" type="button" disabled={busy} onClick={() => reset(profile)}> {t('profile:huy_thay_doi_043c52')} </button></div>
        </form>
        <section className="account-card"><h2> {t('profile:bao_mat_f81dde')} </h2>
          {profile.provider !== 'LOCAL' ? <p> {t('profile:tai_khoan_dung_google_hay_quan_ly_mat_kh_53306c')} </p> : <form className="account-form" onSubmit={savePassword}>
            <p> {t('profile:it_nhat_10_ky_tu_co_chu_hoa_chu_thuong_v_116930')} </p>
            {[['currentPassword', t('profile:mat_khau_hien_tai_9a3c63')], ['newPassword', t('profile:mat_khau_moi_4267a6')], ['confirmPassword', t('profile:xac_nhan_mat_khau_7386c6')]].map(([key, label]) => <label key={key}>{label}<input type={show ? 'text' : 'password'} required autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} value={password[key]} onChange={e => setPassword({ ...password, [key]: e.target.value })} /></label>)}
            <label className="checkbox-label"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> {t('profile:hien_mat_khau_b56a27')} </label>
            <button className="btn btn-primary" disabled={busy}> {t('profile:oi_mat_khau_d4e1de')} </button>
          </form>}
        </section>
      </div>
    </>}
  </main>;
}
