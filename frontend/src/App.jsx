import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DeckDetails from './components/DeckDetails';
import Login from './components/Login';
import Register from './components/Register';
import StudyMode from './components/StudyMode';
import api from './api/axiosConfig';

function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Processing login...</div>;
}

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '100px 20px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      <h1 style={{ fontSize: '48px', marginBottom: '20px', background: 'linear-gradient(135deg, var(--primary), var(--secondary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'hueRotate 5s linear infinite' }}>
        Master Languages with StudyE
      </h1>
      <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>
        The next-generation flashcard app. Ditch the boring flat design and learn vocabulary with futuristic 3D cards and spaced repetition.
      </p>
      
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '18px', borderRadius: '30px' }}>
          Đăng Nhập
        </button>
        <button onClick={() => navigate('/register')} className="btn btn-glass" style={{ padding: '16px 32px', fontSize: '18px', borderRadius: '30px' }}>
          Đăng Ký
        </button>
      </div>
      
      <div style={{ marginTop: '80px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Create</h3>
          <p style={{ color: 'var(--text-muted)' }}>Build custom decks easily</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ color: 'var(--secondary)', marginBottom: '10px' }}>Study</h3>
          <p style={{ color: 'var(--text-muted)' }}>Interactive 3D flip cards</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ color: '#f43f5e', marginBottom: '10px' }}>Master</h3>
          <p style={{ color: 'var(--text-muted)' }}>Remember forever</p>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      // Decode JWT token directly in frontend for demo purposes to get user info
      // In a real app, this should be validated by backend api call
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ name: payload.name || payload.sub, email: payload.email });
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = 'http://localhost:8080/logout'; // Invalidate backend session too
  };

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      
      <Routes>
        <Route path="/" element={token ? <Dashboard user={user} /> : <LandingPage />} />
        <Route path="/login" element={token ? <Dashboard user={user} /> : <Login />} />
        <Route path="/register" element={token ? <Dashboard user={user} /> : <Register />} />
        <Route path="/deck/:id" element={token ? <DeckDetails /> : <LandingPage />} />
        <Route path="/study/:id" element={token ? <StudyMode /> : <LandingPage />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
      </Routes>
    </>
  );
}

export default MainApp;
