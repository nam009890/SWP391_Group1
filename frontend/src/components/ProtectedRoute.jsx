import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ user, children }) {
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
}
