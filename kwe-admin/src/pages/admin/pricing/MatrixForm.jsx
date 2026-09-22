import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plane, Ship, Container as ContainerIcon, Save, Trash2, Plus, AlertCircle, Receipt, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  airMatrices, lclMatrices, fclMatrices, surchargeMatrices,
  AIRLINES, AIR_DESTINATIONS, OCEAN_PORTS, OCEAN_CARRIERS, SERVICE_TYPES, CURRENCIES, SURCHARGE_TYPES,
} from '@/lib/pricing-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------------- Zod schemas ----------------
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date');

const validityRefine = (d) => d.effectiveDate < d.expiryDate;

const nonNegativeNumberInputProps = {
  min: 0,
  onKeyDown: (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
  },
  onPaste: (e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (pasted.trim().startsWith('-')) e.preventDefault();
  },
};

const DEFAULT_AIR_SAMPLE_ROWS = [
  { destination: 'TPE', flatAmount: 0, min: 30, max: undefined, rates: [1.2, 1.1, 1.4] },
  { destination: 'SIN', flatAmount: 0, min: 25, max: undefined, rates: [0.9, 0.8, 0.75] },
  { destination: 'ICN', flatAmount: 0, min: 20, max: undefined, rates: [0.1, 0.1, 0.15] },
  { destination: 'HKG', flatAmount: 0, min: 30, max: undefined, rates: [1.1, 1.1, 1.0] },
];

function normalizeRates(rates, count) {
  return Array.from({ length: count }, (_, idx) => {
    const value = Number(rates?.[idx]);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  });
}

function seedAirRows(weightCount, primaryDestination, primaryRates) {
  const baseRows = DEFAULT_AIR_SAMPLE_ROWS.map((row) => ({
    ...row,
    rates: normalizeRates(row.rates, weightCount),
  }));

  if (!primaryDestination) return baseRows;

  const destination = String(primaryDestination).trim().toUpperCase();
  const primary = {
    destination,
    flatAmount: 0,
    min: baseRows[0]?.min ?? 0,
    max: undefined,
    rates: normalizeRates(primaryRates, weightCount),
  };

  const remaining = baseRows.filter((r) => r.destination !== destination);
  return [primary, ...remaining].slice(0, 4);
}

const optionalNumber = z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().finite().optional());

const airWeightBreakSchema = z.object({
  label: z.string().trim().min(1, 'Weight break label is required'),
});

const airDestinationRowSchema = z.object({
  destination: z.string().min(1, 'Pick a destination'),
  flatAmount: z.coerce.number().min(0, 'Flat amount must be >= 0').optional(),
  min: z.coerce.number().min(0),
  max: optionalNumber,
  rates: z.array(z.coerce.number().min(0, 'Rate must be >= 0')),
}).refine((row) => row.max === undefined || row.max > row.min, { message: 'Max must be greater than Min', path: ['max'] });

const airSchema = z.object({
  airlineCode: z.string().min(1, 'Pick an airline'),
  origin: z.string().min(1, 'Origin is required'),
  chargeCode: z.string().min(1, 'Charge code is required'),
  serviceType: z.string().min(1, 'Service type required'),
  calculationMethod: z.enum(['flat_amount', 'weight_rate', 'flat_plus_weight_rate']),
  currency: z.string().min(1),
  effectiveDate: dateSchema,
  expiryDate: dateSchema,
  status: z.enum(['active', 'draft', 'expired', 'inactive']),
  remarks: z.string().optional(),
  weightBreaks: z.array(airWeightBreakSchema).min(1, 'At least one weight break is required'),
  destinationRows: z.array(airDestinationRowSchema).min(1, 'At least one destination row is required'),
})
  .refine(validityRefine, { message: 'Effective date must be before expiry date', path: ['expiryDate'] })
  .refine((d) => d.destinationRows.every((row) => row.rates.length === d.weightBreaks.length), {
    message: 'Each destination row must have a rate for each weight break',
    path: ['destinationRows'],
  })
  .refine((d) => {
    const seen = new Set();
    for (const row of d.destinationRows) {
      if (seen.has(row.destination)) return false;
      seen.add(row.destination);
    }
    return true;
  }, { message: 'Destination rows must be unique', path: ['destinationRows'] });

const lclBreakSchema = z.object({
  minCBM: z.coerce.number().min(0),
  maxCBM: z.coerce.number().positive(),
  ratePerCbm: z.coerce.number().positive('Rate per CBM must be > 0'),
  documentationFee: z.coerce.number().min(0),
  thc: z.coerce.number().min(0),
  other: z.coerce.number().min(0),
}).refine((b) => b.minCBM < b.maxCBM, { message: 'Min CBM must be less than max', path: ['maxCBM'] });

const lclSchema = z.object({
  carrierCode: z.string().min(1, 'Pick a carrier'),
  originPort: z.string().min(1, 'Pick origin'),
  destinationPort: z.string().min(1, 'Pick destination'),
  currency: z.string().min(1),
  effectiveDate: dateSchema,
  expiryDate: dateSchema,
  status: z.enum(['active', 'draft', 'expired', 'inactive']),
  remarks: z.string().optional(),
  breaks: z.array(lclBreakSchema).min(1, 'At least one CBM break required'),
})
  .refine((d) => d.originPort !== d.destinationPort, { message: 'Origin and destination must differ', path: ['destinationPort'] })
  .refine(validityRefine, { message: 'Effective date must be before expiry date', path: ['expiryDate'] })
  .refine((d) => {
    for (let i = 1; i < d.breaks.length; i++) if (d.breaks[i].minCBM < d.breaks[i - 1].maxCBM) return false;
    return true;
  }, { message: 'CBM breaks must not overlap (each min ≥ previous max)', path: ['breaks'] });

const fclSchema = z.object({
  carrierCode: z.string().min(1, 'Pick a carrier'),
  originPort: z.string().min(1, 'Pick origin'),
  destinationPort: z.string().min(1, 'Pick destination'),
  currency: z.string().min(1),
  effectiveDate: dateSchema,
  expiryDate: dateSchema,
  status: z.enum(['active', 'draft', 'expired', 'inactive']),
  remarks: z.string().optional(),
  containerRates: z.object({
    '20GP': z.coerce.number().min(0, 'Required for FCL'),
    '40GP': z.coerce.number().min(0, 'Required for FCL'),
    '40HQ': z.coerce.number().min(0, 'Required for FCL'),
    '45HQ': z.coerce.number().min(0).optional(),
    'Special': z.coerce.number().min(0).optional(),
  }),
  thc: z.coerce.number().min(0),
  documentationFee: z.coerce.number().min(0),
  sealFee: z.coerce.number().min(0),
})
  .refine((d) => d.originPort !== d.destinationPort, { message: 'Origin and destination must differ', path: ['destinationPort'] })
  .refine(validityRefine, { message: 'Effective date must be before expiry date', path: ['expiryDate'] });

const surSchema = z.object({
  surchargeType: z.string().min(1),
  appliesTo: z.enum(['air', 'ocean', 'all']),
  calculationType: z.enum(['percentage', 'flat']),
  value: z.coerce.number().positive('Value must be > 0'),
  currency: z.string().min(1),
  effectiveDate: dateSchema,
  expiryDate: dateSchema,
  status: z.enum(['active', 'draft', 'expired', 'inactive']),
  remarks: z.string().optional(),
}).refine(validityRefine, { message: 'Effective date must be before expiry date', path: ['expiryDate'] });

const SCHEMAS = { air: airSchema, lcl: lclSchema, fcl: fclSchema, surcharge: surSchema };

// ---------------- Defaults ----------------
function defaultValues(type, existing) {
  if (existing) {
    if (type === 'air') {
      // Backward-compatible mapping for legacy air matrix shape.
      if (existing.weightBreaks && existing.destinationRows) {
        const weightBreaks = (existing.weightBreaks || []).map((b, idx) => ({
          label: typeof b?.label === 'string' && b.label.trim() ? b.label : `>=${b?.value ?? idx + 1}`,
        }));
        const count = Math.max(weightBreaks.length, 1);
        const destinationRows = (existing.destinationRows || []).map((row) => ({
          destination: row.destination || '',
          flatAmount: Number(row.flatAmount || 0),
          min: Number(row.min || 0),
          max: row.max === '' || row.max === null || row.max === undefined ? undefined : Number(row.max),
          rates: normalizeRates(row.rates, count),
        }));
        return {
          ...existing,
          calculationMethod: existing.calculationMethod || existing.calculationType || 'flat_amount',
          weightBreaks: count > 0 ? weightBreaks : [{ label: '>=45' }],
          destinationRows: destinationRows.length > 0 ? destinationRows : seedAirRows(count),
        };
      }
      const mappedBreaks = (existing.breaks || []).map((b) => ({ label: `>=${b.weight}` }));
      const mappedRates = (existing.breaks || []).map((b) => Number(
        (Number(b.freight || 0) + Number(b.fuel || 0) + Number(b.security || 0) + Number(b.other || 0)).toFixed(2),
      ));
      const weightBreaks = mappedBreaks.length > 0 ? mappedBreaks : [{ label: '>=45' }, { label: '>=100' }, { label: '>=300' }];
      const count = weightBreaks.length;
      return {
        airlineCode: existing.airlineCode || '',
        origin: existing.origin || 'ORD',
        chargeCode: existing.chargeCode || 'FRTAB',
        serviceType: existing.serviceType || 'Regular',
        calculationMethod: existing.calculationMethod || existing.calculationType || 'flat_amount',
        currency: existing.currency || 'USD',
        effectiveDate: existing.effectiveDate,
        expiryDate: existing.expiryDate,
        status: existing.status,
        remarks: existing.remarks || '',
        weightBreaks,
        destinationRows: seedAirRows(count, existing.destination, mappedRates),
      };
    }
    if (type === 'fcl') {
      return {
        carrierCode: existing.carrierCode,
        originPort: existing.originPort,
        destinationPort: existing.destinationPort,
        currency: existing.currency,
        effectiveDate: existing.effectiveDate,
        expiryDate: existing.expiryDate,
        status: existing.status,
        remarks: existing.remarks || '',
        containerRates: { ...existing.containerRates, Special: existing.containerRates.Special || 0 },
        thc: existing.surcharges?.thc || 0,
        documentationFee: existing.surcharges?.documentationFee || 0,
        sealFee: existing.surcharges?.sealFee || 0,
      };
    }
    return { ...existing };
  }
  const today = new Date().toISOString().split('T')[0];
  const yearLater = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
  if (type === 'air') {
    const weightBreaks = [{ label: '>=45' }, { label: '>=100' }, { label: '>=300' }];
    return {
      airlineCode: '', origin: 'ORD', chargeCode: 'FRTAB', serviceType: 'Regular', currency: 'USD',
      calculationMethod: 'flat_amount',
      effectiveDate: today, expiryDate: yearLater, status: 'draft', remarks: '',
      weightBreaks,
      destinationRows: seedAirRows(weightBreaks.length),
    };
  }
  if (type === 'lcl') {
    return {
      carrierCode: '', originPort: '', destinationPort: '', currency: 'USD',
      effectiveDate: today, expiryDate: yearLater, status: 'draft', remarks: '',
      breaks: [
        { minCBM: 0, maxCBM: 5, ratePerCbm: 50, documentationFee: 35, thc: 28, other: 12 },
        { minCBM: 5, maxCBM: 10, ratePerCbm: 45, documentationFee: 35, thc: 28, other: 10 },
      ],
    };
  }
  if (type === 'fcl') {
    return {
      carrierCode: '', originPort: '', destinationPort: '', currency: 'USD',
      effectiveDate: today, expiryDate: yearLater, status: 'draft', remarks: '',
      containerRates: { '20GP': 1800, '40GP': 2800, '40HQ': 3100, '45HQ': 3500, 'Special': 0 },
      thc: 220, documentationFee: 45, sealFee: 8,
    };
  }
  return {
    surchargeType: 'fuel', appliesTo: 'all', calculationType: 'percentage',
    value: 12, currency: 'USD', effectiveDate: today, expiryDate: yearLater,
    status: 'draft', remarks: '',
  };
}

function lookup(id) {
  return airMatrices.find((m) => m.id === id) || lclMatrices.find((m) => m.id === id) || fclMatrices.find((m) => m.id === id) || surchargeMatrices.find((m) => m.id === id);
}

const TYPE_META = {
  air: { Icon: Plane, label: 'Air Matrix', color: 'bg-sky-500' },
  lcl: { Icon: Ship, label: 'Ocean LCL', color: 'bg-indigo-500' },
  fcl: { Icon: ContainerIcon, label: 'Ocean FCL', color: 'bg-teal-500' },
  surcharge: { Icon: Receipt, label: 'Surcharge', color: 'bg-amber-500' },
};

function extractFirstErrorMessage(err, seen = new Set()) {
  if (!err) return null;
  if (typeof err === 'string') return err;
  if (typeof err !== 'object') return null;
  if (seen.has(err)) return null;
  seen.add(err);

  if (typeof err.message === 'string' && err.message.trim()) return err.message;

  if (Array.isArray(err)) {
    for (const item of err) {
      const nested = extractFirstErrorMessage(item, seen);
      if (nested) return nested;
    }
    return null;
  }

  for (const [key, value] of Object.entries(err)) {
    // react-hook-form attaches DOM refs that can be circular.
    if (key === 'ref') continue;
    const nested = extractFirstErrorMessage(value, seen);
    if (nested) return nested;
  }

  return null;
}

// ---------------- COMPONENT ----------------
export default function MatrixForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editing = !!id && id !== 'new';
  const existing = editing ? lookup(id) : null;
  const type = existing?.type || params.get('type') || 'air';
  const meta = TYPE_META[type];
  const [submitted, setSubmitted] = useState(false);

  const schema = SCHEMAS[type];
  const {
    register, handleSubmit, control, watch, getValues, setValue, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(() => defaultValues(type, existing), [type, existing]),
    mode: 'onBlur',
  });

  const onSubmit = async (data) => {
    // Mock: pretend we saved
    await new Promise((r) => setTimeout(r, 500));
    setSubmitted(true);
    toast.success(editing ? `Matrix ${id} updated` : 'New matrix created');
    setTimeout(() => navigate(`/admin/pricing/${type}`), 800);
  };

  const formErrors = Object.entries(errors).map(([k, v]) => ({
    field: k,
    message: extractFirstErrorMessage(v) || 'Invalid value',
  }));

  return (
    <div className="space-y-6" data-testid={`matrix-form-${type}`}>
      <PageHeader
        breadcrumb={`Pricing · ${meta.label}`}
        title={editing ? `Edit · ${existing?.name || id}` : `New ${meta.label}`}
        subtitle={editing ? `Update an existing matrix · v${existing?.version || 1}` : 'Create a new pricing matrix from scratch'}
        action={
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl h-10 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Cancel
          </Button>
        }
      />

      {/* Type pill */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-4 flex items-center gap-3">
        <div className={cn('h-10 w-10 rounded-xl text-white flex items-center justify-center', meta.color)}>
          <meta.Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Matrix type</div>
          <div className="font-bold text-[#0F172A]">{meta.label}</div>
        </div>
      </div>

      {/* Error summary */}
      {formErrors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-700">
            <AlertCircle className="h-4 w-4" /> {formErrors.length} validation issue{formErrors.length !== 1 ? 's' : ''}
          </div>
          <ul className="mt-2 text-xs text-red-700 space-y-0.5 list-disc list-inside">
            {formErrors.slice(0, 6).map((e, i) => (
              <li key={i}><span className="font-mono">{e.field}:</span> {e.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* GENERAL SECTION */}
        <Section title="General Information" subtitle="Identifying metadata and validity">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {type === 'air' && <>
              <FieldSelect label="Airline" name="airlineCode" register={register} control={control} error={errors.airlineCode} testId="form-airline" options={AIRLINES.map((a) => [a.code, `${a.flightCode} · ${a.name}`])} />
              <FieldInput label="Origin" name="origin" register={register} error={errors.origin} testId="form-origin" />
              <FieldInput label="Charge code" name="chargeCode" register={register} error={errors.chargeCode} testId="form-charge-code" />
              <FieldSelect label="Service type" name="serviceType" register={register} control={control} error={errors.serviceType} testId="form-service" options={SERVICE_TYPES.map((s) => [s, s])} />
              <FieldSelect
                label="Calculation Method"
                name="calculationMethod"
                register={register}
                control={control}
                error={errors.calculationMethod}
                testId="form-calculation-method"
                options={[
                  ['flat_amount', 'Flat Amount'],
                  ['weight_rate', 'Chargeable Wt X Rate Per Unit (KG)'],
                  ['flat_plus_weight_rate', 'Flat Amount + Chargeable Wt X Rate Per Unit (KG)'],
                ]}
              />
            </>}
            {(type === 'lcl' || type === 'fcl') && <>
              <FieldSelect label="Carrier" name="carrierCode" register={register} control={control} error={errors.carrierCode} testId="form-carrier" options={OCEAN_CARRIERS.map((c) => [c.code, c.name])} />
              <FieldSelect label="Origin port" name="originPort" register={register} control={control} error={errors.originPort} testId="form-origin" options={OCEAN_PORTS.map((p) => [p.code, `${p.city} (${p.code})`])} />
              <FieldSelect label="Destination port" name="destinationPort" register={register} control={control} error={errors.destinationPort} testId="form-destination" options={OCEAN_PORTS.map((p) => [p.code, `${p.city} (${p.code})`])} />
            </>}
            {type === 'surcharge' && <>
              <FieldSelect label="Surcharge type" name="surchargeType" register={register} control={control} error={errors.surchargeType} testId="form-surcharge-type" options={SURCHARGE_TYPES.map((s) => [s.key, s.name])} />
              <FieldSelect label="Applies to" name="appliesTo" register={register} control={control} error={errors.appliesTo} testId="form-applies" options={[['all', 'All modes'], ['air', 'Air freight'], ['ocean', 'Ocean freight']]} />
              <FieldSelect label="Calculation" name="calculationType" register={register} control={control} error={errors.calculationType} testId="form-calc-type" options={[['percentage', 'Percentage of base'], ['flat', 'Flat fee']]} />
            </>}

            <FieldSelect label="Currency" name="currency" register={register} control={control} error={errors.currency} testId="form-currency" options={CURRENCIES.map((c) => [c, c])} />
            <FieldInput label="Effective date" name="effectiveDate" type="date" register={register} error={errors.effectiveDate} testId="form-effective" />
            <FieldInput label="Expiry date" name="expiryDate" type="date" register={register} error={errors.expiryDate} testId="form-expiry" />
            <FieldSelect label="Status" name="status" register={register} control={control} error={errors.status} testId="form-status" options={[['draft', 'Draft'], ['active', 'Active'], ['inactive', 'Inactive']]} />
            {type === 'surcharge' && (
              <FieldInput label="Value" name="value" type="number" step="0.01" register={register} error={errors.value} testId="form-value" />
            )}
          </div>
          <div className="mt-4">
            <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Remarks (optional)</Label>
            <Textarea data-testid="form-remarks" rows={2} {...register('remarks')} className="mt-1.5 rounded-xl border-slate-200" />
          </div>
        </Section>

        {/* TYPE-SPECIFIC BREAKS */}
        {type === 'air' && <AirMatrixGrid control={control} register={register} errors={errors} watch={watch} getValues={getValues} setValue={setValue} calculationMethod={watch('calculationMethod')} />}
        {type === 'lcl' && <LclBreaks control={control} register={register} errors={errors} />}
        {type === 'fcl' && <FclRates register={register} errors={errors} />}

        {/* Submit bar */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 -mx-4 px-4 py-4 lg:mx-0 lg:rounded-2xl lg:border lg:kwe-shadow flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {submitted ? <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Saved · redirecting…</span> : 'Validation runs on save. Drafts can be saved with incomplete data.'}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl h-11"><Link to={`/admin/pricing/${type}`}>Cancel</Link></Button>
            <Button type="submit" disabled={isSubmitting} data-testid="form-save" className="rounded-xl h-11 bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold gap-1.5">
              <Save className="h-4 w-4" /> {editing ? 'Save Changes' : 'Create Matrix'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ---------------- BLOCKS ----------------
function Section({ title, subtitle, children }) {
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

function AirMatrixGrid({ control, register, errors, watch, getValues, setValue, calculationMethod }) {
  const { fields: weightFields, append: appendWeight, remove: removeWeight } = useFieldArray({ control, name: 'weightBreaks' });
  const { fields: rowFields, append: appendRow, remove: removeRow } = useFieldArray({ control, name: 'destinationRows' });
  const rows = watch('destinationRows') || [];
  const showWeightRateColumns = calculationMethod !== 'flat_amount';
  const showFlatAmountColumn = calculationMethod === 'flat_amount' || calculationMethod === 'flat_plus_weight_rate';

  const addWeightColumn = () => {
    const existing = getValues('weightBreaks') || [];
    const lastLabel = existing[existing.length - 1]?.label || '';
    const parsed = Number(String(lastLabel).replace(/[^\d.]/g, ''));
    const nextNumber = Number.isFinite(parsed) && parsed > 0 ? parsed + 50 : (existing.length + 1) * 50;
    appendWeight({ label: `>=${nextNumber}` });

    const rowValues = getValues('destinationRows') || [];
    rowValues.forEach((row, rowIndex) => {
      const nextRates = [...(row.rates || []), 0];
      setValue(`destinationRows.${rowIndex}.rates`, nextRates, { shouldDirty: true, shouldValidate: true });
    });
  };

  const removeWeightColumn = (weightIndex) => {
    if (weightFields.length <= 1) return;
    removeWeight(weightIndex);

    const rowValues = getValues('destinationRows') || [];
    rowValues.forEach((row, rowIndex) => {
      const nextRates = [...(row.rates || [])];
      nextRates.splice(weightIndex, 1);
      setValue(`destinationRows.${rowIndex}.rates`, nextRates, { shouldDirty: true, shouldValidate: true });
    });
  };

  const addDestinationRow = () => {
    appendRow({ destination: '', flatAmount: 0, min: 0, max: undefined, rates: weightFields.map(() => 0) });
  };

  return (
    <Section title="Rate Matrix" subtitle="Horizontal axis is weight breaks and vertical axis is destination port">
      <div className="overflow-x-auto">
        <table className={cn('w-full text-sm table-fixed', showWeightRateColumns ? 'min-w-[980px]' : 'min-w-[520px]')}>
          <thead>
            <tr className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              <th className="text-left pb-2 px-2 w-44">Destination</th>
              {showFlatAmountColumn && <th className="text-left pb-2 px-2 w-32">Flat Amount</th>}
              {showWeightRateColumns && <th className="text-left pb-2 px-2 w-24">Min.</th>}
              {showWeightRateColumns && <th className="text-left pb-2 px-2 w-24">Max.</th>}
              {showWeightRateColumns && weightFields.map((wf, colIdx) => (
                <th key={wf.id} className="text-left pb-2 px-2 w-[170px]">
                  <div className="relative">
                    <Input
                      type="text"
                      {...register(`weightBreaks.${colIdx}.label`)}
                      className="h-10 w-full rounded-lg border-slate-200 pr-8"
                      data-testid={`weight-break-${colIdx}`}
                      placeholder=">=45"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWeightColumn(colIdx)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-red-500"
                      data-testid={`remove-weight-break-${colIdx}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowFields.map((row, rowIdx) => (
              <tr key={row.id}>
                <td className="px-2 py-1 align-top">
                  <Controller
                    control={control}
                    name={`destinationRows.${rowIdx}.destination`}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="h-10 rounded-lg border-slate-200" data-testid={`destination-row-${rowIdx}`}>
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {AIR_DESTINATIONS.map((d) => <SelectItem key={d.code} value={d.code}>{`${d.city} (${d.code})`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </td>
                {showFlatAmountColumn && (
                  <td className="px-2 py-1 align-top">
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`destinationRows.${rowIdx}.flatAmount`)}
                      {...nonNegativeNumberInputProps}
                      className="h-10 rounded-lg border-slate-200"
                      data-testid={`flat-amount-${rowIdx}`}
                    />
                  </td>
                )}
                {showWeightRateColumns && (
                  <td className="px-2 py-1 align-top">
                    <Input type="number" step="any" {...register(`destinationRows.${rowIdx}.min`)} {...nonNegativeNumberInputProps} className="h-10 rounded-lg border-slate-200" data-testid={`row-min-${rowIdx}`} />
                  </td>
                )}
                {showWeightRateColumns && (
                  <td className="px-2 py-1 align-top">
                    <Input type="number" step="any" {...register(`destinationRows.${rowIdx}.max`)} {...nonNegativeNumberInputProps} className="h-10 rounded-lg border-slate-200" data-testid={`row-max-${rowIdx}`} />
                  </td>
                )}
                {showWeightRateColumns && weightFields.map((_, colIdx) => (
                  <td key={`${row.id}-${colIdx}`} className="px-2 py-1 align-top w-[170px]">
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`destinationRows.${rowIdx}.rates.${colIdx}`)}
                      {...nonNegativeNumberInputProps}
                      className="h-10 rounded-lg border-slate-200"
                      data-testid={`rate-${rowIdx}-${colIdx}`}
                    />
                  </td>
                ))}
                <td className="px-2 py-1 align-top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(rowIdx)}
                    className="h-10 w-10 p-0 text-red-500"
                    data-testid={`remove-destination-${rowIdx}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {showWeightRateColumns && (
          <Button type="button" variant="outline" onClick={addWeightColumn} className="rounded-xl gap-1.5" data-testid="add-weight-break">
            <Plus className="h-4 w-4" /> Add Weight Break Column
          </Button>
        )}
        <Button type="button" variant="outline" onClick={addDestinationRow} className="rounded-xl gap-1.5" data-testid="add-destination-row">
          <Plus className="h-4 w-4" /> Add Destination Row
        </Button>
      </div>

      {(errors.weightBreaks?.message || errors.destinationRows?.message) && (
        <p className="text-xs text-red-600 mt-2">
          {errors.weightBreaks?.message || errors.destinationRows?.message}
        </p>
      )}

      {rows.map((_, rowIdx) => (
        <div key={`row-errors-${rowIdx}`} className="mt-1">
          {(errors.destinationRows?.[rowIdx]?.destination?.message || errors.destinationRows?.[rowIdx]?.max?.message) && (
            <p className="text-xs text-red-600">
              Row {rowIdx + 1}: {errors.destinationRows?.[rowIdx]?.destination?.message || errors.destinationRows?.[rowIdx]?.max?.message}
            </p>
          )}
        </div>
      ))}
    </Section>
  );
}

function LclBreaks({ control, register, errors }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'breaks' });
  return (
    <Section title="CBM Breaks" subtitle="Define rate tiers by CBM range · ranges must not overlap">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              <th className="text-left pb-2 px-2">Min CBM</th>
              <th className="text-left pb-2 px-2">Max CBM</th>
              <th className="text-left pb-2 px-2">Rate/CBM</th>
              <th className="text-left pb-2 px-2">Doc fee</th>
              <th className="text-left pb-2 px-2">THC</th>
              <th className="text-left pb-2 px-2">Other</th>
              <th className="pb-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, idx) => (
              <tr key={f.id}>
                <td className="px-2 py-1"><Input data-testid={`break-min-${idx}`} type="number" step="any" {...register(`breaks.${idx}.minCBM`)} className="h-10 rounded-lg border-slate-200" /></td>
                <td className="px-2 py-1"><Input data-testid={`break-max-${idx}`} type="number" step="any" {...register(`breaks.${idx}.maxCBM`)} className="h-10 rounded-lg border-slate-200" /></td>
                <td className="px-2 py-1"><Input type="number" step="0.01" {...register(`breaks.${idx}.ratePerCbm`)} className="h-10 rounded-lg border-slate-200" /></td>
                <td className="px-2 py-1"><Input type="number" step="0.01" {...register(`breaks.${idx}.documentationFee`)} className="h-10 rounded-lg border-slate-200" /></td>
                <td className="px-2 py-1"><Input type="number" step="0.01" {...register(`breaks.${idx}.thc`)} className="h-10 rounded-lg border-slate-200" /></td>
                <td className="px-2 py-1"><Input type="number" step="0.01" {...register(`breaks.${idx}.other`)} className="h-10 rounded-lg border-slate-200" /></td>
                <td className="px-2 py-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} className="h-10 w-10 p-0 text-red-500" data-testid={`remove-break-${idx}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" onClick={() => append({ minCBM: 10, maxCBM: 20, ratePerCbm: 40, documentationFee: 35, thc: 28, other: 10 })} className="mt-3 rounded-xl gap-1.5" data-testid="add-break">
        <Plus className="h-4 w-4" /> Add CBM Break
      </Button>
      {errors.breaks?.message && <p className="text-xs text-red-600 mt-2">{errors.breaks.message}</p>}
    </Section>
  );
}

function FclRates({ register, errors }) {
  return (
    <Section title="Container Rates" subtitle="Rates per equipment type · 20GP, 40GP and 40HQ are required">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['20GP', '40GP', '40HQ', '45HQ', 'Special'].map((c) => (
          <div key={c}>
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-600">{c}</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">$</span>
              <Input data-testid={`rate-${c}`} type="number" step="1" {...register(`containerRates.${c}`)} className="h-11 pl-7 rounded-xl border-slate-200" />
            </div>
            {errors.containerRates?.[c] && <p className="text-xs text-red-600 mt-1">{errors.containerRates[c]?.message}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-slate-100">
        <h4 className="font-bold text-sm text-[#0F172A] mb-3">FCL Surcharges</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FieldInput label="THC per container" name="thc" type="number" register={register} error={errors.thc} testId="form-thc" />
          <FieldInput label="Documentation fee" name="documentationFee" type="number" register={register} error={errors.documentationFee} testId="form-doc" />
          <FieldInput label="Seal fee per container" name="sealFee" type="number" register={register} error={errors.sealFee} testId="form-seal" />
        </div>
      </div>
    </Section>
  );
}

function FieldInput({ label, name, type = 'text', register, error, step, testId }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <Input
        data-testid={testId}
        type={type}
        step={step}
        {...register(name)}
        {...(type === 'number' ? nonNegativeNumberInputProps : {})}
        className="mt-1.5 h-11 rounded-xl border-slate-200"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
    </div>
  );
}

function FieldSelect({ label, name, control, error, options, testId }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value || ''} onValueChange={field.onChange}>
            <SelectTrigger data-testid={testId} className="mt-1.5 h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
    </div>
  );
}
