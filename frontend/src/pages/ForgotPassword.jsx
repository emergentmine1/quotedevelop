import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Anchor, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '@/lib/auth';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success('Reset link sent to your inbox');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col px-6 py-10">
      <Link to="/login" className="flex items-center gap-2 self-start">
        <div className="h-10 w-10 rounded-xl bg-[#0F172A] flex items-center justify-center">
          <Anchor className="h-5 w-5 text-[#D4AF37]" strokeWidth={2.5} />
        </div>
        <div className="font-black text-lg tracking-tight text-[#0F172A]">KWE</div>
      </Link>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#0F172A] mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </button>

          <div className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-8">
            <div className="h-12 w-12 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center mb-4">
              <Mail className="h-5 w-5 text-[#a8862a]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Reset Your Password</h1>
            <p className="mt-1.5 text-sm text-slate-500">Enter the email associated with your KWE account.</p>

            {sent ? (
              <div className="mt-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm">
                A reset link has been sent to <strong>{email}</strong>. Check your inbox to continue.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Email</Label>
                  <Input
                    id="email"
                    data-testid="forgot-email-input"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 h-12 rounded-xl border-slate-200"
                  />
                </div>
                <Button data-testid="forgot-submit-button" type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
