import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { completeOktaLogin } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

// Okta redirect target (/login/callback): exchange the code (PKCE), then verify the role server-side.
export default function LoginCallback() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const originalUri = await completeOktaLogin();
        const me = await refresh();
        if (cancelled) return;
        if (!me) navigate('/access-denied', { replace: true });
        else navigate(originalUri && originalUri !== '/' ? originalUri : '/', { replace: true });
      } catch (e) {
        if (!cancelled) setError(e.message || 'Sign-in could not be completed.');
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, refresh]);

  return (
    <div data-testid="login-callback" className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6">
      {error ? (
        <div className="text-center">
          <p data-testid="login-callback-error" className="text-sm text-rose-700">{error}</p>
          <a href="/login" className="inline-block mt-4 text-sm font-semibold text-[#1E6AE1] hover:underline">Back to login</a>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Completing sign-in…</div>
      )}
    </div>
  );
}
