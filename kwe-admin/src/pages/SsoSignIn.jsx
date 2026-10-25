import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { landingFor } from '@/lib/admin-nav';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/auth';
import { OktaUsernameCard } from '@/components/auth/OktaUsernameCard';
import { MicrosoftPasswordCard } from '@/components/auth/MicrosoftPasswordCard';

const LAST_EMAIL_KEY = 'kwe_admin_last_email';

// TEMPORARY dummy SSO (static / demo modes): mimics Okta username → Microsoft password.
// In okta mode users never see this page; they go to the real Okta / Entra ID screens.
export default function SsoSignIn() {
  const { authMode, signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (authMode === 'okta') return <Navigate to="/login" replace />;

  const signIn = async (password) => {
    setBusy(true);
    setError('');
    try {
      const me = await signInWithPassword(email, password);
      localStorage.setItem(LAST_EMAIL_KEY, email);
      navigate(me ? landingFor(me.role, from) : '/access-denied', { replace: true });
    } catch (e) {
      setError(e.kind === 'unavailable' ? e.message : 'Your account or password is incorrect.');
      setBusy(false);
    }
  };

  if (!email) {
    return (
      <OktaUsernameCard
        initialEmail={localStorage.getItem(LAST_EMAIL_KEY) || ''}
        onNext={setEmail}
        hint={<DummyHint mode={authMode} />}
      />
    );
  }
  return (
    <MicrosoftPasswordCard
      email={email}
      busy={busy}
      error={error}
      onSignIn={signIn}
      onAnotherAccount={() => { setEmail(''); setError(''); }}
    />
  );
}

function DummyHint({ mode }) {
  return (
    <div data-testid="dummy-login-hint" className="mx-auto max-w-[500px] mt-4 text-[11px] text-slate-500 text-center leading-relaxed">
      Temporary dummy sign-in · {DEMO_ACCOUNTS.map((a) => `${a.email} (${a.note})`).join(' · ')}
      {mode === 'demo' ? ` · password ${DEMO_PASSWORD}` : ''}
    </div>
  );
}
