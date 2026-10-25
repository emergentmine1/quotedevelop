import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, Globe2, Sparkles, LogIn, AlertCircle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { landingFor } from '@/lib/admin-nav';
import { AuthLoading } from '@/components/ProtectedRoute';
import { PasswordSignIn } from '@/components/auth/PasswordSignIn';

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

  const onOkta = async () => {
    setError('');
    setRedirecting(true);
    try {
      await signInWithOkta(from || '/');
    } catch (e) {
      setError(e.message || 'Could not reach the sign-in service. Please try again.');
      setRedirecting(false);
    }
  };

  const onSignedIn = (me) => navigate(me ? landingFor(me.role, from) : '/access-denied', { replace: true });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F8FAFC]">
      <div className="flex flex-col px-6 sm:px-12 lg:px-20 py-10 lg:py-16">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-10 w-auto" />
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Instant Quote</div>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] mb-3">Internal access</div>
            <h1 data-testid="login-title" className="text-4xl sm:text-5xl font-black tracking-tight text-[#0F172A] leading-[1.05]">
              KWE Instant Quote Admin
            </h1>
            <p className="mt-3 text-slate-500">Sign in to access the administration portal.</p>

            {(error || message) && (
              <div data-testid="login-error" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-start gap-2 text-sm text-rose-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error || message}
              </div>
            )}

            {authMode === 'okta' ? (
              <div className="mt-8">
                <Button
                  data-testid="login-okta-button"
                  onClick={onOkta}
                  disabled={redirecting}
                  className="w-full h-12 bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold rounded-xl gap-2 active:scale-[0.98] transition-transform"
                >
                  {redirecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to sign-in…</> : <><LogIn className="h-4 w-4" /> Login</>}
                </Button>
                <p className="mt-3 text-xs text-slate-400 text-center">You&apos;ll continue with your KWE Microsoft account via Okta.</p>
              </div>
            ) : (
              <PasswordSignIn mode={authMode} onSignedIn={onSignedIn} />
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400 mt-8">© KWE · Instant Quote Admin</div>
      </div>
      <LoginVisual />
    </div>
  );
}

function LoginVisual() {
  return (
    <div className="hidden lg:block relative overflow-hidden navy-bg">
      <img
        src="https://images.unsplash.com/photo-1613690399151-65ea69478674?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwyfHxjYXJnbyUyMHNoaXAlMjBvY2VhbiUyMGNvbnRhaW5lcnxlbnwwfHx8fDE3ODE3MjM4MjJ8MA&ixlib=rb-4.1.0&q=85"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/70 to-[#0F172A]/95" />
      <div className="relative h-full flex flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-2 text-[#D4AF37] text-sm font-semibold uppercase tracking-widest">
          <ShieldCheck className="h-4 w-4" /> KWE single sign-on
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] mb-4">For KWE teams</div>
          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight">
            Procurement, Sales and Branch Managers — one admin portal.
          </h2>
          <p className="mt-4 text-slate-300 max-w-md">
            Manage pricing matrices, follow up customer leads and track every instant-quote request.
          </p>
          <div className="grid grid-cols-3 gap-6 mt-10">
            {[
              { icon: ShieldCheck, label: 'MFA protected', value: 'SSO' },
              { icon: Globe2, label: 'Trade lanes', value: '150+' },
              { icon: Sparkles, label: 'Role based', value: '2 roles' },
            ].map((s) => (
              <div key={s.label}>
                <s.icon className="h-5 w-5 text-[#D4AF37] mb-2" />
                <div className="text-2xl font-black tracking-tight">{s.value}</div>
                <div className="text-[11px] uppercase tracking-widest text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-400 border-t border-slate-700 pt-6">Access is limited to authorized KWE users.</div>
      </div>
    </div>
  );
}
