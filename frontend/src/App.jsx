import { t, apiError } from './i18n/index.js';
import { useTranslation } from 'react-i18next';
// Điều hướng dùng hồ sơ đã xác thực từ backend.
import { Routes, Route, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import api from './api/axiosConfig';

const ProfilePage = lazy(() => import('./components/account/ProfilePage'));
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./components/admin/AdminUsersPage'));
const AdminUserDetailsPage = lazy(() => import('./components/admin/AdminUserDetailsPage'));
const AdminAuditLogsPage = lazy(() => import('./components/admin/AdminAuditLogsPage'));
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
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return { exp: payload.exp };
  } catch {
    return null;
  }
};


function OAuth2RedirectHandler({ onAuthenticated }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
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

  return <div style={{ color: 'var(--text-main)', textAlign: 'center', marginTop: '100px' }}> {t('common:ang_xac_thuc_dang_nhap_google_9da697')} </div>;
}


function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="landing-page animate-fade-in">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow"> {t('common:goc_hoc_tap_cua_ban_e1a1bb')} </span>
          <h1> {t('common:hoc_moi_ngay_a51842')} <br/><span> {t('common:tien_bo_that_vui_dd3f42')} </span></h1>
          <p> {t('common:flashcard_ngu_phap_va_lo_trinh_on_tap_du_cdf420')} </p>
          <div className="landing-actions">
            <button onClick={() => navigate('/register')} className="btn btn-primary"> {t('common:bat_dau_hoc_mien_phi_83341e')} <span>→</span></button>
            <button onClick={() => navigate('/login')} className="btn btn-glass"> {t('common:toi_da_co_tai_khoan_bc8984')} </button>
          </div>
        </div>
        <div className="study-board" aria-hidden="true">
          <span className="board-sticker">🐱</span>
          <div className="board-title"> {t('common:ke_hoach_tuan_nay_9c13ac')} </div>
          <div className="board-tabs"><i className="board-tab"/><i className="board-tab"/><i className="board-tab"/><i className="board-tab"/></div>
          <div className="board-sheet"><div className="board-line"/><div className="board-line"/><div className="board-line"/><div className="board-line"/></div>
        </div>
      </section>
      <section className="feature-strip" aria-label={t('common:tinh_nang_noi_bat_5bc853')}>
        <article className="feature-card"><div className="feature-icon">✎</div><h3> {t('common:tao_bo_the_9e3015')} </h3><p> {t('common:tu_xay_dung_hoc_lieu_theo_chu_de_va_muc__a22116')} </p></article>
        <article className="feature-card"><div className="feature-icon">☕</div><h3> {t('common:on_tap_thong_minh_fa7b91')} </h3><p> {t('common:hoc_dung_noi_dung_can_nho_voi_lich_on_ta_5ae70f')} </p></article>
        <article className="feature-card"><div className="feature-icon">✓</div><h3> {t('common:theo_doi_tien_bo_438dec')} </h3><p> {t('common:nhin_thay_tung_buoc_tien_nho_de_duy_tri__0da1dc')} </p></article>
      </section>
    </main>
  );
}


function GrammarModuleDispatcher({ user }) {
  // 1. Kiểm tra trạng thái đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Mặc định mở Bảng Tin Bài Tập Cộng Đồng (Community Board) cho tất cả thành viên
  return <GrammarLearnerPage user={user} />;
}

function MainApp() {
  useTranslation(); // Re-render UI labels without remounting forms or changing auth.
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    if (readUserFromToken(stored)) return stored;
    if (stored) {
      localStorage.removeItem('token');
      sessionStorage.setItem('authNotice', t('common:phien_dang_nhap_da_het_han_vui_long_dang_dfcb52'));
    }
    return null;
  });
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [authAttempt, setAuthAttempt] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(() => Boolean(readUserFromToken(localStorage.getItem('token'))));

  const handleAuthenticated = useCallback((nextToken) => {
    localStorage.setItem('token', nextToken);
    setToken(nextToken);
    setUser(null);
    setCheckingAuth(true);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data);
  }, []);

  useEffect(() => {
    if (!token) { setCheckingAuth(false); return; }
    const controller = new AbortController();
    api.get('/auth/me', { signal: controller.signal }).then(({ data }) => setUser(data))
      .catch(err => {
        if (err.code !== 'ERR_CANCELED') {
          setUser(null);
          if (err.response?.status === 401) { localStorage.removeItem('token'); setToken(null); }
          else setAuthError(true);
        }
      }).finally(() => { if (!controller.signal.aborted) setCheckingAuth(false); });
    return () => controller.abort();
  }, [token, authAttempt]);

  useEffect(() => {
    if (!token || !user) return;
    const synchronizeProfile = () => refreshUser().catch(() => {});
    window.addEventListener('focus', synchronizeProfile);
    return () => window.removeEventListener('focus', synchronizeProfile);
  }, [token, user, refreshUser]);

  const handleLogout = async () => {
    const currentToken = localStorage.getItem('token');
    const revocation = api.post('/auth/logout', {}, { timeout: 5000, headers: { Authorization: `Bearer ${currentToken}` } });
    revocation.catch(() => {}); // Server revocation may fail offline; always clear this browser immediately.
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const expire = () => {
      if (!sessionStorage.getItem('authNotice')) sessionStorage.setItem('authNotice', t('common:phien_dang_nhap_da_het_han_vui_long_dang_dfcb52'));
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    };
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
      <Navbar user={user} onLogout={handleLogout} authLoading={checkingAuth} />
      
      {checkingAuth ? <div className="route-loader"><span> {t('common:ang_xac_minh_phien_dang_nhap_3c1cf3')} </span></div> : authError ? <div className="route-loader" role="alert"><p>{apiError("REQUEST_FAILED")}</p><button className="btn btn-primary" onClick={() => { setAuthError(false); setCheckingAuth(true); setAuthAttempt(value => value + 1); }}>{t("common:auth_retry")}</button></div> : <Suspense fallback={<div className="route-loader"><span> {t('common:ang_mo_trang_hoc_tap_a40048')} </span></div>}>
      <Routes>
        <Route path="/" element={<Dashboard key="public" user={user} />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage onProfileUpdated={refreshUser} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute user={user}><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage user={user} />} />
          <Route path="users/:id" element={<AdminUserDetailsPage user={user} />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        </Route>
        <Route path="/my-decks" element={<ProtectedRoute user={user}><Dashboard key="my" user={user} mine /></ProtectedRoute>} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onAuthenticated={handleAuthenticated} />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register onAuthenticated={handleAuthenticated} />} />
        <Route path="/deck/:id" element={<DeckDetails user={user} />} />
        <Route path="/study/:id" element={<StudyMode user={user} />} />
        {/* Module Bài Tập Ngữ Pháp — Điều phối thông minh theo trạng thái đăng nhập */}
        <Route path="/grammar" element={<GrammarModuleDispatcher user={user} token={token} />} />
        
        {/* Đường dẫn xem trực tiếp giao diện người học (dành cho Admin muốn test thử) */}
        <Route
          path="/grammar/practice"
          element={user ? <GrammarLearnerPage user={user} /> : <Navigate to="/login" replace />}
        />

        {/* Đường dẫn trang quản trị & soạn bài (dành cho mọi người dùng) */}
        <Route
          path="/grammar/admin"
          element={user ? <GrammarAdminCMSPage user={user} /> : <Navigate to="/login" replace />}
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
