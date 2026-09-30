import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">⚡</span>
          <h2>StudyE</h2>
        </div>
        
        <div className="navbar-menu">
          {user ? (
            <div className="user-profile">
              <button className="btn btn-glass" onClick={() => navigate('/')}>Dashboard</button>
              <button className="btn btn-glass" onClick={() => navigate('/weak-vocabulary')}>Từ yếu</button>
              <button className="btn btn-glass" onClick={() => navigate('/weak-vocabulary/practice')}>Ôn luyện</button>
              <span className="welcome-text">Hi, {user.name}</span>
              <button className="btn btn-glass" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/')}>Login</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
