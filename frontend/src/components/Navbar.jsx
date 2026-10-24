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
              <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>Explore Decks</button>
              <button className={`nav-link ${isActive('/my-decks') ? 'active' : ''}`} onClick={() => navigate('/my-decks')}>My Decks</button>
              <button className={`nav-link ${isActive('/grammar') ? 'active' : ''}`} onClick={() => navigate('/grammar')}>Grammar</button>
              <button className={`nav-link ${location.pathname === '/weak-vocabulary' ? 'active' : ''}`} onClick={() => navigate('/weak-vocabulary')}>Weak Vocabulary</button>
              <button className={`nav-link ${location.pathname.startsWith('/weak-vocabulary/practice') ? 'active' : ''}`} onClick={() => navigate('/weak-vocabulary/practice')}>Practice</button>
              <button className="nav-avatar" title={user.name}>{(user.name || 'U').charAt(0).toUpperCase()}</button>
              <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <div className="user-profile"><button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>Explore Decks</button><button className="btn btn-glass" onClick={() => navigate('/login')}>Login</button><button className="btn btn-primary" onClick={() => navigate('/register')}>Register</button></div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
