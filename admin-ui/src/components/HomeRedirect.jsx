import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { homeFor } from '@/lib/admin-nav';
import { AuthLoading } from '@/components/ProtectedRoute';

// "/" and unknown paths: role home when signed in, otherwise the login page.
export default function HomeRedirect() {
  const { status, user } = useAuth();
  if (status === 'loading') return <AuthLoading />;
  if (status === 'authorized') return <Navigate to={homeFor(user.role)} replace />;
  if (status === 'denied' || status === 'unavailable') return <Navigate to="/access-denied" replace />;
  return <Navigate to="/login" replace />;
}
