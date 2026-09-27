import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Show grammar quick-access pill only on non-grammar pages
  const isOnGrammarPage = location.pathname.startsWith('/grammar');

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">⚡</span>
          <h2>StudyE</h2>
        </div>

        {/* Grammar quick-access pill — visible on flashcard pages only */}
        {!isOnGrammarPage && (
          <button
            className="btn btn-glass grammar-pill-btn"
            onClick={() => navigate('/grammar')}
            title="Luyện Tập Ngữ Pháp"
          >
            ✏️ <span className="grammar-pill-text">Bài Tập</span>
          </button>
        )}

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
