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
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import api from './api/axiosConfig';

const Dashboard = lazy(() => import('./components/Dashboard'));
const DeckDetails = lazy(() => import('./components/DeckDetails'));
const StudyMode = lazy(() => import('./components/StudyMode'));
const GrammarLearnerPage = lazy(() => import('./components/grammar/view/GrammarLearnerPage'));
const GrammarAdminCMSPage = lazy(() => import('./components/grammar/view/GrammarAdminCMSPage'));
const WeakVocabulary = lazy(() => import('./components/WeakVocabulary'));
const WeakPracticeSetup = lazy(() => import('./components/WeakPracticeSetup'));
const WeakPracticeSession = lazy(() => import('./components/WeakPracticeSession'));

const readUserFromToken = (token) => {
  if (!token) return null;
  try {
    const payloadPart = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadPart));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    const email = (payload.email || payload.sub || '').trim();
    return {
      name: payload.name || email,
      email,
      role: payload.role || 'ROLE_USER',
      isAdmin: payload.role === 'ROLE_ADMIN',
    };
  } catch {
    return null;
  }
};

/**
 * Xử lý callback chuyển hướng sau khi đăng nhập Google OAuth2 thành công
 */
function OAuth2RedirectHandler({ onAuthenticated }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      onAuthenticated(token);
      const from = sessionStorage.getItem('authReturnTo');
      sessionStorage.removeItem('authReturnTo');
      navigate(from?.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : '/', { replace: true });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, onAuthenticated]);

  return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Đang xác thực đăng nhập Google...</div>;
}

/**
 * Landing Page dành cho khách truy cập chưa đăng nhập
 */
function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="landing-page animate-fade-in">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow">✦ Góc học tập của bạn</span>
          <h1>Học mỗi ngày,<br/><span>tiến bộ thật vui.</span></h1>
          <p>Flashcard, ngữ pháp và lộ trình ôn tập được sắp xếp gọn gàng trong một không gian học tập nhẹ nhàng, dễ tập trung.</p>
          <div className="landing-actions">
            <button onClick={() => navigate('/register')} className="btn btn-primary">Bắt đầu học miễn phí <span>→</span></button>
            <button onClick={() => navigate('/login')} className="btn btn-glass">Tôi đã có tài khoản</button>
          </div>
        </div>
        <div className="study-board" aria-hidden="true">
          <span className="board-sticker">🐱</span>
          <div className="board-title">Kế hoạch tuần này</div>
          <div className="board-tabs"><i className="board-tab"/><i className="board-tab"/><i className="board-tab"/><i className="board-tab"/></div>
          <div className="board-sheet"><div className="board-line"/><div className="board-line"/><div className="board-line"/><div className="board-line"/></div>
        </div>
      </section>
      <section className="feature-strip" aria-label="Tính năng nổi bật">
        <article className="feature-card"><div className="feature-icon">✎</div><h3>Tạo bộ thẻ</h3><p>Tự xây dựng học liệu theo chủ đề và mục tiêu của riêng bạn.</p></article>
        <article className="feature-card"><div className="feature-icon">☕</div><h3>Ôn tập thông minh</h3><p>Học đúng nội dung cần nhớ với lịch ôn tập khoa học.</p></article>
        <article className="feature-card"><div className="feature-icon">✓</div><h3>Theo dõi tiến bộ</h3><p>Nhìn thấy từng bước tiến nhỏ để duy trì thói quen mỗi ngày.</p></article>
      </section>
    </main>
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

  // 2. Mặc định mở Bảng Tin Bài Tập Cộng Đồng (Community Board) cho tất cả thành viên
  return <GrammarLearnerPage user={user} />;
}

function MainApp() {
  const [token, setToken] = useState(() => readUserFromToken(localStorage.getItem('token')) ? localStorage.getItem('token') : null);
  const [user, setUser] = useState(() => readUserFromToken(localStorage.getItem('token')));
  const [checkingAuth, setCheckingAuth] = useState(() => Boolean(readUserFromToken(localStorage.getItem('token'))));

  const handleAuthenticated = useCallback((nextToken) => {
    localStorage.setItem('token', nextToken);
    setToken(nextToken);
    setUser(readUserFromToken(nextToken));
    setCheckingAuth(true);
  }, []);

  useEffect(() => {
    if (!token) { setCheckingAuth(false); return; }
    const controller = new AbortController();
    api.get('/auth/me', { signal: controller.signal }).then(({ data }) => setUser(data))
      .catch(err => {
        if (err.code !== 'ERR_CANCELED') {
          setUser(null);
          if (err.response?.status === 401) { localStorage.removeItem('token'); setToken(null); }
        }
      }).finally(() => { if (!controller.signal.aborted) setCheckingAuth(false); });
    return () => controller.abort();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const expire = () => { localStorage.removeItem('token'); setToken(null); setUser(null); };
    window.addEventListener('auth-expired', expire);
    let timer;
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp) timer = setTimeout(expire, Math.max(0, payload.exp * 1000 - Date.now()));
    }
    return () => { window.removeEventListener('auth-expired', expire); clearTimeout(timer); };
  }, [token]);

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      
      {checkingAuth ? <div className="route-loader"><span>Checking your session…</span></div> : <Suspense fallback={<div className="route-loader"><span>Đang mở trang học tập...</span></div>}>
      <Routes>
        <Route path="/" element={<Dashboard key="public" user={user} />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/my-decks" element={<ProtectedRoute user={user}><Dashboard key="my" user={user} mine /></ProtectedRoute>} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onAuthenticated={handleAuthenticated} />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register onAuthenticated={handleAuthenticated} />} />
        <Route path="/deck/:id" element={<DeckDetails user={user} />} />
        <Route path="/study/:id" element={<StudyMode user={user} />} />
        {/* Module Bài Tập Ngữ Pháp — Điều phối thông minh theo trạng thái đăng nhập và email */}
        <Route path="/grammar" element={<GrammarModuleDispatcher user={user} token={token} />} />
        
        {/* Đường dẫn xem trực tiếp giao diện người học (dành cho Admin muốn test thử) */}
        <Route
          path="/grammar/practice"
          element={token ? <GrammarLearnerPage user={user} /> : <Navigate to="/login" replace />}
        />

        {/* Đường dẫn trang quản trị & soạn bài (dành cho mọi người dùng) */}
        <Route
          path="/grammar/admin"
          element={token ? <GrammarAdminCMSPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/grammar/create"
          element={token ? <GrammarAdminCMSPage user={user} /> : <Navigate to="/login" replace />}
        />

        <Route path="/weak-vocabulary" element={<ProtectedRoute user={user}><WeakVocabulary /></ProtectedRoute>} />
        <Route path="/weak-vocabulary/practice" element={<ProtectedRoute user={user}><WeakPracticeSetup /></ProtectedRoute>} />
        <Route path="/weak-vocabulary/practice/:id" element={<ProtectedRoute user={user}><WeakPracticeSession /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler onAuthenticated={handleAuthenticated} />} />
      </Routes>
      </Suspense>}
    </>
  );
}

export default MainApp;
