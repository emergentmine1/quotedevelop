import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BrandLogo from '@/components/BrandLogo';
import { Anchor, Eye, EyeOff, Loader2, ShieldCheck, Globe2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TEST_CREDENTIALS } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const adminDemo = TEST_CREDENTIALS.find((a) => a.role === 'admin');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: adminDemo?.email || '', password: adminDemo?.password || '' },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const user = await signIn(data.email, data.password);
      toast.success(`Welcome back, ${user.name}`);
      const redirect = location.state?.from?.pathname;
      const home = user.role === 'provider' ? '/provider/dashboard' : user.role === 'admin' ? '/admin/pricing' : '/dashboard';
      navigate(redirect || home, { replace: true });
    } catch (e) {
      toast.error(e.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    if (!adminDemo) return;
    setValue('email', adminDemo.email, { shouldValidate: true });
    setValue('password', adminDemo.password, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F8FAFC]">
      {/* Left: form */}
      <div className="flex flex-col px-6 sm:px-12 lg:px-20 py-10 lg:py-16">
        <Link to="/login" className="flex items-center gap-2 group">
                  <BrandLogo className="h-10 w-auto" />
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Freight Network</div>
                  </div>
                </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] mb-3">Welcome back</div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0F172A] leading-[1.05]">
              Sign in to your<br />freight command center.
            </h1>
            <p className="mt-3 text-slate-500">Manage quotes, bookings, and shipments across global trade lanes.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div>
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Email</Label>
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  placeholder="you@company.com"
                  className="mt-1.5 h-12 rounded-xl bg-white border-slate-200"
                  {...register('email')}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Password</Label>
                  <Link to="/forgot-password" data-testid="forgot-password-link" className="text-xs font-semibold text-slate-700 hover:text-[#D4AF37]">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 rounded-xl bg-white border-slate-200 pr-12"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    data-testid="toggle-password-visibility"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500"
                    aria-label="Toggle password"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                data-testid="login-submit-button"
                className="w-full h-12 bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold rounded-xl active:scale-[0.98] transition-all"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in to KWE'}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-widest"><span className="bg-[#F8FAFC] px-3 text-slate-400 font-semibold">Try a demo account</span></div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  data-testid="demo-admin-button"
                  onClick={fillDemo}
                  className="min-w-[180px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold uppercase tracking-wider text-slate-700 hover:border-[#D4AF37] hover:text-[#0F172A] transition-colors"
                >
                  Admin
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="text-xs text-slate-400 mt-8">© KWE Freight Network · v1.0 · Premium Enterprise Edition</div>
      </div>

      {/* Right: visual */}
      <div className="hidden lg:block relative overflow-hidden navy-bg">
        <img
          src="https://images.unsplash.com/photo-1613690399151-65ea69478674?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwyfHxjYXJnbyUyMHNoaXAlMjBvY2VhbiUyMGNvbnRhaW5lcnxlbnwwfHx8fDE3ODE3MjM4MjJ8MA&ixlib=rb-4.1.0&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/90 via-[#0F172A]/70 to-[#0F172A]/95" />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2 text-[#D4AF37] text-sm font-semibold uppercase tracking-widest">
            <Sparkles className="h-4 w-4" /> Trusted by 1,200+ shippers
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] mb-4">Why KWE</div>
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight">
              The freight marketplace, reimagined for global enterprise.
            </h2>
            <p className="mt-4 text-slate-300 max-w-md">
              Real-time quotes across Air, Ocean & Road. End-to-end visibility from booking to delivery, with the trust of a 4.8★ premium network.
            </p>

            <div className="grid grid-cols-3 gap-6 mt-10">
              {[
                { icon: ShieldCheck, label: 'Vetted carriers', value: '60+' },
                { icon: Globe2, label: 'Trade lanes', value: '150+' },
                { icon: Sparkles, label: 'Uptime SLA', value: '99.99%' },
              ].map((s) => (
                <div key={s.label}>
                  <s.icon className="h-5 w-5 text-[#D4AF37] mb-2" />
                  <div className="text-2xl font-black tracking-tight">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-700 pt-6">
            “We replaced 5 forwarder portals with KWE. Procurement is now 60% faster.”
            <div className="mt-1 text-slate-300 font-semibold">— VP Logistics, Pacific Imports</div>
          </div>
        </div>
      </div>
    </div>
  );
}
