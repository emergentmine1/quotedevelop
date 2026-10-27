import { AIRLINES, AIR_DESTINATIONS, SERVICE_TYPES, CURRENCIES } from '@/lib/pricing-data';
import { airports } from '@/lib/mock-data';

export const CATEGORIES = {
  freight: {
    key: 'freight',
    label: 'Freight',
    prefix: 'RP-FRT',
    description: 'Freight charges · weight-break buy rates by destination',
    chargeCodes: [
      { code: 'FRTRV', name: 'Freight' },
      { code: 'FSCRV', name: 'Fuel Surcharge' },
      { code: 'SECFEERV', name: 'Security Fee' },
    ],
  },
  origin: {
    key: 'origin',
    label: 'Origin',
    prefix: 'RP-ORG',
    description: 'Local & other charges at origin',
    chargeCodes: [
      { code: 'CUSTCLRV', name: 'Customs Clearance' },
      { code: 'CARTAGERV', name: 'Cartage' },
      { code: 'PKPRV', name: 'Pickup' },
      { code: 'HANRV', name: 'Handling' },
      { code: 'IORV', name: 'Importer / Exporter of Record' },
      { code: 'CPRV', name: 'Customs Processing' },
    ],
  },
};

export const categoryOfChargeCode = (code) =>
  Object.values(CATEGORIES).find((c) => c.chargeCodes.some((cc) => cc.code === code))?.key || null;

export const CARRIERS = AIRLINES.map((a) => ({ code: a.flightCode, name: a.name }));
export const TRANSPORT_MODES = [{ code: 'AIR', name: 'Air' }];
export { SERVICE_TYPES, CURRENCIES };
export const ORIGIN_PORTS = airports.map((a) => ({ code: a.code, name: a.city }));
export const DEST_PORTS = AIR_DESTINATIONS.map((d) => ({ code: d.code, name: d.city }));

export const CALC_METHODS = [
  { code: 'FLAT', name: 'Flat Amount', flat: true, weight: false },
  { code: 'WEIGHT', name: 'Chargeable Wt X Rate Per Unit (KG)', flat: false, weight: true },
  { code: 'FLAT_WEIGHT', name: 'Flat Amount + Chargeable Wt X Rate Per Unit (KG)', flat: true, weight: true },
];
export const calcMethod = (code) => CALC_METHODS.find((m) => m.code === code) || CALC_METHODS[0];

export const STATUSES = [
  { code: 'DRAFT', name: 'Draft' },
  { code: 'ACTIVE', name: 'Active' },
  { code: 'INACTIVE', name: 'Inactive' },
];

export const nameOf = (list, code) => list.find((x) => x.code === code)?.name || code || '—';
