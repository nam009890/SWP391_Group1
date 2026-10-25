import { t , localizeMessage } from '../i18n/index.js';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

function Register({ onAuthenticated }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError(t('auth:mat_khau_nhap_lai_khong_khop_ac3f19'));
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password
      });
      
      const { token } = response.data;
      onAuthenticated(token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('auth:co_loi_xay_ra_khi_dang_ky_b84fbd'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - var(--nav-height, 70px))', paddingTop: 'calc(var(--nav-height, 70px) + 30px)', paddingBottom: '40px' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--secondary)' }}> {t('auth:tao_tai_khoan_fdf91c')} </h2>
        
        {error && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{localizeMessage(error)}</div>}
        
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}> {t('auth:ten_hien_thi_1e9d85')} </label>
            <input 
              type="text" 
              className="glass-input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder={t('auth:vd_nguyen_van_a_cf4184')}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
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
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}> {t('auth:mat_khau_888c9c')} </label>
            <input 
              type="password" 
              className="glass-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder={t('auth:tao_mat_khau_c9f9ff')}
            />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}> {t('auth:xac_nhan_mat_khau_7386c6')} </label>
            <input 
              type="password" 
              className="glass-input" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder={t('auth:nhap_lai_mat_khau_4ff37e')}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px', background: 'linear-gradient(135deg, var(--secondary), var(--accent))' }} disabled={loading}>
            {loading ? t('auth:ang_xu_ly_e8c1fa') : t('auth:ang_ky_ngay_20f530')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}> {t('auth:a_co_tai_khoan_b9cf54')} <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}> {t('auth:ang_nhap_1d5caf')} </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
