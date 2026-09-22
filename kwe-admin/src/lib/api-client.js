// KWE API client — thin wrapper around fetch that talks to the Spring Boot backend.
// Falls back gracefully to the localStorage mock while the Java service is not deployed.

const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => ({}));
    const err = new Error(problem?.detail || `Request failed (${res.status})`);
    err.status = res.status;
    err.problem = problem;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

// ------------------------------------------------------------
// Endpoint helpers
// ------------------------------------------------------------

/** Submit an inquiry to the Java backend (R2, R9). */
export function submitInquiry(payload) {
  return request('/api/v1/inquiries', { method: 'POST', body: payload });
}

/** Fetch config defaults (R3). */
export function getConfigDefaults() {
  return request('/api/v1/config/defaults');
}

/** Search ports (R4). */
export function searchPorts(query, type) {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (type)  params.set('type', type);
  return request(`/api/v1/ports?${params}`);
}

/** Admin: list inquiries. */
export function adminListInquiries({ status, from, to, page = 0, size = 25 } = {}) {
  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  if (from)   params.set('from', from);
  if (to)     params.set('to', to);
  return request(`/api/v1/admin/inquiries?${params}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('kwe_jwt') || ''}` },
  });
}

/** Admin: change status (Kanban drag-drop). */
export function adminChangeStatus(id, status, note) {
  return request(`/api/v1/admin/inquiries/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${localStorage.getItem('kwe_jwt') || ''}` },
    body: { status, note },
  });
}

// ------------------------------------------------------------
// Availability probe — used by leads-store.js to decide between
// live backend calls and the localStorage mock.
// ------------------------------------------------------------
let _availability = null;
export async function isBackendAvailable() {
  if (_availability !== null) return _availability;
  try {
    await Promise.race([
      request('/api/v1/config/defaults'),
      new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 1500)),
    ]);
    _availability = true;
  } catch {
    _availability = false;
  }
  return _availability;
}

/** Map a frontend InstantQuote payload into the Java {@code InquiryRequest} DTO shape. */
export function mapPayloadToInquiryRequest(payload, contact) {
  const exporterEnabled = Boolean(payload?.exporterLocationEnabled);
  return {
    serviceType: 'AIR',
    originPortCode:      payload.origin.code,
    destinationPortCode: payload.destination.code,
    cargoMode:           (payload.cargoMode || 'lcl').toUpperCase(),
    shippingMode:        (payload.shippingMode || 'air').toUpperCase(),
    hazardous:           Boolean(payload.services?.hazardous),
    commodity:           payload.commodity,
    weightKg:            ((payload.shipmentTotals?.lb || 0) / 2.20462).toFixed(2),
    volumeCbm:           ((payload.shipmentTotals?.cft || 0) / 35.3147).toFixed(3),
    readyDate:           payload.readyDate,
    requiredDeliveryDate: payload.requiredDeliveryDate,
    containers:          (payload.containers || []).map((c) => ({ type: c.type, count: c.count })),
    customerEmailConsent: Boolean(payload.customerEmailConsent),
    commercialCustomer:   Boolean(payload.commercialCustomer),
    contactPerson: {
      fullName:    contact.fullName,
      email:       contact.email,
      phone:       contact.phone || '',
      jobTitle:    contact.jobTitle || '',
      companyName: contact.company,
    },
    ...(exporterEnabled ? {
      exporter: {
        exporterName: contact.exporterName || contact.company,
        addressLine1: contact.addressLine1 || '',
        addressLine2: contact.addressLine2 || '',
        city:         contact.city || '',
        state:        contact.state || '',
        postalCode:   contact.postalCode || '',
        countryCode:  contact.countryCode || 'US',
      },
    } : {}),
    utmSource:   payload.utmSource || null,
    utmCampaign: payload.utmCampaign || null,
  };
}
