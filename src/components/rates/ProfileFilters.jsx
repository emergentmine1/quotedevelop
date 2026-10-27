import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, CARRIERS, ORIGIN_PORTS, SERVICE_TYPES, STATUSES, nameOf } from '@/lib/rate-profiles/constants';

export const EMPTY_PROFILE_FILTERS = { q: '', chargeCode: 'all', carrierCode: 'all', originPort: 'all', serviceType: 'all', status: 'all' };

export function applyProfileFilters(list, f) {
  const q = f.q.trim().toLowerCase();
  return list.filter((p) => {
    for (const k of ['chargeCode', 'carrierCode', 'originPort', 'serviceType', 'status']) {
      if (f[k] !== 'all' && p[k] !== f[k]) return false;
    }
    if (!q) return true;
    return [p.profileCode, p.chargeCode, p.carrierCode, nameOf(CARRIERS, p.carrierCode), p.originPort,
      nameOf(ORIGIN_PORTS, p.originPort), p.serviceType, p.currencyCode, p.transportMode, p.remarks,
      ...(p.rows || []).map((r) => r.destPort)]
      .some((v) => String(v || '').toLowerCase().includes(q));
  });
}

export function ProfileFilters({ category, filters, onChange, profiles }) {
  const set = (k) => (v) => onChange({ ...filters, [k]: v });
  const used = (k) => [...new Set(profiles.map((p) => p[k]))].sort();
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <div className="relative xl:col-span-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input data-testid="profile-search" placeholder="Search ID, carrier, port…" value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })} className="pl-10 h-10 rounded-xl border-slate-200" />
      </div>
      <FilterSelect testId="filter-charge-code" value={filters.chargeCode} onChange={set('chargeCode')} all="All charge codes"
        options={CATEGORIES[category].chargeCodes.map((c) => [c.code, `${c.code} · ${c.name}`])} />
      <FilterSelect testId="filter-carrier" value={filters.carrierCode} onChange={set('carrierCode')} all="All carriers"
        options={used('carrierCode').map((c) => [c, `${c} · ${nameOf(CARRIERS, c)}`])} />
      <FilterSelect testId="filter-origin" value={filters.originPort} onChange={set('originPort')} all="All origins"
        options={used('originPort').map((c) => [c, `${c} · ${nameOf(ORIGIN_PORTS, c)}`])} />
      <FilterSelect testId="filter-service" value={filters.serviceType} onChange={set('serviceType')} all="All services"
        options={SERVICE_TYPES.map((s) => [s, s])} />
      <FilterSelect testId="filter-status" value={filters.status} onChange={set('status')} all="All status"
        options={STATUSES.map((s) => [s.code, s.name])} />
    </div>
  );
}

function FilterSelect({ value, onChange, all, options, testId }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testId} className="h-10 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="all">{all}</SelectItem>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
