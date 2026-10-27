import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CATEGORIES, CARRIERS, TRANSPORT_MODES, SERVICE_TYPES, ORIGIN_PORTS, CALC_METHODS, CURRENCIES, STATUSES,
} from '@/lib/rate-profiles/constants';

export const blockNegative = {
  min: 0,
  onKeyDown: (e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault(); },
};

export function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-6">
      <div className="mb-5">
        <h3 className="font-bold text-[#0F172A]">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function ProfileHeaderFields({ form, category }) {
  const { control, register, formState: { errors } } = form;
  const sel = (name, label, options, testId) => (
    <FieldSelect name={name} label={label} control={control} error={errors[name]} options={options} testId={testId} />
  );
  return (
    <Section title="General Information" subtitle="Rate Profile header · one Active profile per Charge Code + Carrier + Mode + Service + Origin for any date">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sel('chargeCode', 'Charge Code', CATEGORIES[category].chargeCodes.map((c) => [c.code, `${c.code} · ${c.name}`]), 'form-charge-code')}
        {sel('carrierCode', 'Carrier Code', CARRIERS.map((c) => [c.code, `${c.code} · ${c.name}`]), 'form-carrier')}
        {sel('transportMode', 'Transport Mode', TRANSPORT_MODES.map((m) => [m.code, m.name]), 'form-transport-mode')}
        {sel('serviceType', 'Service Type', SERVICE_TYPES.map((s) => [s, s]), 'form-service')}
        {sel('originPort', 'Origin Port', ORIGIN_PORTS.map((p) => [p.code, `${p.code} · ${p.name}`]), 'form-origin')}
        {sel('calculationMethod', 'Calculation Method', CALC_METHODS.map((m) => [m.code, m.name]), 'form-calculation-method')}
        {sel('currencyCode', 'Currency Code', CURRENCIES.map((c) => [c, c]), 'form-currency')}
        <FieldInput label="Effective Date" type="date" error={errors.effectiveDate} testId="form-effective" {...register('effectiveDate')} />
        <FieldInput label="Expiration Date" type="date" error={errors.expirationDate} testId="form-expiry" {...register('expirationDate')} />
        <FieldInput label="External Markup (%)" type="number" step="0.01" max={100} placeholder="e.g. 10" error={errors.externalMarkup} testId="form-external-markup" {...blockNegative} {...register('externalMarkup')} />
        <FieldInput label="Internal Markup (%)" type="number" step="0.01" max={100} placeholder="e.g. 5" error={errors.internalMarkup} testId="form-internal-markup" {...blockNegative} {...register('internalMarkup')} />
        {sel('status', 'Status', STATUSES.map((s) => [s.code, s.name]), 'form-status')}
      </div>
      <div className="mt-4">
        <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Remarks (optional)</Label>
        <Textarea data-testid="form-remarks" rows={2} {...register('remarks')} className="mt-1.5 rounded-xl border-slate-200" />
      </div>
    </Section>
  );
}

function FieldInput({ label, error, testId, ...props }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <Input data-testid={testId} {...props} className="mt-1.5 h-11 rounded-xl border-slate-200" />
      {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
    </div>
  );
}

function FieldSelect({ label, name, control, error, options, testId }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <Controller control={control} name={name} render={({ field }) => (
        <Select value={field.value || ''} onValueChange={field.onChange}>
          <SelectTrigger data-testid={testId} className="mt-1.5 h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent className="max-h-72">{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
      )} />
      {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
    </div>
  );
}
