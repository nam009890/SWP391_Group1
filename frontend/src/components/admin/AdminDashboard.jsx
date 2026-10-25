import { t, locale , localizeMessage } from '../../i18n/index.js';
import { useEffect, useState } from 'react';
import { getDashboard } from '../../api/adminApi';
const labels = () => ({ totalUsers: t('admin:tong_nguoi_dung_b3980e'), activeUsers: t('admin:tai_khoan_hoat_dong_58f2e7'), lockedUsers: t('admin:tai_khoan_bi_khoa_c71d15'), totalAdmins: t('admin:tong_quan_tri_vien_fd54b7'), totalDecks: t('admin:tong_bo_deck_01df22'), publicDecks: t('admin:deck_cong_khai_367281'), privateDecks: t('admin:deck_rieng_tu_bf3873'), totalFlashcards: t('admin:tong_flashcard_e70f6f') });
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getDashboard({ signal: controller.signal }).then(r => { setData(r.data); setError(''); })
      .catch(e => { if (e.code !== 'ERR_CANCELED') setError(t('admin:khong_tai_duoc_thong_ke_59deaf')); });
    return () => controller.abort();
  }, [reload]);
  return <section><h1> {t('admin:tong_quan_he_thong_14106e')} </h1><p> {t('admin:du_lieu_hien_tai_tu_he_thong_deck_da_xoa_b1b2c0')} </p>
    {error ? <div className="account-error" role="alert">{localizeMessage(error)}<button onClick={() => setReload(v => v + 1)}> {t('admin:thu_lai_e353f2')} </button></div> : !data ? <p role="status"> {t('admin:ang_tai_thong_ke_2c340f')} </p> : <div className="admin-metrics">{Object.entries(labels()).map(([key, label]) => <article className="account-card" key={key}><p>{label}</p><strong>{data[key].toLocaleString(locale())}</strong></article>)}</div>}
  </section>;
}
