import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { homeFor } from '@/lib/admin-nav';

export function AuthLoading() {
  return (
    <div data-testid="auth-loading" className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <AuthLoading />;
  if (status === 'denied' || status === 'unavailable') return <Navigate to="/access-denied" replace />;
  if (status !== 'authorized') return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <NoPermission home={homeFor(user.role)} />;
  return children;
}

function NoPermission({ home }) {
  return (
    <div data-testid="no-permission" className="max-w-lg mx-auto mt-16 bg-white rounded-2xl border border-slate-100 kwe-shadow p-10 text-center">
      <ShieldOff className="h-9 w-9 mx-auto text-rose-500 mb-3" />
      <h1 className="text-xl font-black text-[#0F172A]">You don&apos;t have access to this page</h1>
      <p className="text-sm text-slate-500 mt-2">Your role doesn&apos;t include this area. Ask your administrator if you need it.</p>
      <a href={home} data-testid="no-permission-home" className="inline-block mt-6 text-sm font-semibold text-[#1E6AE1] hover:underline">
        Go to my home page
      </a>
    </div>
  );
}
