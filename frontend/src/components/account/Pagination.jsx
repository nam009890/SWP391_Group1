import { t } from '../../i18n/index.js';
export default function Pagination({ data, busy, onPage, onSize }) {
  if (!data) return null;
  return <div className="account-pagination">
    <span>{data.totalElements} {t('profile:ban_ghi_trang_23e77d')} {data.number + 1}/{Math.max(1, data.totalPages)}</span>
    <label> {t('profile:so_dong_3b801f')} <select value={data.size} disabled={busy} onChange={e => onSize(Number(e.target.value))}>
      {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
    </select></label>
    <button className="btn btn-glass" disabled={busy || data.first} onClick={() => onPage(data.number - 1)}> {t('profile:truoc_42b0ca')} </button>
    <button className="btn btn-glass" disabled={busy || data.last} onClick={() => onPage(data.number + 1)}> {t('profile:sau_68196a')} </button>
  </div>;
}
