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
            <div className="user-profile" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate('/')}>My Decks</span>
              <span style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--secondary)' }} onClick={() => navigate('/community')}>Community</span>
              
              <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
              <span 
                className="welcome-text" 
                style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.5)' }} 
                onClick={() => user.id && navigate(`/user/${user.id}`)}
                title="View My Profile"
              >
                Hi, {user.name}
              </span>
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
