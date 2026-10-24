import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">S</span>
          <div><h2>StudyE</h2><small>Học vui mỗi ngày</small></div>
        </div>

        <div className="navbar-menu">
          {user ? (
            <div className="user-profile">
              <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>Trang chủ</button>
              <button className={`nav-link ${isActive('/grammar') ? 'active' : ''}`} onClick={() => navigate('/grammar')}>Ngữ pháp</button>
              <button className={`nav-link ${isActive('/weak-vocabulary') ? 'active' : ''}`} onClick={() => navigate('/weak-vocabulary')}>Từ cần ôn</button>
              <button className="nav-avatar" title={user.name}>{(user.name || 'U').charAt(0).toUpperCase()}</button>
              <button className="logout-btn" onClick={onLogout}>Đăng xuất</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Đăng nhập</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
