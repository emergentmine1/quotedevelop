// Admin quote list: live Java backend when VITE_BACKEND_URL is reachable, sample data otherwise.
import {
  isBackendAvailable,
  listQuoteRequests,
  updateQuoteRequestStatus,
  getMasterCodes,
  listCountries,
} from '@/lib/api-client';

// UI statuses; cdcodes are resolved from the RQS category, fallbacks used when it can't be matched.
export const QUOTE_STATUSES = [
  { key: 'new', label: 'New', match: 'new', fallback: 'RQSNEW' },
  { key: 'reviewed', label: 'Reviewed', match: 'review', fallback: 'RQSREV' },
  { key: 'sent', label: 'Sent', match: 'sent', fallback: 'RQSSNT' },
  { key: 'won', label: 'Won', match: 'won', fallback: 'RQSWON' },
  { key: 'lost', label: 'Lost', match: 'lost', fallback: 'RQSLST' },
];

const SAMPLE_KEY = 'kwe_admin_quotes_v1';

let _statusMap = null;
export async function loadStatusMap(live) {
  if (_statusMap) return _statusMap;
  let codes = [];
  if (live) {
    const res = await getMasterCodes(['RQS']).catch(() => null);
    codes = res?.items?.find((c) => c.cmcode === 'RQS')?.codes || [];
  }
  const toCode = {};
  QUOTE_STATUSES.forEach((s) => {
    const hit = codes.find((c) => String(c.description || '').toLowerCase().includes(s.match));
    toCode[s.key] = hit?.cdcode || s.fallback;
  });
  const toKey = Object.fromEntries(Object.entries(toCode).map(([k, v]) => [v, k]));
  _statusMap = { toCode, toKey };
  return _statusMap;
}

function daysAgo(n, h = 9) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 15, 0, 0);
  return d.toISOString().slice(0, 19);
}

const SAMPLE_ROWS = [
  ['Priya Sharma', 'Acme Imports LLC', 'priya.sharma@acmeimports.com', 'PVG', 'CN', 'LAX', 'US', 420, 2.1, 'RQSNEW', 0],
  ['Michael Chen', 'Globex Trading', 'm.chen@globex-trading.com', 'SIN', 'SG', 'AMS', 'NL', 185, 0.9, 'RQSREV', 1],
  ['Sarah Johnson', 'Northwind Co', 'sarah@northwind.co', 'FRA', 'DE', 'JFK', 'US', 960, 4.4, 'RQSSNT', 2],
  ['Kenji Watanabe', 'Hikari Electronics', 'k.watanabe@hikari.jp', 'NRT', 'JP', 'ORD', 'US', 310, 1.6, 'RQSWON', 4],
  ['Amelia Brooks', 'Brooks & Daughters', 'amelia@brooksd.co.uk', 'LHR', 'GB', 'DXB', 'AE', 75, 0.4, 'RQSLST', 6],
  ['Rahul Mehta', 'Sunrise Pharma', 'rahul.mehta@sunrisepharma.in', 'BOM', 'IN', 'FRA', 'DE', 540, 2.8, 'RQSNEW', 0],
  ['Lucia Fernández', 'Andes Textiles', 'lucia@andestextiles.cl', 'SCL', 'CL', 'MIA', 'US', 220, 1.2, 'RQSREV', 3],
  ['David Kim', 'Seoul Robotics', 'david.kim@seoulrobotics.kr', 'ICN', 'KR', 'LAX', 'US', 1280, 6.3, 'RQSSNT', 5],
  ['Olivia Martin', 'Maison Martin', 'olivia@maisonmartin.fr', 'CDG', 'FR', 'HKG', 'HK', 140, 0.7, 'RQSWON', 9],
  ['Thomas Müller', 'Alpen Maschinenbau', 't.mueller@alpen-mb.de', 'MUC', 'DE', 'PVG', 'CN', 880, 3.9, 'RQSNEW', 1],
  ['Grace Wong', 'Harbour Gifts', 'grace@harbourgifts.hk', 'HKG', 'HK', 'SYD', 'AU', 95, 0.5, 'RQSLST', 12],
  ['James Carter', 'Carter Medical', 'j.carter@cartermedical.com', 'ORD', 'US', 'NRT', 'JP', 260, 1.3, 'RQSREV', 15],
];

function seedSamples() {
  return SAMPLE_ROWS.map((r, i) => {
    const qrid = 1045 + i;
    const created = daysAgo(r[10], 8 + (i % 8));
    return {
      qrid,
      qrref: `QR-${created.slice(0, 4)}-${String(qrid).padStart(6, '0')}`,
      status: r[9],
      mode: 'TPMA',
      fullName: r[0],
      companyName: r[1],
      email: r[2],
      phone: '+1 555 0100',
      originPortCode: r[3],
      pickupCountryCode: r[4],
      destinationPortCode: r[5],
      deliveryCountryCode: r[6],
      totalGrossWeight: r[7],
      totalVolume: r[8],
      totalChargeableWeight: Math.max(r[7], Math.round(r[8] * 167)),
      cargoReadyDate: daysAgo(-(3 + (i % 5))),
      createdAt: created,
      modifiedAt: created,
    };
  });
}

function readSamples() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAMPLE_KEY) || 'null');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch {
    // corrupt storage — reseed below
  }
  const seeded = seedSamples();
  localStorage.setItem(SAMPLE_KEY, JSON.stringify(seeded));
  return seeded;
}

function filterSamples(rows, { query, countryCode, status, from, to }) {
  const q = (query || '').trim().toLowerCase();
  return rows.filter((r) => {
    if (status && r.status !== status) return false;
    if (countryCode && r.pickupCountryCode !== countryCode && r.deliveryCountryCode !== countryCode) return false;
    const day = r.createdAt.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    if (!q) return true;
    return [r.qrref, r.fullName, r.companyName, r.email, r.originPortCode, r.destinationPortCode]
      .some((v) => String(v || '').toLowerCase().includes(q));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** filters: { query, countryCode, statusKey, from, to } -> { items, total, live, statusMap } */
export async function fetchQuotes(filters = {}) {
  const live = await isBackendAvailable();
  const statusMap = await loadStatusMap(live);
  const params = {
    query: filters.query,
    countryCode: filters.countryCode,
    status: filters.statusKey ? statusMap.toCode[filters.statusKey] : undefined,
    from: filters.from,
    to: filters.to,
  };
  if (live) {
    const page = await listQuoteRequests({ ...params, limit: 500 });
    return { items: page.items || [], total: page.total ?? 0, live, statusMap };
  }
  const items = filterSamples(readSamples(), params);
  return { items, total: items.length, live, statusMap };
}

/** Returns the updated row. */
export async function setQuoteStatus(qrid, statusKey) {
  const live = await isBackendAvailable();
  const { toCode } = await loadStatusMap(live);
  const code = toCode[statusKey];
  if (live) return updateQuoteRequestStatus(qrid, code);
  const rows = readSamples();
  const now = new Date().toISOString().slice(0, 19);
  const next = rows.map((r) => (r.qrid === qrid ? { ...r, status: code, modifiedAt: now } : r));
  localStorage.setItem(SAMPLE_KEY, JSON.stringify(next));
  return next.find((r) => r.qrid === qrid);
}

/** [{ code, name }] for the country filter. */
export async function fetchCountryOptions() {
  if (await isBackendAvailable()) {
    const res = await listCountries().catch(() => null);
    return (res?.items || []).map((c) => ({ code: c.countryCode, name: c.countryName }));
  }
  const codes = new Set();
  readSamples().forEach((r) => {
    codes.add(r.pickupCountryCode);
    codes.add(r.deliveryCountryCode);
  });
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  return [...codes].sort().map((code) => ({ code, name: names.of(code) || code }));
}

/** Flat rows for CSV / Excel export. */
export function toExportRows(items, toKey) {
  const label = (code) => QUOTE_STATUSES.find((s) => s.key === toKey[code])?.label || code;
  return items.map((r) => ({
    Reference: r.qrref,
    Status: label(r.status),
    Created: (r.createdAt || '').replace('T', ' ').slice(0, 16),
    Customer: r.fullName,
    Company: r.companyName || '',
    Email: r.email,
    Phone: r.phone || '',
    Origin: r.originPortCode || '',
    'Origin country': r.pickupCountryCode || '',
    Destination: r.destinationPortCode || '',
    'Destination country': r.deliveryCountryCode || '',
    'Gross weight (kg)': r.totalGrossWeight ?? '',
    'Volume (cbm)': r.totalVolume ?? '',
    'Chargeable weight (kg)': r.totalChargeableWeight ?? '',
    'Cargo ready': (r.cargoReadyDate || '').slice(0, 10),
  }));
}
