import { useState } from 'react';
import { Settings } from 'lucide-react';

// Okta-style username step (dummy modes only; real Okta shows its own page).
export function OktaUsernameCard({ initialEmail, onNext, hint }) {
  const [email, setEmail] = useState(initialEmail || '');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid username.');
      return;
    }
    onNext(email.trim());
  };

  return (
    <div className="min-h-screen bg-[#EAEAEC]" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }} data-testid="okta-username-step">
      <div className="bg-white/80 border-b border-slate-200 py-5 text-center">
        <div className="text-3xl text-slate-500 flex items-center justify-center gap-2">
          Connecting to <Settings className="h-7 w-7 text-slate-500" />
        </div>
        <div className="text-sm text-slate-500 mt-1">Sign in with your account to access KWE-RATE-QUOTE</div>
      </div>
      <div className="px-4 py-16">
        <form onSubmit={submit} className="mx-auto max-w-[500px] bg-white border border-slate-200 rounded shadow-sm">
          <div className="py-8 flex justify-center border-b border-slate-200">
            <img src="/Kwe-logo.png" alt="KWE" className="h-14 w-auto" />
          </div>
          <div className="px-14 py-8">
            <h2 className="text-center text-lg text-slate-600 font-medium">Sign In</h2>
            <label htmlFor="okta-username" className="block mt-6 text-base font-semibold text-slate-900">Username</label>
            <input
              id="okta-username"
              data-testid="okta-username-input"
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="mt-2 w-full h-12 px-3 rounded border border-slate-300 text-base outline-none focus:border-[#1662DD] focus:ring-2 focus:ring-[#1662DD]/25"
            />
            {error && <p data-testid="okta-username-error" className="mt-2 text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              data-testid="okta-next-button"
              className="mt-8 w-full h-14 rounded bg-[#1662DD] hover:bg-[#124FB4] text-white text-lg font-semibold transition-colors"
            >
              Next
            </button>
            <a href="/login" data-testid="okta-help-link" className="inline-block mt-8 text-sm text-slate-600 underline">Help</a>
          </div>
        </form>
        {hint}
      </div>
    </div>
  );
}
