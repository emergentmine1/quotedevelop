// KWE Leads Store
// Persists leads captured from the public Instant Quote flow.
// Primary write path: POST /api/v1/inquiries (Java backend, Spring Boot).
// Fallback: localStorage (for local/mock demo mode).
// Admins consume this data via the Leads page in the admin panel.

import { submitInquiry, isBackendAvailable, mapPayloadToInquiryRequest } from '@/lib/api-client';

const STORAGE_KEY = 'kwe_leads_v2';

export const SALES_TEAMS = [
  { id: 'apac', name: 'APAC Sales Team', lead: 'M. Tanaka' },
  { id: 'amer', name: 'Americas Sales Team', lead: 'S. Patel' },
  { id: 'emea', name: 'EMEA Sales Team', lead: 'L. Wong' },
  { id: 'enterprise', name: 'Enterprise Accounts', lead: 'A. Chen' },
];

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function seedIfEmpty() {
  const existing = readAll();
  if (existing && existing.length) return existing;
  // Seed a handful of demo leads so the admin page is not empty on first visit.
  const now = Date.now();
  const buildPayload = (lead) => ({
    cargoMode: lead.cargoMode,
    shipmentTotals: lead.shipmentTotals,
    shippingMode: lead.shippingMode,
    origin: lead.origin,
    destination: lead.destination,
    readyDate: lead.readyDate,
    originType: 'port',
    destinationType: 'port',
    services: { customsOrigin: false, customsDestination: true, insurance: true, pickup: false, delivery: false, stackable: true, hazardous: false },
    containers: lead.containers,
  });
  const seed = [
    {
      id: 'LEAD-000001',
      name: 'Priya Sharma',
      email: 'priya.sharma@acmeimports.com',
      phone: '+1 415 555 0110',
      company: 'Acme Imports LLC',
      jobTitle: 'Head of Logistics',
      userType: 'existing',
      salesTeamId: 'amer',
      salesTeamName: 'Americas Sales Team',
      status: 'contacted',
      origin: { code: 'CNSHA', city: 'Shanghai', country: 'China', countryCode: 'CN' },
      destination: { code: 'USLAX', city: 'Los Angeles', country: 'USA', countryCode: 'US' },
      cargoMode: 'fcl',
      shippingMode: 'ocean',
      containers: [{ type: '40HQ', count: 2 }],
      shipmentTotals: { units: 2, cft: 0, lb: 0, isContainer: true },
      readyDate: new Date(now + 5 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(now - 3 * 86400000).toISOString(),
      notes: 'Repeat customer — quoted 2 × 40HQ CN→US.',
    },
    {
      id: 'LEAD-000002',
      name: 'Michael Chen',
      email: 'm.chen@globex-trading.com',
      phone: '+65 8888 2210',
      company: 'Globex Trading',
      jobTitle: 'Supply Chain Manager',
      userType: 'new',
      salesTeamId: 'apac',
      salesTeamName: 'APAC Sales Team',
      status: 'new',
      origin: { code: 'SGSIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG' },
      destination: { code: 'NLRTM', city: 'Rotterdam', country: 'Netherlands', countryCode: 'NL' },
      cargoMode: 'lcl',
      shippingMode: 'ocean',
      containers: [],
      shipmentTotals: { units: 12, cft: 320, lb: 1400, isContainer: false },
      readyDate: new Date(now + 10 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(now - 6 * 3600000).toISOString(),
      notes: 'First-time visitor from LinkedIn campaign.',
    },
    {
      id: 'LEAD-000003',
      name: 'Sarah Johnson',
      email: 'sarah@northwind.co',
      phone: '+44 20 7946 0993',
      company: 'Northwind Co',
      jobTitle: 'Procurement Lead',
      userType: 'existing',
      salesTeamId: 'emea',
      salesTeamName: 'EMEA Sales Team',
      status: 'qualified',
      origin: { code: 'DEHAM', city: 'Hamburg', country: 'Germany', countryCode: 'DE' },
      destination: { code: 'USNYC', city: 'New York', country: 'USA', countryCode: 'US' },
      cargoMode: 'fcl',
      shippingMode: 'ocean',
      containers: [{ type: '20GP', count: 1 }, { type: '40GP', count: 3 }],
      shipmentTotals: { units: 4, cft: 0, lb: 0, isContainer: true },
      readyDate: new Date(now + 21 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(now - 4 * 86400000).toISOString(),
      notes: 'Mixed container load — expecting proposal by Friday.',
    },
  ].map((lead) => ({ ...lead, quotePayload: buildPayload(lead) }));
  writeAll(seed);
  return seed;
}

export function listLeads() {
  return seedIfEmpty();
}

function nextId(list) {
  const nums = list
    .map((l) => parseInt(String(l.id).replace(/[^0-9]/g, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `LEAD-${String(max + 1).padStart(6, '0')}`;
}

export function createLead(partial) {
  const list = listLeads();
  const salesTeam = SALES_TEAMS.find((t) => t.id === partial.salesTeamId) || SALES_TEAMS[0];
  const lead = {
    id: nextId(list),
    createdAt: new Date().toISOString(),
    status: 'new',
    jobTitle: '',
    commodity: '',
    exporter: null,
    quotePayload: null,
    ...partial,
    salesTeamId: salesTeam.id,
    salesTeamName: salesTeam.name,
  };
  const next = [lead, ...list];
  writeAll(next);
  return lead;
}

/**
 * Preferred write path — attempts the Java backend first, mirrors the response
 * into localStorage for admin views, and returns { lead, backendResponse }.
 * If the backend is unreachable, silently falls back to the localStorage-only lead.
 */
export async function submitLeadAndInquiry(partial) {
  const lead = createLead(partial);
  try {
    const available = await isBackendAvailable();
    if (!available) return { lead, backendResponse: null, mode: 'localStorage' };
    const payload = mapPayloadToInquiryRequest(partial.quotePayload || {}, {
      fullName: partial.name,
      email: partial.email,
      phone: partial.phone,
      jobTitle: partial.jobTitle,
      company: partial.company,
      ...(partial.exporter || {}),
    });
    const response = await submitInquiry(payload);
    updateLead(lead.id, {
      backendReference: response?.reference,
      backendStatus: response?.status,
      backendQuote: response?.quote || null,
    });
    return { lead, backendResponse: response, mode: 'backend' };
  } catch (e) {
    // Backend unreachable / request failed — keep the localStorage lead.
    console.warn('[leads-store] backend unavailable, using localStorage fallback', e);
    return { lead, backendResponse: null, mode: 'localStorage' };
  }
}

export function updateLead(id, patch) {
  const list = listLeads();
  const next = list.map((l) => (l.id === id ? { ...l, ...patch } : l));
  writeAll(next);
}

export function deleteLead(id) {
  const list = listLeads();
  writeAll(list.filter((l) => l.id !== id));
}

export function leadsSummary() {
  const list = listLeads();
  return {
    total: list.length,
    new: list.filter((l) => l.status === 'new').length,
    contacted: list.filter((l) => l.status === 'contacted').length,
    qualified: list.filter((l) => l.status === 'qualified').length,
    won: list.filter((l) => l.status === 'won').length,
  };
}
