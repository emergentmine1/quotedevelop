// KWE API client — talks to the Spring Boot backend using its REAL endpoints.
// Base URL comes from NEXT_PUBLIC_BACKEND_URL (set it to your deployed backend).
//
// Endpoints (see backend-java controllers):
//   GET  /api/v1/profiledata/defaults          quote form starting defaults (cdcodes)
//   GET  /api/v1/masterdata/codes?cmcode=...    dropdown options per category
//   GET  /api/v1/masterdata/airports?query=     airport search (origin/destination)
//   GET  /api/v1/masterdata/countries           active country list
//   POST /api/v1/quote-requests                 submit a quote request -> { qrid, qrref, status }

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not configured');
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => ({}));
    const err = new Error(problem?.detail || problem?.title || `Request failed (${res.status})`);
    err.status = res.status;
    err.problem = problem;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

// ------------------------------------------------------------
// Master data / defaults
// ------------------------------------------------------------

/** GET /api/v1/profiledata/defaults */
export function getQuoteDefaults() {
  return request('/api/v1/profiledata/defaults');
}

/** GET /api/v1/masterdata/codes?cmcode=CGT,PKT -> { items: [{ cmcode, description, codes:[{cdcode,description,sequence}] }] } */
export function getMasterCodes(cmcodes = []) {
  const qs = cmcodes.length ? `?cmcode=${encodeURIComponent(cmcodes.join(','))}` : '';
  return request(`/api/v1/masterdata/codes${qs}`);
}

/** GET /api/v1/masterdata/airports?query=&countryCode=&limit= */
export function searchAirports(query, countryCode, limit) {
  const p = new URLSearchParams();
  if (query) p.set('query', query);
  if (countryCode) p.set('countryCode', countryCode);
  if (limit) p.set('limit', String(limit));
  const qs = p.toString();
  return request(`/api/v1/masterdata/airports${qs ? `?${qs}` : ''}`);
}

/** GET /api/v1/masterdata/countries */
export function listCountries() {
  return request('/api/v1/masterdata/countries');
}

/** POST /api/v1/quote-requests -> { qrid, qrref, status } */
export function submitQuoteRequest(payload) {
  return request('/api/v1/quote-requests', { method: 'POST', body: payload });
}

// ------------------------------------------------------------
// Code resolution — fetch the real cdcodes once, cache them.
// Lets the submit payload use accurate md_codedetail cdcodes
// (mode/cargo/rating/pickup/uom from defaults, packageType from PKT,
// accessorial services from ACS, door/port from PDT) instead of guesses.
// ------------------------------------------------------------

let _codesPromise = null;

/** Loads { defaults, categories:{PKT:[...],ACS:[...],PDT:[...]} }. Cached across calls. */
export function loadQuoteCodes() {
  if (!_codesPromise) {
    _codesPromise = Promise.all([getQuoteDefaults(), getMasterCodes(['PKT', 'ACS', 'PDT'])])
      .then(([defaults, master]) => ({ defaults, categories: indexCategories(master) }))
      .catch((e) => {
        _codesPromise = null; // allow retry
        throw e;
      });
  }
  return _codesPromise;
}

function indexCategories(master) {
  const map = {};
  (master?.items || []).forEach((c) => {
    map[c.cmcode] = c.codes || [];
  });
  return map;
}

const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const lc = (s) => String(s || '').toLowerCase();

/** Match a UI package-type label (e.g. "Boxes/Crates") to a PKT cdcode (e.g. PKTBOX). */
function resolvePackageType(categories, label) {
  const list = categories?.PKT || [];
  if (!list.length || !label) return undefined;
  const key = norm(String(label).split('/')[0]); // "Boxes/Crates" -> "BOXES"
  const singular = key.replace(/S$/, ''); // "BOXES" -> "BOXE"; also try 3-letter stem
  const stem = key.slice(0, 3);
  const hit =
    list.find((c) => norm(c.description) === key) ||
    list.find((c) => norm(c.description) === singular) ||
    list.find((c) => norm(c.description).startsWith(stem) || key.startsWith(norm(c.description)));
  return hit?.cdcode;
}

/** Map selected additional services to ACS cdcodes by matching their descriptions. */
function resolveAccessorials(categories, services) {
  const list = categories?.ACS || [];
  if (!list.length || !services) return [];
  const find = (pred) => list.find(pred)?.cdcode;
  const has = (c, ...words) => {
    const d = lc(c.description);
    return words.every((w) => d.includes(w));
  };
  const out = [];
  if (services.insurance) {
    const c = find((x) => has(x, 'insurance') || has(x, 'insur'));
    if (c) out.push(c);
  }
  if (services.customsOrigin) {
    const c = find((x) => has(x, 'customs', 'origin') || has(x, 'export'));
    if (c) out.push(c);
  }
  if (services.customsDestination) {
    const c = find((x) => has(x, 'customs', 'destination') || has(x, 'import'));
    if (c) out.push(c);
  }
  return [...new Set(out)];
}

/** Resolve the door vs port cdcode from the PDT category. */
function resolvePdt(categories, isDoor, fallback) {
  const list = categories?.PDT || [];
  const hit = list.find((c) => (isDoor ? lc(c.description).includes('door') : lc(c.description).includes('port')));
  return hit?.cdcode || fallback;
}

// ------------------------------------------------------------
// Payload mapping: InstantQuote form state -> QuoteRequestPayload DTO
// (maps to tx_quoterequest + tx_quoterequestdetails).
// ------------------------------------------------------------

const KG_PER_LB = 0.453592;
const CM_PER_IN = 2.54;
const CFT_PER_CBM = 35.3147;
const AIR_VOLUMETRIC_KG_PER_CBM = 167;

const toKg = (v, unit) => (unit === 'LB' ? (Number(v) || 0) * KG_PER_LB : Number(v) || 0);
const toCm = (v, unit) => (unit === 'IN' ? (Number(v) || 0) * CM_PER_IN : Number(v) || 0);
const round = (n, d = 4) => Number((Number(n) || 0).toFixed(d));

function isoDateTime(isoDate) {
  return isoDate ? `${isoDate}T00:00:00` : null;
}

/**
 * @param iq       InstantQuote payload (buildPayload output)
 * @param contact  trimmed contact object
 * @param ctx      { weightUnit, dimUnit, calcMode, units, totalShipment, isContainerCargo }
 * @param resolved result of loadQuoteCodes() — { defaults, categories } — or null (offline fallback)
 */
export function mapToQuoteRequestPayload(iq, contact, ctx = {}, resolved = null) {
  const d = resolved?.defaults || {};
  const cats = resolved?.categories || {};

  // Canonical codes: prefer live defaults, fall back to documented ProfileData values.
  const mode = d.mode || 'TPMA';
  const cargoType = d.cargoType || 'CGTPNP';
  const ratingType = d.ratingType || 'RTTPU';
  const weightUom = d.weightUom || 'WUMKG';
  const dimensionUom = d.dimensionUom || 'DUMCM';
  const volumeUom = d.volumeUom || 'VUMCBM';

  const pickupType = resolvePdt(cats, iq.originType === 'door', d.pickupType || (iq.originType === 'door' ? 'PDTDO' : 'PDTPO'));
  const deliveryType = resolvePdt(cats, iq.destinationType === 'door', d.deliveryType || (iq.destinationType === 'door' ? 'PDTDO' : 'PDTPO'));

  // Convert all totals to the canonical KG / CBM so they match weightUom / volumeUom.
  const weightKg = (iq.shipmentTotals?.lb || 0) * KG_PER_LB;
  const cbm = (iq.shipmentTotals?.cft || 0) / CFT_PER_CBM;
  const chargeableKg = Math.max(weightKg, cbm * AIR_VOLUMETRIC_KG_PER_CBM);

  // Line items — public app is Air + Packages/Pallets. Values converted to KG / CM.
  let lineItems;
  if (ctx.calcMode === 'total') {
    const pkg = resolvePackageType(cats, 'Boxes/Crates');
    lineItems = [
      {
        commodity: (iq.commodity || 'General cargo').slice(0, 256),
        quantity: 1,
        ...(pkg ? { packageType: pkg } : {}),
        grossWeight: round(toKg(ctx.totalShipment?.weight, ctx.weightUnit)),
        grossWeightUom: weightUom,
        volume: round(ctx.dimUnit === 'CM' ? Number(ctx.totalShipment?.volume) || 0 : (Number(ctx.totalShipment?.volume) || 0) / CFT_PER_CBM),
        volumeUom,
        dimensionUom,
        isHazmat: Boolean(iq.services?.hazardous),
        isStackable: Boolean(iq.services?.stackable ?? true),
      },
    ];
  } else {
    lineItems = (ctx.units || []).map((u) => {
      const pkg = resolvePackageType(cats, u.packageType);
      return {
        commodity: ((u.commodity || iq.commodity) || 'General cargo').slice(0, 256),
        quantity: Number(u.units) || 1,
        ...(pkg ? { packageType: pkg } : {}),
        grossWeight: round(toKg(u.weight, ctx.weightUnit)),
        grossWeightUom: weightUom,
        length: round(toCm(u.length, ctx.dimUnit)),
        width: round(toCm(u.width, ctx.dimUnit)),
        height: round(toCm(u.height, ctx.dimUnit)),
        dimensionUom,
        isHazmat: Boolean(u.hazardous),
        isStackable: true,
      };
    });
  }
  if (!lineItems.length) {
    lineItems = [{ commodity: (iq.commodity || 'General cargo').slice(0, 256), quantity: 1, isHazmat: false, isStackable: true }];
  }

  const address =
    contact.addressDisplay ||
    [contact.addressLine1, contact.city, contact.state, contact.postalCode].filter(Boolean).join(', ') ||
    undefined;

  return {
    mode,
    cargoType,
    ratingType,
    pickupType,
    originPortCode: iq.origin?.code,
    pickupCity: iq.originType === 'door' ? iq.origin?.city : undefined,
    pickupCountryCode: iq.origin?.countryCode,
    deliveryType,
    destinationPortCode: iq.destination?.code,
    deliveryCity: iq.destinationType === 'door' ? iq.destination?.city : undefined,
    deliveryCountryCode: iq.destination?.countryCode,
    weightUom,
    dimensionUom,
    totalGrossWeight: round(weightKg),
    totalGrossWeightUom: weightUom,
    totalVolume: round(cbm),
    totalVolumeUom: volumeUom,
    totalChargeableWeight: round(chargeableKg),
    totalChargeableWeightUom: weightUom,
    cargoReadyDate: isoDateTime(iq.readyDate),
    requiredDeliveryDate: isoDateTime(iq.requiredDeliveryDate),
    fullName: contact.fullName,
    companyName: contact.company,
    isCommercialCustomer: Boolean(iq.commercialCustomer),
    email: contact.email,
    isConsentEmail: Boolean(iq.customerEmailConsent),
    phone: contact.phone || undefined,
    jobTitle: contact.jobTitle || undefined,
    address,
    countryCode: contact.countryCode || undefined,
    lineItems,
    accessorialServices: resolveAccessorials(cats, iq.services),
  };
}
