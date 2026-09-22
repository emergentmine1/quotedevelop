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

/** GET /api/v1/masterdata/codes?cmcode=CGT,PKT */
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

// ------------------------------------------------------------
// Quote request submission
// ------------------------------------------------------------

/** POST /api/v1/quote-requests -> { qrid, qrref, status } */
export function submitQuoteRequest(payload) {
  return request('/api/v1/quote-requests', { method: 'POST', body: payload });
}

// ------------------------------------------------------------
// Payload mapping: InstantQuote form state -> QuoteRequestPayload DTO
// ------------------------------------------------------------
// Code fields use md_codedetail cdcodes (e.g. TPMA, not "AIR"). The values
// below mirror ProfileDataController defaults. The ones marked TODO must be
// confirmed against GET /api/v1/masterdata/codes once the live DB is reachable
// (packageType -> PKT cdcode, accessorialServices -> ACS cdcodes).

const KG_PER_LB = 0.453592;
const CFT_PER_CBM = 35.3147;

function isoDateTime(isoDate) {
  return isoDate ? `${isoDate}T00:00:00` : null;
}

/**
 * @param iq   the InstantQuote payload (buildPayload output)
 * @param contact trimmed contact object
 * @param ctx  { weightUnit, dimUnit, calcMode, units, totalShipment, isContainerCargo }
 */
export function mapToQuoteRequestPayload(iq, contact, ctx = {}) {
  const weightUomCode = ctx.weightUnit === 'LB' ? 'WUMLB' : 'WUMKG';
  const dimUomCode = ctx.dimUnit === 'IN' ? 'DUMIN' : 'DUMCM';

  const weightKg = (iq.shipmentTotals?.lb || 0) * KG_PER_LB;
  const cbm = (iq.shipmentTotals?.cft || 0) / CFT_PER_CBM;
  const chargeableKg = Math.max(weightKg, cbm * 167); // air volumetric factor

  const pickupType = iq.originType === 'door' ? 'PDTDO' : 'PDTPO';
  const deliveryType = iq.destinationType === 'door' ? 'PDTDO' : 'PDTPO';

  // Line items — public app is Air + Packages/Pallets only.
  let lineItems;
  if (ctx.calcMode === 'total') {
    lineItems = [
      {
        commodity: (iq.commodity || 'General cargo').slice(0, 256),
        quantity: 1,
        packageType: 'Boxes/Crates', // TODO: PKT cdcode
        grossWeight: Number((ctx.totalShipment?.weight ?? 0)) || 0,
        grossWeightUom: weightUomCode,
        volume: Number((ctx.totalShipment?.volume ?? 0)) || 0,
        volumeUom: ctx.dimUnit === 'CM' ? 'VUMCBM' : 'VUMCFT',
        dimensionUom: dimUomCode,
        isHazmat: Boolean(iq.services?.hazardous),
        isStackable: Boolean(iq.services?.stackable ?? true),
      },
    ];
  } else {
    lineItems = (ctx.units || []).map((u) => ({
      commodity: ((u.commodity || iq.commodity) || 'General cargo').slice(0, 256),
      quantity: Number(u.units) || 1,
      packageType: (u.packageType || 'Boxes/Crates').slice(0, 20), // TODO: PKT cdcode
      grossWeight: Number(u.weight) || 0,
      grossWeightUom: weightUomCode,
      length: Number(u.length) || 0,
      width: Number(u.width) || 0,
      height: Number(u.height) || 0,
      dimensionUom: dimUomCode,
      isHazmat: Boolean(u.hazardous),
      isStackable: true,
    }));
  }
  if (!lineItems.length) {
    lineItems = [
      { commodity: (iq.commodity || 'General cargo').slice(0, 256), quantity: 1, packageType: 'Boxes/Crates', isHazmat: false, isStackable: true },
    ];
  }

  const address =
    contact.addressDisplay ||
    [contact.addressLine1, contact.city, contact.state, contact.postalCode].filter(Boolean).join(', ') ||
    undefined;

  return {
    mode: 'TPMA', // Air
    cargoType: 'CGTPNP', // Packages & Pallets
    ratingType: 'RTTPU', // Per unit
    pickupType,
    originPortCode: iq.origin?.code,
    pickupCity: iq.originType === 'door' ? iq.origin?.city : undefined,
    pickupCountryCode: iq.origin?.countryCode,
    deliveryType,
    destinationPortCode: iq.destination?.code,
    deliveryCity: iq.destinationType === 'door' ? iq.destination?.city : undefined,
    deliveryCountryCode: iq.destination?.countryCode,
    weightUom: weightUomCode,
    dimensionUom: dimUomCode,
    totalGrossWeight: Number(weightKg.toFixed(4)),
    totalGrossWeightUom: 'WUMKG',
    totalVolume: Number(cbm.toFixed(4)),
    totalVolumeUom: 'VUMCBM',
    totalChargeableWeight: Number(chargeableKg.toFixed(4)),
    totalChargeableWeightUom: 'WUMKG',
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
    accessorialServices: [], // TODO: map iq.services -> ACS cdcodes via /masterdata/codes?cmcode=ACS
  };
}
