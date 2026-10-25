import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Flag from '@/components/Flag';
import { QUOTE_STATUSES } from '@/lib/quotes-store';

export const EMPTY_FILTERS = { query: '', countryCode: 'all', statusKey: 'all', from: '', to: '' };

export function QuoteFilters({ filters, onChange, countries }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const dirty = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  return (
    <div data-testid="quotes-filters" className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            data-testid="quotes-search-input"
            placeholder="Search by reference, name, company, email or airport…"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            className="h-10 pl-9 rounded-xl border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5" /> Filters:
        </div>
        <Select value={filters.countryCode} onValueChange={(v) => set({ countryCode: v })}>
          <SelectTrigger data-testid="quotes-filter-country" className="h-10 w-52 rounded-xl border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code} data-testid={`quotes-country-option-${c.code}`}>
                <span className="inline-flex items-center gap-2">
                  <Flag code={c.code} size={14} /> {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.statusKey} onValueChange={(v) => set({ statusKey: v })}>
          <SelectTrigger data-testid="quotes-filter-status" className="h-10 w-40 rounded-xl border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {QUOTE_STATUSES.map((s) => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateField testId="quotes-filter-from" label="From" value={filters.from} max={filters.to || undefined} onChange={(v) => set({ from: v })} />
        <DateField testId="quotes-filter-to" label="To" value={filters.to} min={filters.from || undefined} onChange={(v) => set({ to: v })} />
        {dirty && (
          <Button
            variant="ghost"
            data-testid="quotes-filters-clear"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="h-10 rounded-xl text-slate-500 gap-1"
          >
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function DateField({ label, value, onChange, testId, min, max }) {
  return (
    <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-500">
      <span className="font-semibold uppercase tracking-widest text-[10px]">{label}</span>
      <input
        type="date"
        data-testid={testId}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-[#0F172A] outline-none"
      />
    </label>
  );
}
