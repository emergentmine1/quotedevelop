import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Anchor, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/auth';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (pwd.length < 6) return toast.error('Password must be at least 6 characters');
    if (pwd !== confirm) return toast.error('Passwords do not match');
    setSubmitting(true);
    try {
      await resetPassword('demo-token', pwd);
      toast.success('Password updated. Please sign in.');
      navigate('/login');
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
              <KeyRound className="h-5 w-5 text-[#a8862a]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Set New Password</h1>
            <p className="mt-1.5 text-sm text-slate-500">Choose a strong password you haven't used before.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">New password</Label>
                <Input data-testid="reset-pwd-input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="mt-1.5 h-12 rounded-xl border-slate-200" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Confirm password</Label>
                <Input data-testid="reset-confirm-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5 h-12 rounded-xl border-slate-200" />
              </div>
              <Button data-testid="reset-submit-button" type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
