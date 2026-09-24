import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isCreatorUser } from './grammar/authHelper';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const hasCreatorAccess = isCreatorUser(user);

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">⚡</span>
          <h2>StudyE</h2>
        </div>

        <div className="navbar-links">
          <button
            className={`btn ${isActive('/') ? 'btn-primary' : 'btn-glass'} nav-link-btn`}
            onClick={() => navigate('/')}
          >
            🗂️ Flashcards
          </button>
          <button
            className={`btn ${isActive('/grammar') ? 'btn-primary' : 'btn-glass'} nav-link-btn`}
            onClick={() => navigate('/grammar')}
          >
            ✏️ Luyện Ngữ Pháp
          </button>
          {hasCreatorAccess && (
            <button
              className={`btn ${isActive('/grammar/admin') ? 'btn-primary' : 'btn-glass'} nav-link-btn creator-nav-btn`}
              onClick={() => navigate('/grammar/admin')}
              title="Chỉ dành cho Creator"
            >
              🛠️ Soạn Câu Hỏi
            </button>
          )}
        </div>
        
        <div className="navbar-menu">
          {user ? (
            <div className="user-profile">
              <span className="welcome-text">Hi, {user.name}</span>
              <button className="btn btn-glass" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

