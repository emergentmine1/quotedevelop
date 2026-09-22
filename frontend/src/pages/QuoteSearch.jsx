import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plane, Ship, Truck, ArrowRight, MapPin, Package, Calendar, Globe2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ports } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const schema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  mode: z.enum(['ocean', 'air', 'road']),
  containerType: z.string().min(1, 'Container type required'),
  weight: z.coerce.number().min(1, 'Weight required'),
  volume: z.coerce.number().min(0).optional(),
  readyDate: z.string().min(1, 'Ready date required'),
  incoterm: z.string().min(1, 'Incoterm required'),
});

const MODES = [
  { id: 'ocean', label: 'Ocean Freight', icon: Ship, desc: 'Cost-efficient, 14-45 days' },
  { id: 'air', label: 'Air Freight', icon: Plane, desc: 'Fastest, 3-9 days' },
  { id: 'road', label: 'Road Freight', icon: Truck, desc: 'Domestic / regional' },
];

export default function QuoteSearch() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: 'ocean',
      containerType: '40ft Standard',
      incoterm: 'FOB',
      weight: 2500,
      volume: 30,
      readyDate: new Date().toISOString().split('T')[0],
      origin: 'CNSHA',
      destination: 'USLAX',
    },
  });

  const mode = watch('mode');

  const onSubmit = () => {
    navigate('/quotes/results');
  };

  return (
    <div className="space-y-6" data-testid="quote-search-page">
      <PageHeader
        breadcrumb="Quotes · Search"
        title="Get Freight Quotes."
        subtitle="Compare live rates from 60+ vetted carriers across Air, Ocean, and Road."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-6 md:p-8 space-y-6">
        {/* Mode selector */}
        <div>
          <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3 block">Shipping mode</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  data-testid={`mode-${m.id}`}
                  onClick={() => setValue('mode', m.id)}
                  className={cn(
                    'group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left',
                    active
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5 ring-2 ring-[#D4AF37]/20'
                      : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5'
                  )}
                >
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', active ? 'bg-[#0F172A] text-[#D4AF37]' : 'bg-slate-100 text-slate-600')}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[#0F172A]">{m.label}</div>
                    <div className="text-xs text-slate-500">{m.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Origin/Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Origin" icon={MapPin} error={errors.origin?.message}>
            <Select onValueChange={(v) => setValue('origin', v)} defaultValue="CNSHA">
              <SelectTrigger data-testid="origin-select" className="h-12 rounded-xl border-slate-200">
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                {ports.map((p) => (
                  <SelectItem key={p.code} value={p.code}>{p.city}, {p.country} ({p.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Destination" icon={MapPin} error={errors.destination?.message}>
            <Select onValueChange={(v) => setValue('destination', v)} defaultValue="USLAX">
              <SelectTrigger data-testid="destination-select" className="h-12 rounded-xl border-slate-200">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {ports.map((p) => (
                  <SelectItem key={p.code} value={p.code}>{p.city}, {p.country} ({p.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Cargo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Container type" icon={Package}>
            <Select onValueChange={(v) => setValue('containerType', v)} defaultValue="40ft Standard">
              <SelectTrigger data-testid="container-select" className="h-12 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['20ft Standard', '40ft Standard', '40ft High Cube', '45ft High Cube', 'LCL', 'FCL'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Weight (kg)" error={errors.weight?.message}>
            <Input data-testid="weight-input" type="number" className="h-12 rounded-xl border-slate-200" {...register('weight')} />
          </Field>
          <Field label="Volume (CBM)">
            <Input data-testid="volume-input" type="number" className="h-12 rounded-xl border-slate-200" {...register('volume')} />
          </Field>
          <Field label="Ready date" icon={Calendar} error={errors.readyDate?.message}>
            <Input data-testid="ready-date-input" type="date" className="h-12 rounded-xl border-slate-200" {...register('readyDate')} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Incoterm" icon={Globe2}>
            <Select onValueChange={(v) => setValue('incoterm', v)} defaultValue="FOB">
              <SelectTrigger data-testid="incoterm-select" className="h-12 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['EXW', 'FOB', 'CIF', 'DDP', 'DAP', 'FCA'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Quotes are typically returned within 60 seconds from up to 6 carriers.
          </div>
          <Button
            type="submit"
            data-testid="quote-search-submit"
            className="h-12 px-8 bg-[#D4AF37] hover:bg-[#c19f2d] hover:brightness-110 text-[#0F172A] font-semibold rounded-xl gap-2 active:scale-95 transition-all"
          >
            Search quotes <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600 flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="h-3 w-3 text-slate-400" />} {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
