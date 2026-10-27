import { useState } from 'react';
import { Loader2 } from 'lucide-react';

function MicrosoftLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="36" height="36" viewBox="0 0 23 23" aria-hidden="true">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
        <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
      </svg>
      <span className="text-[26px] font-semibold text-[#737373]">Microsoft</span>
    </div>
  );
}

// Microsoft Entra-style password step (dummy modes only; real Entra ID shows its own page).
export function MicrosoftPasswordCard({ email, onSignIn, onAnotherAccount, error, busy }) {
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (password) onSignIn(password);
  };

  return (
    <div
      data-testid="ms-password-step"
      className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#EEF0F6] via-[#F5F4F8] to-[#EBEDF5]"
      style={{ fontFamily: "'Segoe UI', 'Inter', sans-serif" }}
    >
      <form onSubmit={submit} className="w-full max-w-[440px] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] px-11 py-11">
        <MicrosoftLogo />
        <div data-testid="ms-email" className="mt-6 text-[17px] text-[#1B1B1B]">{email}</div>
        <h2 className="mt-3 text-[28px] font-semibold text-[#1B1B1B]">Enter password</h2>
        {error && <p data-testid="ms-password-error" className="mt-2 text-sm text-[#E81123]">{error}</p>}
        <input
          type="password"
          data-testid="ms-password-input"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-5 w-full h-10 border-0 border-b border-[#666] focus:border-[#0067B8] outline-none text-[17px] placeholder:text-[#666] bg-transparent"
        />
        <div className="mt-6 space-y-4 text-[15px]">
          <button type="button" data-testid="ms-forgot-link" onClick={() => setNote('Passwords are managed by KWE IT. Please contact the service desk.')} className="block text-[#0067B8] hover:underline">
            Forgot my password
          </button>
          <button type="button" data-testid="ms-passwordless-link" onClick={() => setNote('Passwordless sign-in is available once KWE single sign-on is connected.')} className="block text-[#0067B8] hover:underline text-left">
            Use your face, fingerprint, PIN, or security key instead
          </button>
          <button type="button" data-testid="ms-another-account-link" onClick={onAnotherAccount} className="block text-[#0067B8] hover:underline">
            Sign in with another account
          </button>
        </div>
        {note && <p data-testid="ms-note" className="mt-4 text-xs text-slate-500">{note}</p>}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            data-testid="ms-signin-button"
            disabled={busy || !password}
            className="min-w-[160px] h-12 px-6 bg-[#3264C2] hover:bg-[#2A55A8] text-white text-xl inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
        </div>
      </form>
    </div>
  );
}
