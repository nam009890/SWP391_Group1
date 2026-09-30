import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

function Register() {
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
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('http://localhost:8080/api/auth/register', {
        name,
        email,
        password
      });
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      // Reload or navigate to trigger App.jsx re-render
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data || 'Có lỗi xảy ra khi đăng ký!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--secondary)' }}>Tạo Tài Khoản</h2>
        
        {error && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Tên hiển thị</label>
            <input 
              type="text" 
              className="glass-input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder="VD: Nguyễn Văn A"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Email</label>
            <input 
              type="email" 
              className="glass-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder="Nhập email của bạn"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Mật khẩu</label>
            <input 
              type="password" 
              className="glass-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder="Tạo mật khẩu"
            />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Xác nhận mật khẩu</label>
            <input 
              type="password" 
              className="glass-input" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px' }}
              placeholder="Nhập lại mật khẩu"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px', background: 'linear-gradient(135deg, var(--secondary), var(--accent))' }} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
