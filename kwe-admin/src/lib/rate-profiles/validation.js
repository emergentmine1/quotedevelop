import { z } from 'zod';
import { CATEGORIES, calcMethod } from '@/lib/rate-profiles/constants';

// Weight-break headers: only digits and < > = may be typed (e.g. ">=45").
export const WEIGHT_BREAK_ALLOWED = /[^0-9<>=]/g;
export const WEIGHT_BREAK_PATTERN = /^(<|>|<=|>=|=)?\d+$/;
export const sanitizeWeightBreak = (v) => String(v ?? '').replace(WEIGHT_BREAK_ALLOWED, '');

const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v));
const money = z.preprocess(num, z.number({ invalid_type_error: 'Must be a number' }).min(0, 'Must be 0 or more').optional());
const percent = z.preprocess(num, z.number().min(0, 'Markup must be 0–100%').max(100, 'Markup must be 0–100%').optional());
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');

const rowSchema = z.object({
  destPort: z.string().min(1, 'Pick a destination port'),
  flatAmount: money,
  minAmount: money,
  maxAmount: money,
  rates: z.array(money),
});

export function profileSchema(category) {
  const codes = CATEGORIES[category].chargeCodes.map((c) => c.code);
  return z.object({
    chargeCode: z.string().refine((v) => codes.includes(v), `Charge code must be one of ${codes.join(', ')}`),
    carrierCode: z.string().min(1, 'Pick a carrier'),
    transportMode: z.string().min(1, 'Pick a transport mode'),
    serviceType: z.string().min(1, 'Pick a service type'),
    originPort: z.string().min(1, 'Pick an origin port'),
    calculationMethod: z.string().min(1, 'Pick a calculation method'),
    currencyCode: z.string().min(1, 'Pick a currency'),
    effectiveDate: dateStr,
    expirationDate: dateStr,
    externalMarkup: percent,
    internalMarkup: percent,
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
    remarks: z.string().max(500).optional(),
    weightBreaks: z.array(z.object({ label: z.string() })),
    rows: z.array(rowSchema).min(1, 'Add at least one destination row'),
  }).superRefine((d, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    if (d.effectiveDate && d.expirationDate && d.effectiveDate > d.expirationDate) {
      issue(['expirationDate'], 'Expiration date must be on or after the effective date');
    }
    const m = calcMethod(d.calculationMethod);
    if (m.weight) {
      if (d.weightBreaks.length === 0) issue(['weightBreaks'], 'Add at least one weight break column');
      d.weightBreaks.forEach((w, c) => {
        if (!WEIGHT_BREAK_PATTERN.test(w.label)) issue(['weightBreaks', c, 'label'], 'Weight break must look like >=45 (digits and < > = only)');
      });
      const labels = d.weightBreaks.map((w) => w.label);
      if (new Set(labels).size !== labels.length) issue(['weightBreaks'], 'Weight break columns must be unique');
    }
    const seen = new Set();
    d.rows.forEach((r, i) => {
      if (r.destPort && seen.has(r.destPort)) issue(['rows', i, 'destPort'], `Destination ${r.destPort} is used in more than one row`);
      seen.add(r.destPort);
      if (m.weight && r.minAmount !== undefined && r.maxAmount !== undefined && !(r.minAmount < r.maxAmount)) {
        issue(['rows', i, 'maxAmount'], 'Minimum amount must be smaller than maximum amount');
      }
      if (m.flat && r.flatAmount === undefined) issue(['rows', i, 'flatAmount'], 'Flat amount is required');
      if (m.weight && d.weightBreaks.some((_, c) => r.rates[c] === undefined)) issue(['rows', i, 'rates'], 'Enter a buy rate for every weight break');
    });
  });
}

const overlaps = (a, b) => a.effectiveDate <= b.expirationDate && b.effectiveDate <= a.expirationDate;
export const UNIQUE_KEY = ['chargeCode', 'carrierCode', 'transportMode', 'serviceType', 'originPort'];

/** Active profile that clashes with `candidate`, or null. Same rule the database enforces. */
export function findActiveOverlap(candidate, all) {
  if (candidate.status !== 'ACTIVE') return null;
  return all.find((p) => p.id !== candidate.id && p.status === 'ACTIVE'
    && UNIQUE_KEY.every((k) => p[k] === candidate[k]) && overlaps(p, candidate)) || null;
}

export const overlapMessage = (clash) =>
  `An Active profile (${clash.profileCode}) already exists for this Charge Code, Carrier, Transport Mode, Service Type and Origin Port between ${clash.effectiveDate} and ${clash.expirationDate}. Change the dates, or set one of them to Draft/Inactive.`;
