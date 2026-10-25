import { useState } from 'react';
import { Loader2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/auth';

// TEMPORARY dummy sign-in (static / demo modes). Replaced by the Okta button once Okta is configured.
export function PasswordSignIn({ mode, onSignedIn }) {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      onSignedIn(await signInWithPassword(email, password));
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  const pick = (acc) => { setEmail(acc.email); setPassword(DEMO_PASSWORD); };

  return (
    <form onSubmit={submit} className="mt-8 space-y-5" data-testid="password-signin-form">
      <div data-testid="dummy-login-banner" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
        <FlaskConical className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Temporary {mode === 'static' ? 'backend' : 'browser-only demo'} sign-in with dummy accounts.
          It will be replaced by KWE Okta single sign-on.
        </span>
      </div>
      <div>
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Email</Label>
        <Input id="email" data-testid="login-email-input" type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@kwe.com"
          className="mt-1.5 h-12 rounded-xl bg-white border-slate-200" />
      </div>
      <div>
        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Password</Label>
        <Input id="password" data-testid="login-password-input" type="password" required value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
          className="mt-1.5 h-12 rounded-xl bg-white border-slate-200" />
      </div>
      {error && <p data-testid="login-form-error" className="text-sm text-rose-600">{error}</p>}
      <Button type="submit" disabled={busy} data-testid="login-submit-button"
        className="w-full h-12 bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold rounded-xl active:scale-[0.98] transition-transform">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
      </Button>
      <div className="pt-2">
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Dummy accounts</div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button key={acc.email} type="button" onClick={() => pick(acc)}
              data-testid={`demo-account-${acc.email.split('@')[0]}`}
              className="text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-[#D4AF37] transition-colors">
              <div className="text-xs font-semibold text-[#0F172A] truncate">{acc.email}</div>
              <div className="text-[10px] text-slate-500">{acc.note}</div>
            </button>
          ))}
        </div>
        {mode === 'demo' && <p className="mt-2 text-[11px] text-slate-400">Password for all: {DEMO_PASSWORD}</p>}
      </div>
    </form>
  );
}
