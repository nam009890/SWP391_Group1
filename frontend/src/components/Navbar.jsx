import { t } from '../i18n/index.js';
import React, { useEffect, useRef, useState } from 'react';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import Avatar from './account/Avatar';
import './account/account.css';

const Navbar = ({ user, onLogout, authLoading = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const menu = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (menu.current) menu.current.open = false;
    setMobileOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape' || (event.type === 'pointerdown' && !menu.current?.contains(event.target))) {
        if (menu.current) menu.current.open = false;
        if (event.key === 'Escape') setMobileOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">S</span>
          <div><h2>StudyE</h2><small> {t('navigation:hoc_vui_moi_ngay_15e62f')} </small></div>
        </div>

        <LanguageSwitcher />
        <button className="nav-mobile-toggle btn btn-glass" aria-label="Menu" aria-expanded={mobileOpen} aria-controls="main-navigation" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
        <div id="main-navigation" className={`navbar-menu ${mobileOpen ? 'is-open' : ''}`}>
          {user ? (
            <div className="user-profile">
              <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}> {t('navigation:explore_decks_254356')} </button>
              <button className={`nav-link ${isActive('/my-decks') ? 'active' : ''}`} onClick={() => navigate('/my-decks')}> {t('navigation:my_decks_4f3291')} </button>
              <button className={`nav-link ${isActive('/grammar') ? 'active' : ''}`} onClick={() => navigate('/grammar')}> {t('navigation:grammar_dd1734')} </button>
              <button className={`nav-link ${location.pathname === '/weak-vocabulary' ? 'active' : ''}`} onClick={() => navigate('/weak-vocabulary')}> {t('navigation:weak_vocabulary_d9bcb5')} </button>
              <button className={`nav-link ${location.pathname.startsWith('/weak-vocabulary/practice') ? 'active' : ''}`} onClick={() => navigate('/weak-vocabulary/practice')}> {t('navigation:practice_3e15ac')} </button>
              {user.role === 'ROLE_ADMIN' && <button className="nav-link" onClick={() => navigate('/admin')}> {t('navigation:quan_tri_152f9b')} </button>}
              <details ref={menu} className="nav-profile-menu">
                <summary title={user.name}><Avatar user={user} /><span>{user.name}</span></summary>
                <div className="nav-profile-dropdown">
                  <button className="nav-link" onClick={() => navigate('/profile')}> {t('navigation:ho_so_ca_nhan_b70d1e')} </button>
                  {user.role === 'ROLE_ADMIN' && <button className="nav-link" onClick={() => navigate('/admin')}> {t('navigation:quan_tri_he_thong_aafe05')} </button>}
                  <button className="logout-btn" onClick={onLogout}> {t('navigation:ang_xuat_d513aa')} </button>
                </div>
              </details>
            </div>
          ) : authLoading ? <span aria-busy="true">…</span> : (
            <div className="user-profile"><button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}> {t('navigation:explore_decks_254356')} </button><button className="btn btn-glass" onClick={() => navigate('/login')}> {t('navigation:login_4e5a28')} </button><button className="btn btn-primary" onClick={() => navigate('/register')}> {t('navigation:register_d67299')} </button></div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
