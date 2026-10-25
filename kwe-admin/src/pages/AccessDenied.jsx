import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { NOT_AUTHORIZED_MESSAGE } from '@/lib/auth';

export default function AccessDenied() {
  const { status, message, signOut } = useAuth();
  const navigate = useNavigate();
  const text = status === 'unavailable' ? message : NOT_AUTHORIZED_MESSAGE;

  const backToLogin = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div data-testid="access-denied-page" className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 kwe-shadow p-10 text-center">
        <BrandLogo className="h-9 w-auto mx-auto" />
        <ShieldAlert className="h-10 w-10 mx-auto text-rose-500 mt-8" />
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A] mt-3">Access denied</h1>
        <p data-testid="access-denied-message" className="text-sm text-slate-600 mt-3 leading-relaxed">{text}</p>
        <Button data-testid="access-denied-logout" onClick={backToLogin}
          className="mt-8 w-full h-11 rounded-xl bg-[#0F172A] hover:bg-[#1e293b] text-white gap-2">
          <LogOut className="h-4 w-4" /> Log out and return to login
        </Button>
      </div>
    </div>
  );
}
