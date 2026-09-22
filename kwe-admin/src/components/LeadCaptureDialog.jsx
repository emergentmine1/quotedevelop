import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, Building2, User, Sparkles, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SALES_TEAMS, createLead } from '@/lib/leads-store';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(6, 'Enter a valid phone number'),
  company: z.string().optional(),
  userType: z.enum(['new', 'existing']),
  salesTeamId: z.string().min(1, 'Assign to a sales team'),
});

export default function LeadCaptureDialog({ open, onOpenChange, quotePayload, onComplete }) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      userType: 'new',
      salesTeamId: quotePayload?.origin?.countryCode === 'CN' || quotePayload?.origin?.countryCode === 'SG'
        ? 'apac'
        : quotePayload?.destination?.countryCode === 'US'
          ? 'amer'
          : 'emea',
    },
  });

  const userType = watch('userType');
  const salesTeamId = watch('salesTeamId');

  const onSubmit = (data) => {
    setSubmitting(true);
    try {
      const lead = createLead({
        ...data,
        origin: quotePayload.origin,
        destination: quotePayload.destination,
        cargoMode: quotePayload.cargoMode,
        shippingMode: quotePayload.shippingMode,
        containers: quotePayload.containers || [],
        shipmentTotals: quotePayload.shipmentTotals,
        readyDate: quotePayload.readyDate,
        services: quotePayload.services,
      });
      toast.success(`Thanks ${data.name.split(' ')[0]} — showing your live rates now.`);
      reset();
      onComplete?.(lead);
    } catch (e) {
      toast.error('Could not save your details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="lead-capture-dialog" className="max-w-lg p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-[#0B2545] text-white px-6 py-5">
          <div className="inline-flex items-center gap-1.5 text-[#5BB3FF] text-[10px] font-bold uppercase tracking-[0.18em]">
            <Sparkles className="h-3 w-3" /> One last step
          </div>
          <DialogHeader className="mt-1.5 space-y-1">
            <DialogTitle className="text-2xl font-black tracking-tight text-white">
              Where should we send your quote?
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm">
              We&apos;ll show live rates on the next screen and email you a copy for your records.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Existing / new toggle */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2 block">
              Are you new to KWE?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: 'new', label: 'New customer', sub: 'First time here' },
                { v: 'existing', label: 'Existing customer', sub: 'Already ship with KWE' },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  data-testid={`lead-usertype-${o.v}`}
                  onClick={() => setValue('userType', o.v, { shouldValidate: true })}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    userType === o.v
                      ? 'border-[#1E6AE1] bg-[#EAF3FF] ring-2 ring-[#1E6AE1]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="text-sm font-bold text-[#0B2545]">{o.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{o.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lead-name" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Full name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="lead-name"
                  data-testid="lead-name-input"
                  placeholder="Jane Doe"
                  className="h-11 pl-9 rounded-xl border-slate-200"
                  {...register('name')}
                />
              </div>
              {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="lead-company" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Company</Label>
              <div className="relative mt-1.5">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="lead-company"
                  data-testid="lead-company-input"
                  placeholder="Optional"
                  className="h-11 pl-9 rounded-xl border-slate-200"
                  {...register('company')}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="lead-email" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Business email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="lead-email"
                data-testid="lead-email-input"
                type="email"
                placeholder="you@company.com"
                className="h-11 pl-9 rounded-xl border-slate-200"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="lead-phone" className="text-xs font-semibold uppercase tracking-widest text-slate-600">Phone</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="lead-phone"
                data-testid="lead-phone-input"
                type="tel"
                placeholder="+1 415 555 0100"
                className="h-11 pl-9 rounded-xl border-slate-200"
                {...register('phone')}
              />
            </div>
            {errors.phone && <p className="mt-1 text-[11px] text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Assign to sales team</Label>
            <Select value={salesTeamId} onValueChange={(v) => setValue('salesTeamId', v, { shouldValidate: true })}>
              <SelectTrigger data-testid="lead-sales-team" className="h-11 mt-1.5 rounded-xl border-slate-200">
                <SelectValue placeholder="Select sales team" />
              </SelectTrigger>
              <SelectContent>
                {SALES_TEAMS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} <span className="text-slate-400 ml-1">· {t.lead}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.salesTeamId && <p className="mt-1 text-[11px] text-red-600">{errors.salesTeamId.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            data-testid="lead-submit-button"
            className="w-full h-12 mt-2 bg-[#1E6AE1] hover:bg-[#1758c2] text-white font-semibold rounded-xl gap-2 active:scale-[0.98] transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Show my quote <ArrowRight className="h-4 w-4" /></>}
          </Button>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            We&apos;ll never share your details. Read our privacy policy.
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
