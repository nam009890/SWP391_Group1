import { t } from '../../i18n/index.js';
import { Navigate, useLocation } from 'react-router-dom';
export default function AdminRoute({ user, children }) {
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (user.role !== 'ROLE_ADMIN') return <main className="account-page"><h1> {t('admin:khong_co_quyen_truy_cap_ac1321')} </h1><p> {t('admin:trang_nay_chi_danh_cho_quan_tri_vien_7bc097')} </p></main>;
  return children;
}
