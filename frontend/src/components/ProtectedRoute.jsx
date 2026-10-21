import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { PageLoader } from './States';

/**
 * Guards a route. Logged-out users go to /login (and come back afterwards);
 * a user with the wrong role is sent to their own dashboard.
 */
export default function ProtectedRoute({ role, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}
