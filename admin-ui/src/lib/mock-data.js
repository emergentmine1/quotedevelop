// KWE Mock Data Library
// Generates realistic mock data for the freight forwarding platform

const PROVIDERS = [
  { id: 'p_dhl', name: 'DHL Global Forwarding', code: 'DHL', reliability: 4.8, color: '#FFCC00', textColor: '#0F172A' },
  { id: 'p_kn', name: 'Kuehne+Nagel', code: 'K+N', reliability: 4.7, color: '#005A9C', textColor: '#FFFFFF' },
  { id: 'p_dsv', name: 'DSV Air & Sea', code: 'DSV', reliability: 4.5, color: '#0066B3', textColor: '#FFFFFF' },
  { id: 'p_dbs', name: 'DB Schenker', code: 'DBS', reliability: 4.6, color: '#E2001A', textColor: '#FFFFFF' },
  { id: 'p_maersk', name: 'Maersk Logistics', code: 'MSK', reliability: 4.9, color: '#42B0D5', textColor: '#FFFFFF' },
  { id: 'p_yusen', name: 'Yusen Logistics', code: 'YSL', reliability: 4.7, color: '#003366', textColor: '#FFFFFF' },
  { id: 'p_expeditors', name: 'Expeditors International', code: 'EXP', reliability: 4.6, color: '#1F3A93', textColor: '#FFFFFF' },
  { id: 'p_chrobinson', name: 'C.H. Robinson', code: 'CHR', reliability: 4.4, color: '#003B71', textColor: '#FFFFFF' },
  { id: 'p_geodis', name: 'Geodis', code: 'GDS', reliability: 4.5, color: '#0033A0', textColor: '#FFFFFF' },
  { id: 'p_cma', name: 'CMA CGM Group', code: 'CMA', reliability: 4.6, color: '#E30613', textColor: '#FFFFFF' },
];

const PORTS = [
  { code: 'SGSIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG', region: 'APAC' },
  { code: 'CNSHA', city: 'Shanghai', country: 'China', countryCode: 'CN', region: 'APAC' },
  { code: 'HKHKG', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', region: 'APAC' },
  { code: 'JPTYO', city: 'Tokyo', country: 'Japan', countryCode: 'JP', region: 'APAC' },
  { code: 'KRPUS', city: 'Busan', country: 'South Korea', countryCode: 'KR', region: 'APAC' },
  { code: 'USLAX', city: 'Los Angeles', country: 'USA', countryCode: 'US', region: 'AMER' },
  { code: 'USNYC', city: 'New York', country: 'USA', countryCode: 'US', region: 'AMER' },
  { code: 'USORD', city: 'Chicago', country: 'USA', countryCode: 'US', region: 'AMER' },
  { code: 'DEHAM', city: 'Hamburg', country: 'Germany', countryCode: 'DE', region: 'EMEA' },
  { code: 'NLRTM', city: 'Rotterdam', country: 'Netherlands', countryCode: 'NL', region: 'EMEA' },
  { code: 'GBLON', city: 'London', country: 'UK', countryCode: 'GB', region: 'EMEA' },
  { code: 'AEDXB', city: 'Dubai', country: 'UAE', countryCode: 'AE', region: 'EMEA' },
  { code: 'INBOM', city: 'Mumbai', country: 'India', countryCode: 'IN', region: 'APAC' },
  { code: 'INMAA', city: 'Chennai', country: 'India', countryCode: 'IN', region: 'APAC' },
  { code: 'AUSYD', city: 'Sydney', country: 'Australia', countryCode: 'AU', region: 'APAC' },
];

const AIRPORTS = [
   { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', name: 'Chek Lap Kok' },
   { code: 'SIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG', name: 'Changi Airport' },
   { code: 'NRT', city: 'Tokyo', country: 'Japan', countryCode: 'JP', name: 'Narita International' },
   { code: 'BKK', city: 'Bangkok', country: 'Thailand', countryCode: 'TH', name: 'Suvarnabhumi' },
   { code: 'TPE', city: 'Taipei', country: 'Taiwan', countryCode: 'TW', name: 'Taiwan Taoyuan' },
   { code: 'ICN', city: 'Seoul', country: 'South Korea', countryCode: 'KR', name: 'Incheon International' },
   { code: 'PVG', city: 'Shanghai', country: 'China', countryCode: 'CN', name: 'Pudong International' },
   { code: 'LAX', city: 'Los Angeles', country: 'USA', countryCode: 'US', name: 'Los Angeles Intl' },
   { code: 'JFK', city: 'New York', country: 'USA', countryCode: 'US', name: 'John F. Kennedy Intl' },
   { code: 'ORD', city: 'Chicago', country: 'USA', countryCode: 'US', name: "O'Hare International" },
   { code: 'FRA', city: 'Frankfurt', country: 'Germany', countryCode: 'DE', name: 'Frankfurt am Main' },
   { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', name: 'Schiphol' },
   { code: 'LHR', city: 'London', country: 'UK', countryCode: 'GB', name: 'Heathrow' },
   { code: 'DXB', city: 'Dubai', country: 'UAE', countryCode: 'AE', name: 'Dubai International' },
   { code: 'BOM', city: 'Mumbai', country: 'India', countryCode: 'IN', name: 'Chhatrapati Shivaji' },
   { code: 'MAA', city: 'Chennai', country: 'India', countryCode: 'IN', name: 'Chennai International' },
   { code: 'SYD', city: 'Sydney', country: 'Australia', countryCode: 'AU', name: 'Kingsford Smith' },
 ];

const MODES = ['ocean', 'air', 'road'];
const CONTAINER_TYPES = ['20ft Standard', '40ft Standard', '40ft High Cube', '45ft High Cube', 'LCL', 'FCL'];
const INCOTERMS = ['EXW', 'FOB', 'CIF', 'DDP', 'DAP', 'FCA'];
const SHIPMENT_STATUSES = ['Booked', 'Picked Up', 'Export Cleared', 'In Transit', 'Import Cleared', 'Out for Delivery', 'Delivered'];
const INVOICE_STATUSES = ['paid', 'pending', 'overdue', 'draft'];

const FIRST_NAMES = ['Alex', 'Sarah', 'Michael', 'Priya', 'David', 'Emma', 'James', 'Yuki', 'Liu', 'Anna', 'Carlos', 'Fatima', 'Hans', 'Ravi', 'Sophia'];
const LAST_NAMES = ['Chen', 'Patel', 'Mueller', 'Yamamoto', 'Anderson', 'Garcia', 'Khan', 'Tanaka', 'Smith', 'Kumar', 'Schmidt', 'Lee', 'Rossi', 'Brown'];
const COMPANIES = ['Acme Industries', 'Globex Trading', 'Pacific Imports', 'Northwind Co', 'Stark Logistics', 'Wayne Enterprises', 'Initech', 'Soylent Corp', 'Umbrella Inc', 'Cyberdyne Systems', 'Aperture Sci', 'Massive Dynamic'];

// Seeded random for deterministic data
let seed = 42;
function rng() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function rngInt(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }

function formatDate(date) { return date.toISOString().split('T')[0]; }
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }

// ---- GENERATION ----
export const providers = PROVIDERS.map((p, i) => ({
  ...p,
  contactEmail: `ops@${p.code.toLowerCase()}.com`,
  contactPhone: `+1 555-${String(100 + i).padStart(4, '0')}`,
  routes: rngInt(20, 80),
  bookings: rngInt(50, 200),
  revenue: rngInt(500_000, 3_000_000),
  status: rngInt(0, 10) > 1 ? 'active' : 'pending',
  joinDate: '2023-01-15',
}));

export const ports = PORTS;
export const airports = AIRPORTS;

function genQuote(i) {
  const provider = pick(PROVIDERS);
  const origin = pick(PORTS);
  let destination = pick(PORTS);
  while (destination.code === origin.code) destination = pick(PORTS);
  const mode = pick(MODES);
  const transitDays = mode === 'air' ? rngInt(3, 9) : mode === 'ocean' ? rngInt(14, 45) : rngInt(2, 12);
  const basePrice = mode === 'air' ? rngInt(2800, 9000) : mode === 'ocean' ? rngInt(1200, 5500) : rngInt(800, 3200);
  return {
    id: `Q-${String(20000 + i).padStart(6, '0')}`,
    providerId: provider.id,
    providerName: provider.name,
    providerCode: provider.code,
    providerReliability: provider.reliability,
    origin: `${origin.city}, ${origin.country}`,
    originCode: origin.code,
    destination: `${destination.city}, ${destination.country}`,
    destinationCode: destination.code,
    mode,
    containerType: pick(CONTAINER_TYPES),
    weight: rngInt(500, 28000),
    volume: rngInt(2, 68),
    transitDays,
    price: basePrice,
    currency: 'USD',
    incoterm: pick(INCOTERMS),
    validUntil: formatDate(addDays(new Date(), rngInt(7, 30))),
    serviceType: rngInt(0, 1) ? 'Express' : 'Standard',
    features: ['Door-to-door', 'Insurance included', 'Customs clearance', 'Real-time tracking'].slice(0, rngInt(2, 4)),
    co2Kg: rngInt(200, 4500),
    createdAt: formatDate(addDays(new Date(), -rngInt(0, 30))),
  };
}
export const quotes = Array.from({ length: 100 }, (_, i) => genQuote(i));

function genShipment(i) {
  const provider = pick(PROVIDERS);
  const origin = pick(PORTS);
  let destination = pick(PORTS);
  while (destination.code === origin.code) destination = pick(PORTS);
  const mode = pick(MODES);
  const statusIdx = rngInt(0, SHIPMENT_STATUSES.length - 1);
  const createdAt = addDays(new Date(), -rngInt(0, 60));
  const eta = addDays(createdAt, mode === 'air' ? rngInt(3, 9) : mode === 'ocean' ? rngInt(14, 45) : rngInt(2, 12));
  return {
    id: `KWE-SHP-${String(50000 + i).padStart(6, '0')}`,
    bookingId: `KWE-BK-${String(40000 + i).padStart(6, '0')}`,
    providerId: provider.id,
    providerName: provider.name,
    providerCode: provider.code,
    status: SHIPMENT_STATUSES[statusIdx],
    statusIndex: statusIdx,
    mode,
    origin: `${origin.city}, ${origin.country}`,
    originCode: origin.code,
    destination: `${destination.city}, ${destination.country}`,
    destinationCode: destination.code,
    containerType: pick(CONTAINER_TYPES),
    weight: rngInt(500, 28000),
    volume: rngInt(2, 68),
    createdAt: formatDate(createdAt),
    eta: formatDate(eta),
    price: rngInt(1500, 8500),
    currency: 'USD',
    shipperName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    consigneeName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    shipperCompany: pick(COMPANIES),
    consigneeCompany: pick(COMPANIES),
    timeline: SHIPMENT_STATUSES.map((s, idx) => ({
      status: s,
      completed: idx <= statusIdx,
      active: idx === statusIdx,
      date: idx <= statusIdx ? formatDate(addDays(createdAt, idx * 2)) : null,
      location: idx <= statusIdx ? (idx < 3 ? origin.city : idx > 4 ? destination.city : 'In Transit') : null,
    })),
  };
}
export const shipments = Array.from({ length: 100 }, (_, i) => genShipment(i));

function genBooking(i) {
  const s = shipments[i % shipments.length];
  return {
    id: `KWE-BK-${String(40000 + i).padStart(6, '0')}`,
    shipmentId: s.id,
    providerName: s.providerName,
    providerCode: s.providerCode,
    mode: s.mode,
    origin: s.origin,
    destination: s.destination,
    status: rngInt(0, 5) > 1 ? 'confirmed' : rngInt(0, 1) ? 'pending' : 'cancelled',
    bookedOn: s.createdAt,
    eta: s.eta,
    amount: s.price,
    currency: 'USD',
  };
}
export const bookings = Array.from({ length: 50 }, (_, i) => genBooking(i));

function genInvoice(i) {
  const b = bookings[i % bookings.length];
  const issueDate = addDays(new Date(), -rngInt(0, 90));
  return {
    id: `INV-${String(70000 + i).padStart(6, '0')}`,
    bookingId: b.id,
    customer: pick(COMPANIES),
    amount: b.amount + rngInt(50, 500),
    currency: 'USD',
    status: pick(INVOICE_STATUSES),
    issueDate: formatDate(issueDate),
    dueDate: formatDate(addDays(issueDate, 30)),
  };
}
export const invoices = Array.from({ length: 50 }, (_, i) => genInvoice(i));

function genNotification(i) {
  const types = ['booking', 'shipment', 'invoice', 'system'];
  const type = pick(types);
  const messages = {
    booking: ['New booking confirmed', 'Booking #KWE-BK-40' + rngInt(100, 999) + ' updated', 'Booking pending approval'],
    shipment: ['Shipment departed port of origin', 'Shipment cleared customs', 'Shipment delivered successfully', 'ETA update on shipment'],
    invoice: ['Invoice payment received', 'Invoice overdue reminder', 'New invoice issued'],
    system: ['System maintenance scheduled', 'New feature: Carbon tracking', 'Provider added to network'],
  };
  return {
    id: `N-${i}`,
    type,
    title: pick(messages[type]),
    description: 'Tap to view details and take action on this update.',
    timestamp: formatDate(addDays(new Date(), -rngInt(0, 14))),
    read: rngInt(0, 1) === 0,
    severity: pick(['info', 'success', 'warning']),
  };
}
export const notifications = Array.from({ length: 50 }, (_, i) => genNotification(i));

function genUser(i) {
  const fn = pick(FIRST_NAMES);
  const ln = pick(LAST_NAMES);
  const role = i < 5 ? 'admin' : i < 12 ? 'provider' : 'customer';
  return {
    id: `U-${1000 + i}`,
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${pick(['kwe.com', 'acme.co', 'globex.com', 'pacific.io'])}`,
    role,
    company: pick(COMPANIES),
    status: rngInt(0, 10) > 1 ? 'active' : 'suspended',
    lastLogin: formatDate(addDays(new Date(), -rngInt(0, 30))),
    createdAt: '2023-06-12',
  };
}
export const users = Array.from({ length: 20 }, (_, i) => genUser(i));

// Charts data
export const revenueTrend = [
  { month: 'Jul', revenue: 184000, bookings: 32 },
  { month: 'Aug', revenue: 211000, bookings: 38 },
  { month: 'Sep', revenue: 248000, bookings: 45 },
  { month: 'Oct', revenue: 232000, bookings: 41 },
  { month: 'Nov', revenue: 287000, bookings: 52 },
  { month: 'Dec', revenue: 324000, bookings: 58 },
  { month: 'Jan', revenue: 356000, bookings: 64 },
];

export const quoteTrend = [
  { week: 'W1', quotes: 42, accepted: 18 },
  { week: 'W2', quotes: 58, accepted: 24 },
  { week: 'W3', quotes: 51, accepted: 22 },
  { week: 'W4', quotes: 67, accepted: 31 },
  { week: 'W5', quotes: 74, accepted: 35 },
  { week: 'W6', quotes: 82, accepted: 41 },
];

export const modeDistribution = [
  { name: 'Ocean', value: 58, color: '#0F172A' },
  { name: 'Air', value: 27, color: '#D4AF37' },
  { name: 'Road', value: 15, color: '#10B981' },
];

export const auditLogs = Array.from({ length: 40 }, (_, i) => ({
  id: `LOG-${i}`,
  user: pick(users.slice(0, 5)).name,
  action: pick(['User created', 'Provider approved', 'Rate updated', 'Booking cancelled', 'Permission changed', 'Settings modified', 'User suspended']),
  resource: pick(['users', 'providers', 'rates', 'bookings', 'permissions', 'settings']),
  timestamp: formatDate(addDays(new Date(), -rngInt(0, 30))),
  ip: `192.168.${rngInt(0, 255)}.${rngInt(0, 255)}`,
}));

export const rates = Array.from({ length: 40 }, (_, i) => {
  const origin = pick(PORTS);
  let destination = pick(PORTS);
  while (destination.code === origin.code) destination = pick(PORTS);
  return {
    id: `R-${i}`,
    origin: `${origin.city} (${origin.code})`,
    destination: `${destination.city} (${destination.code})`,
    mode: pick(MODES),
    containerType: pick(CONTAINER_TYPES),
    rate: rngInt(900, 6800),
    currency: 'USD',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: rngInt(0, 5) > 0 ? 'active' : 'expired',
  };
});

export const routes = Array.from({ length: 24 }, (_, i) => {
  const origin = pick(PORTS);
  let destination = pick(PORTS);
  while (destination.code === origin.code) destination = pick(PORTS);
  return {
    id: `RT-${i}`,
    name: `${origin.code} → ${destination.code}`,
    origin: `${origin.city}, ${origin.country}`,
    destination: `${destination.city}, ${destination.country}`,
    mode: pick(MODES),
    frequency: pick(['Daily', 'Weekly', '2x/week', '3x/week']),
    transitDays: rngInt(2, 35),
    status: 'active',
  };
});
