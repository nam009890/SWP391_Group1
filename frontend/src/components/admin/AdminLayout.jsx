import { t } from '../../i18n/index.js';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../account/account.css';
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  return <main className="admin-shell">
    <aside className="admin-sidebar account-card">
      <header><h2> {t('admin:quan_tri_studye_d03bf0')} </h2><button className="btn btn-glass admin-toggle" aria-expanded={open} onClick={() => setOpen(!open)}> {t('admin:menu_57f5f5')} </button></header>
      <nav className={open ? 'open' : ''} aria-label={t('admin:ieu_huong_quan_tri_6cf5c8')} onClick={() => setOpen(false)}>
        <NavLink end to="/admin"> {t('admin:tong_quan_286a38')} </NavLink>
        <NavLink to="/admin/users"> {t('admin:quan_ly_nguoi_dung_422bb6')} </NavLink>
        <NavLink to="/admin/audit-logs"> {t('admin:nhat_ky_quan_tri_24196d')} </NavLink>
        <NavLink to="/profile"> {t('admin:ho_so_cua_toi_fc70cf')} </NavLink>
        <NavLink to="/"> {t('admin:ve_trang_chu_86376d')} </NavLink>
      </nav>
    </aside>
    <div className="admin-content"><Outlet /></div>
  </main>;
}
