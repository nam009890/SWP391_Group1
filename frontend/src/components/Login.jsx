import { t, localizeMessage, apiError } from '../i18n/index.js';
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

function Login({ onAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => {
    const code = new URLSearchParams(location.search).get('error');
    if (['ACCOUNT_LOCKED', 'OAUTH_LINK_REQUIRED', 'OAUTH_FAILED'].includes(code)) return apiError(code);
    if (code) return t('auth:ang_nhap_google_that_bai_vui_long_thu_la_07482e');
    return sessionStorage.getItem('authNotice') || '';
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      const { token } = response.data;
      sessionStorage.removeItem('authNotice');
      onAuthenticated(token);
      const from = location.state?.from;
      navigate(typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : '/', { replace: true });
    } catch (err) {
      setError(!err.response ? t('auth:khong_ket_noi_duoc_may_chu_vui_long_thu__86fe7a') : err.response.data?.message || (err.response.status === 401 ? t('auth:sai_email_hoac_mat_khau_43383d') : t('auth:ang_nhap_that_bai_vui_long_thu_lai_f77907')));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (location.state?.from) sessionStorage.setItem('authReturnTo', location.state.from);
    window.location.href = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '') + '/oauth2/authorization/google';
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - var(--nav-height, 70px))', paddingTop: 'calc(var(--nav-height, 70px) + 30px)', paddingBottom: '40px' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--primary)' }}> {t('auth:ang_nhap_ac20d4')} </h2>
        
        {location.state?.message && <p className="account-success" role="status">{location.state.message}</p>}
        {error && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{localizeMessage(error)}</div>}
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}> {t('auth:email_84add5')} </label>
            <input 
              type="email" 
              className="glass-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder={t('auth:nhap_email_cua_ban_574dd0')}
            />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}> {t('auth:mat_khau_888c9c')} </label>
            <input 
              type="password" 
              className="glass-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder={t('auth:nhap_mat_khau_19cf7f')}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px' }} disabled={loading}>
            {loading ? t('auth:ang_xu_ly_e8c1fa') : t('auth:ang_nhap_ac20d4')}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--text-muted)' }}> {t('auth:hoac_a12104')} </div>

        <button onClick={handleGoogleLogin} className="btn btn-glass" style={{ width: '100%', padding: '12px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <span>G</span> {t('auth:ang_nhap_voi_google_a13ba6')} </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}> {t('auth:chua_co_tai_khoan_181de2')} <Link to="/register" style={{ color: 'var(--secondary)', textDecoration: 'none' }}> {t('auth:ang_ky_ngay_b329e6')} </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
