// =========================================================================================
// APPLICATION ROUTER & ROOT COMPONENT (APP.JSX)
// =========================================================================================
// Thực hiện các quy tắc điều hướng và phân quyền theo yêu cầu:
// 1. Phải đăng nhập (Google Auth hoặc tài khoản có sẵn) mới được truy cập module bài tập
//    -> Nếu chưa đăng nhập (!token), tự động chuyển hướng về trang /login kèm thông báo.
// 2. Nếu đăng nhập bằng Google hoặc tài khoản email buiquangviet032@gmail.com:
//    -> Khi truy cập module bài tập (/grammar), giao diện hiển thị mặc định là màn hình
//       Soạn Câu Hỏi (GrammarAdminCMSPage) thay vì màn hình làm bài bình thường.
//    -> Các tài khoản khác sẽ hiển thị giao diện Làm Bài Tập (GrammarLearnerPage).
// =========================================================================================

import { Routes, Route, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DeckDetails from './components/DeckDetails';
import Login from './components/Login';
import Register from './components/Register';
import StudyMode from './components/StudyMode';
import GrammarLearnerPage from './components/grammar/view/GrammarLearnerPage';
import GrammarAdminCMSPage from './components/grammar/view/GrammarAdminCMSPage';
import { isCreatorUser } from './components/grammar/model/authHelper';
import api from './api/axiosConfig';

/**
 * Xử lý callback chuyển hướng sau khi đăng nhập Google OAuth2 thành công
 */
function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/'; // Tải lại toàn bộ ứng dụng để MainApp đọc token mới
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Đang xác thực đăng nhập Google...</div>;
}

/**
 * Landing Page dành cho khách truy cập chưa đăng nhập
 */
function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '100px 20px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      <h1 style={{ fontSize: '48px', marginBottom: '20px', background: 'linear-gradient(135deg, var(--primary), var(--secondary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'hueRotate 5s linear infinite' }}>
        Master Languages with StudyE
      </h1>
      <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>
        Nền tảng học từ vựng 3D Flashcard và luyện tập ngữ pháp tiếng Anh thế hệ mới.
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
          <p style={{ color: 'var(--text-muted)' }}>Tạo bộ thẻ và soạn câu hỏi dễ dàng</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ color: 'var(--secondary)', marginBottom: '10px' }}>Study</h3>
          <p style={{ color: 'var(--text-muted)' }}>Luyện tập ngữ pháp & Flashcard 3D</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ color: '#f43f5e', marginBottom: '10px' }}>Master</h3>
          <p style={{ color: 'var(--text-muted)' }}>Ghi nhớ lâu dài với Spaced Repetition</p>
        </div>
      </div>
    </div>
  );
}

/**
 * =========================================================================================
 * BỘ ĐIỀU PHỐI MODULE BÀI TẬP NGỮ PHÁP (GRAMMAR MODULE DISPATCHER)
 * =========================================================================================
 * Yêu cầu 1: Bắt buộc phải đăng nhập (Google OAuth hoặc tài khoản hệ thống) mới được vào.
 * Yêu cầu 2: Nếu là tài khoản tác giả (buiquangviet032@gmail.com):
 *            -> Tự động hiển thị màn hình Soạn Câu Hỏi (GrammarAdminCMSPage).
 *            Ngược lại (học viên bình thường):
 *            -> Hiển thị màn hình Làm Bài Tập (GrammarLearnerPage).
 * =========================================================================================
 */
function GrammarModuleDispatcher({ user, token }) {
  // 1. Kiểm tra trạng thái đăng nhập
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Kiểm tra nếu là tài khoản tác giả buiquangviet032@gmail.com
  const isCreator = isCreatorUser(user);

  if (isCreator) {
    // Tác giả -> Hiển thị trực tiếp màn hình Soạn câu hỏi & Quản trị CMS
    return <GrammarAdminCMSPage user={user} />;
  }

  // Học viên thông thường -> Hiển thị màn hình Luyện tập bài tập
  return <GrammarLearnerPage user={user} />;
}

function MainApp() {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Kiểm tra token hết hạn
        if (payload.exp && payload.exp < currentTime) {
          console.warn("Token expired on load");
          handleLogout();
        } else {
          // Trích xuất email từ payload (sub hoặc email)
          const email = (payload.email || payload.sub || '').trim();
          const isCreator = email.toLowerCase() === 'buiquangviet032@gmail.com';
          
          setUser({
            name: payload.name || email,
            email: email,
            role: isCreator ? 'ROLE_ADMIN' : (payload.role || 'ROLE_USER'),
            isAdmin: isCreator
          });
        }
      } catch (e) {
        console.error("Invalid token format:", e);
        handleLogout();
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = 'http://localhost:8080/api/auth/logout';
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
        
        {/* Module Bài Tập Ngữ Pháp — Điều phối thông minh theo trạng thái đăng nhập và email */}
        <Route path="/grammar" element={<GrammarModuleDispatcher user={user} token={token} />} />
        
        {/* Đường dẫn xem trực tiếp giao diện người học (dành cho Admin muốn test thử) */}
        <Route
          path="/grammar/practice"
          element={token ? <GrammarLearnerPage user={user} /> : <Navigate to="/login" replace />}
        />

        {/* Đường dẫn trang quản trị CMS */}
        <Route
          path="/grammar/admin"
          element={token ? <GrammarAdminCMSPage user={user} /> : <Navigate to="/login" replace />}
        />

        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
      </Routes>
    </>
  );
}

export default MainApp;
