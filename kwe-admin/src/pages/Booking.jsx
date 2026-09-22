import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, FileText, Package, User, UserCheck, Upload, Trash2, Sparkles } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { quotes } from '@/lib/mock-data';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, label: 'Shipment', icon: Package },
  { id: 2, label: 'Shipper', icon: User },
  { id: 3, label: 'Consignee', icon: UserCheck },
  { id: 4, label: 'Documents', icon: FileText },
  { id: 5, label: 'Review', icon: Check },
];

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const quoteId = params.get('quoteId');

  // Prefer a live selection coming from the public Instant Quote flow.
  const selectedOffer = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('kwe_selected_offer');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);
  const selectedPayload = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('kwe_selected_payload');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const fallbackQuote = quotes.find((q) => q.id === quoteId) || quotes[0];
  const quote = selectedOffer
    ? {
        id: selectedOffer.matrixId || selectedOffer.id,
        providerName: selectedOffer.providerName,
        origin: selectedOffer.origin?.code || fallbackQuote.origin,
        destination: selectedOffer.destination?.code || fallbackQuote.destination,
        mode: selectedOffer.mode === 'air' ? 'air' : 'ocean',
        containerType: selectedPayload?.containers?.[0]?.type || fallbackQuote.containerType,
        weight: selectedPayload?.shipmentTotals?.lb || fallbackQuote.weight,
        volume: selectedPayload?.shipmentTotals?.cft || fallbackQuote.volume,
        incoterm: fallbackQuote.incoterm,
        price: selectedOffer.price,
      }
    : fallbackQuote;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    shipment: {
      origin: quote.origin,
      destination: quote.destination,
      mode: quote.mode,
      containerType: quote.containerType,
      weight: quote.weight,
      volume: quote.volume,
      readyDate: selectedPayload?.readyDate || '2026-02-15',
      incoterm: quote.incoterm,
      cargoDescription: '',
    },
    shipper: { company: 'Pacific Imports Ltd', contactName: 'Alex Chen', email: 'alex@pacific.io', phone: '+1 415 555 0144', address: '120 Pier 33, San Francisco, CA' },
    consignee: { company: 'Northwind Trading', contactName: 'Yuki Tanaka', email: 'yuki@northwind.jp', phone: '+81 3 5555 0123', address: '4-1-2 Marunouchi, Chiyoda-ku, Tokyo' },
    documents: [],
  });

  const update = (section, key, value) => setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));
  const addDoc = (name) => setForm((f) => ({ ...f, documents: [...f.documents, { name, size: `${Math.floor(Math.random() * 800) + 100} KB` }] }));
  const removeDoc = (idx) => setForm((f) => ({ ...f, documents: f.documents.filter((_, i) => i !== idx) }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = () => {
    toast.success(`Booking confirmed for ${quote.providerName}!`);
    // Clear the offer selection now that we've booked it.
    sessionStorage.removeItem('kwe_selected_offer');
    sessionStorage.removeItem('kwe_selected_payload');
    setTimeout(() => navigate('/shipments'), 1000);
  };

  return (
    <div className="space-y-6" data-testid="booking-page">
      <PageHeader breadcrumb="Bookings · New" title="Create Booking" subtitle={`${quote.providerName} · ${quote.origin} → ${quote.destination} · $${Math.round(quote.price).toLocaleString()}`} />

      {selectedOffer && (
        <div data-testid="prefilled-banner" className="bg-gradient-to-r from-[#EAF3FF] to-white border border-[#1E6AE1]/30 rounded-xl p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#1E6AE1] text-white flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[#0B2545]">Prefilled from your Instant Quote</div>
            <div className="text-xs text-slate-600 mt-0.5">
              {selectedOffer.serviceType} · {selectedOffer.providerName} · {selectedOffer.transit} days · Matrix {selectedOffer.matrixId}
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              sessionStorage.removeItem('kwe_selected_offer');
              sessionStorage.removeItem('kwe_selected_payload');
              window.location.reload();
            }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Start blank
          </Button>
        </div>
      )}

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const completed = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all',
                      completed && 'bg-emerald-500 text-white',
                      active && 'bg-[#0F172A] text-white ring-4 ring-[#0F172A]/10',
                      !completed && !active && 'bg-slate-100 text-slate-400'
                    )}
                  >
                    {completed ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <div className="hidden sm:block">
                    <div className={cn('text-xs font-semibold uppercase tracking-widest', active ? 'text-[#0F172A]' : 'text-slate-400')}>Step {s.id}</div>
                    <div className={cn('text-sm font-bold', active ? 'text-[#0F172A]' : 'text-slate-500')}>{s.label}</div>
                  </div>
                </div>
                {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 rounded-full mx-1', completed ? 'bg-emerald-500' : 'bg-slate-100')} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6 md:p-8 fade-in">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#0F172A]">Shipment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput label="Origin" value={form.shipment.origin} onChange={(v) => update('shipment', 'origin', v)} />
              <FieldInput label="Destination" value={form.shipment.destination} onChange={(v) => update('shipment', 'destination', v)} />
              <FieldSelect label="Mode" value={form.shipment.mode} onChange={(v) => update('shipment', 'mode', v)} options={[['ocean', 'Ocean'], ['air', 'Air'], ['road', 'Road']]} />
              <FieldInput label="Container" value={form.shipment.containerType} onChange={(v) => update('shipment', 'containerType', v)} />
              <FieldInput label="Weight (kg)" type="number" value={form.shipment.weight} onChange={(v) => update('shipment', 'weight', v)} />
              <FieldInput label="Volume (CBM)" type="number" value={form.shipment.volume} onChange={(v) => update('shipment', 'volume', v)} />
              <FieldInput label="Ready date" type="date" value={form.shipment.readyDate} onChange={(v) => update('shipment', 'readyDate', v)} />
              <FieldSelect label="Incoterm" value={form.shipment.incoterm} onChange={(v) => update('shipment', 'incoterm', v)} options={['EXW', 'FOB', 'CIF', 'DDP', 'DAP', 'FCA'].map((c) => [c, c])} />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Cargo description</Label>
              <Textarea
                data-testid="cargo-description"
                className="mt-1.5 rounded-xl border-slate-200"
                placeholder="e.g. Consumer electronics — non-hazardous"
                value={form.shipment.cargoDescription}
                onChange={(e) => update('shipment', 'cargoDescription', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <PartyForm title="Shipper Information" data={form.shipper} onChange={(k, v) => update('shipper', k, v)} prefix="shipper" />
        )}

        {step === 3 && (
          <PartyForm title="Consignee Information" data={form.consignee} onChange={(k, v) => update('consignee', k, v)} prefix="consignee" />
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#0F172A]">Documents</h2>
            <p className="text-sm text-slate-500">Upload commercial invoice, packing list, certificate of origin and other required documents.</p>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors cursor-pointer"
              onClick={() => addDoc(`Document-${Date.now()}.pdf`)}
              data-testid="upload-zone"
            >
              <Upload className="h-10 w-10 text-slate-400 mx-auto" />
              <div className="font-semibold mt-3 text-[#0F172A]">Drop files here or click to upload</div>
              <div className="text-xs text-slate-500 mt-1">PDF, DOCX, XLSX up to 25MB each</div>
            </div>
            {form.documents.length > 0 && (
              <div className="space-y-2">
                {form.documents.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/15 text-[#a8862a] flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#0F172A] truncate">{d.name}</div>
                      <div className="text-xs text-slate-500">{d.size}</div>
                    </div>
                    <button onClick={() => removeDoc(i)} className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#0F172A]">Review & Confirm</h2>
            <ReviewSection title="Carrier" rows={[['Provider', quote.providerName], ['Service', quote.serviceType], ['Transit', `${quote.transitDays} days`], ['Total', `$${quote.price.toLocaleString()}`]]} />
            <ReviewSection title="Shipment" rows={[['Lane', `${form.shipment.origin} → ${form.shipment.destination}`], ['Mode', form.shipment.mode], ['Container', form.shipment.containerType], ['Weight', `${form.shipment.weight} kg`], ['Volume', `${form.shipment.volume} CBM`], ['Ready', form.shipment.readyDate], ['Incoterm', form.shipment.incoterm]]} />
            <ReviewSection title="Shipper" rows={[['Company', form.shipper.company], ['Contact', form.shipper.contactName], ['Email', form.shipper.email]]} />
            <ReviewSection title="Consignee" rows={[['Company', form.consignee.company], ['Contact', form.consignee.contactName], ['Email', form.consignee.email]]} />
            <ReviewSection title="Documents" rows={form.documents.length ? form.documents.map((d) => [d.name, d.size]) : [['No documents uploaded', '']]} />
          </div>
        )}

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <Button variant="outline" onClick={back} disabled={step === 1} data-testid="booking-back" className="rounded-xl h-11 gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length ? (
            <Button onClick={next} data-testid="booking-next" className="h-11 px-6 rounded-xl bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold gap-1">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} data-testid="booking-submit" className="h-11 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#c19f2d] hover:brightness-110 text-[#0F172A] font-semibold">
              Confirm Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <Input data-testid={`field-${label.toLowerCase().replace(/\s+/g, '-')}`} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 h-11 rounded-xl border-slate-200" />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5 h-11 rounded-xl border-slate-200" data-testid={`select-${label.toLowerCase()}`}><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PartyForm({ title, data, onChange, prefix }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput label="Company" value={data.company} onChange={(v) => onChange('company', v)} />
        <FieldInput label="Contact name" value={data.contactName} onChange={(v) => onChange('contactName', v)} />
        <FieldInput label="Email" type="email" value={data.email} onChange={(v) => onChange('email', v)} />
        <FieldInput label="Phone" value={data.phone} onChange={(v) => onChange('phone', v)} />
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Address</Label>
        <Textarea data-testid={`${prefix}-address`} className="mt-1.5 rounded-xl border-slate-200" value={data.address} onChange={(e) => onChange('address', e.target.value)} rows={3} />
      </div>
    </div>
  );
}

function ReviewSection({ title, rows }) {
  return (
    <div className="rounded-xl bg-slate-50/60 border border-slate-100 p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">{title}</div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-semibold text-[#0F172A] text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
