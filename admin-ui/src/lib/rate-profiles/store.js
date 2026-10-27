// Rate Profile storage. Live: Java /api/v1/rate-profiles. Until the backend is connected: browser storage.
import { isBackendAvailable, listRateProfiles, getRateProfile, saveRateProfile, setRateProfileStatus, deleteRateProfile } from '@/lib/api-client';
import { CATEGORIES, CARRIERS, ORIGIN_PORTS, DEST_PORTS, SERVICE_TYPES } from '@/lib/rate-profiles/constants';
import { findActiveOverlap, overlapMessage } from '@/lib/rate-profiles/validation';

const KEY = 'kwe_rate_profiles_v1';

export class ProfileConflictError extends Error {}

const iso = (d) => d.toISOString().slice(0, 10);
const shift = (days) => iso(new Date(Date.now() + days * 86400000));
const nowIso = () => new Date().toISOString().slice(0, 19);

function seed() {
  const out = [];
  let n = 1000;
  const make = (category, i, chargeCode, extra) => {
    const id = n++;
    const modified = new Date(Date.now() - i * 37 * 3600000).toISOString().slice(0, 19);
    out.push({
      id,
      profileCode: `${CATEGORIES[category].prefix}-${String(id).padStart(5, '0')}`,
      category,
      chargeCode,
      carrierCode: CARRIERS[i % CARRIERS.length].code,
      transportMode: 'AIR',
      serviceType: SERVICE_TYPES[i % SERVICE_TYPES.length],
      originPort: ORIGIN_PORTS[i % 6].code,
      calculationMethod: 'FLAT_WEIGHT',
      currencyCode: i % 5 === 4 ? 'EUR' : 'USD',
      effectiveDate: shift(-30 + i),
      expirationDate: shift(180 + i * 3),
      externalMarkup: 12,
      internalMarkup: 5,
      status: i % 4 === 3 ? 'DRAFT' : 'ACTIVE',
      remarks: '',
      version: 1 + (i % 4),
      createdBy: 'writer@kwe.com',
      createdAt: modified,
      updatedBy: 'writer@kwe.com',
      updatedAt: modified,
      weightBreaks: ['>=45', '>=100', '>=300'],
      rows: DEST_PORTS.slice(i % 8, (i % 8) + 3).map((d, k) => ({
        destPort: d.code,
        flatAmount: 0,
        minAmount: 20 + k * 5,
        maxAmount: undefined,
        rates: [3.1 - k * 0.2, 2.4 - k * 0.15, 1.85 - k * 0.1].map((r) => Number(r.toFixed(2))),
      })),
      ...extra,
    });
  };
  const fc = CATEGORIES.freight.chargeCodes.map((c) => c.code);
  for (let i = 0; i < 18; i++) make('freight', i, fc[i % fc.length]);
  const oc = CATEGORIES.origin.chargeCodes.map((c) => c.code);
  for (let i = 0; i < 12; i++) {
    make('origin', i, oc[i % oc.length], {
      calculationMethod: i % 2 ? 'FLAT' : 'FLAT_WEIGHT',
      weightBreaks: i % 2 ? [] : ['>=45', '>=100'],
    });
    const p = out[out.length - 1];
    p.rows = p.rows.map((r) => ({ ...r, flatAmount: 35 + i * 5, rates: i % 2 ? [] : [0.15, 0.12] }));
  }
  return out;
}

function readAll() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(v)) return v;
  } catch {
    // corrupt storage — reseed
  }
  const s = seed();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}
const writeAll = (list) => localStorage.setItem(KEY, JSON.stringify(list));
const byModifiedDesc = (a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt));

export async function listProfiles(category) {
  if (await isBackendAvailable()) return (await listRateProfiles(category)).items.sort(byModifiedDesc);
  return readAll().filter((p) => p.category === category).sort(byModifiedDesc);
}

export async function getProfile(id) {
  if (await isBackendAvailable()) return getRateProfile(id);
  return readAll().find((p) => String(p.id) === String(id)) || null;
}

/** Creates (no id) or updates. Throws ProfileConflictError on the overlapping-Active rule. */
export async function saveProfile(profile, userEmail) {
  if (await isBackendAvailable()) {
    try {
      return await saveRateProfile(profile);
    } catch (e) {
      if (e.status === 409) throw new ProfileConflictError(e.message);
      throw e;
    }
  }
  const all = readAll();
  const clash = findActiveOverlap(profile, all);
  if (clash) throw new ProfileConflictError(overlapMessage(clash));
  const now = nowIso();
  if (profile.id) {
    const current = all.find((p) => p.id === profile.id);
    if (!current) throw new Error('Profile no longer exists');
    if (current.version !== profile.version) throw new ProfileConflictError('Someone else saved this profile first. Reload and try again.');
    const next = { ...current, ...profile, version: current.version + 1, updatedBy: userEmail, updatedAt: now };
    writeAll(all.map((p) => (p.id === profile.id ? next : p)));
    return next;
  }
  const id = Math.max(999, ...all.map((p) => p.id)) + 1;
  const created = {
    ...profile,
    id,
    profileCode: `${CATEGORIES[profile.category].prefix}-${String(id).padStart(5, '0')}`,
    version: 1,
    createdBy: userEmail,
    createdAt: now,
    updatedBy: userEmail,
    updatedAt: now,
  };
  writeAll([...all, created]);
  return created;
}

export async function deleteProfile(id) {
  if (await isBackendAvailable()) return deleteRateProfile(id);
  writeAll(readAll().filter((p) => p.id !== id));
  return null;
}

export async function changeStatus(profile, status, userEmail) {
  if (await isBackendAvailable()) {
    try {
      return await setRateProfileStatus(profile.id, status, profile.version);
    } catch (e) {
      if (e.status === 409) throw new ProfileConflictError(e.message);
      throw e;
    }
  }
  return saveProfile({ ...profile, status }, userEmail);
}
