import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { landingFor } from '@/lib/admin-nav';
import { AuthLoading } from '@/components/ProtectedRoute';

const HERO = 'https://images.unsplash.com/photo-1724597500306-a4cbb7d1324e?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600';
const condensed = { fontFamily: "'Roboto Condensed', 'Arial Narrow', sans-serif" };

export default function Login() {
  const { status, user, message, authMode, signInWithOkta } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname;

  if (status === 'loading') return <AuthLoading />;
  if (status === 'authorized') return <Navigate to={landingFor(user.role, from)} replace />;
  if (status === 'denied') return <Navigate to="/access-denied" replace />;

  const onSso = async () => {
    setError('');
    setRedirecting(true);
    if (authMode !== 'okta') {
      navigate('/login/sso', { state: { from: location.state?.from } });
      return;
    }
    try {
      await signInWithOkta(from || '/');
    } catch (e) {
      setError(e.message || 'Could not reach the sign-in service. Please try again.');
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={condensed}>
      <div className="bg-white flex flex-col items-center px-6 py-12">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <img src="/Kwe-logo.png" alt="KWE" data-testid="login-logo" className="h-20 w-auto" />
          <div className="mt-12 text-lg uppercase tracking-wide text-[#A8954A]">Welcome</div>
          <h1 data-testid="login-title" className="mt-2 text-4xl sm:text-5xl font-bold text-[#1A202C] leading-tight">
            Sign in to<br />KWE Rate &amp; Quote
          </h1>
          {(error || message) && (
            <div data-testid="login-error" className="mt-6 max-w-sm rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 flex items-start gap-2 text-sm text-rose-800 text-left">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error || message}
            </div>
          )}
          <button
            type="button"
            data-testid="login-sso-button"
            onClick={onSso}
            disabled={redirecting}
            className="mt-10 inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#1A202C] text-white text-lg font-bold border-2 border-[#A8954A] shadow-[0_4px_14px_rgba(26,32,44,0.25)] hover:bg-[#2D3748] active:scale-[0.97] transition-[transform,background-color] disabled:opacity-80"
          >
            {redirecting && <Loader2 className="h-4 w-4 animate-spin" />}
            {redirecting ? 'Redirecting…' : 'Sign in with SSO'}
          </button>
        </div>
        <div className="text-base text-slate-500">Rate &amp; Quote Management System (RQMS)</div>
      </div>

      <div className="hidden lg:flex relative overflow-hidden bg-[#1A2333] items-center px-24">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-[#1A2333]/60" />
        <h2 className="relative text-5xl xl:text-6xl font-bold text-white leading-[1.1]">
          Streamlined<br />Freight Pricing<br />&amp; Management.
        </h2>
      </div>
    </div>
  );
}
