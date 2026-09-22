import { useMemo, useState } from 'react';
import { Grid3x3, Save, Sparkles, Plane, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Flag from '@/components/Flag';
import { airMatrices, AIR_DESTINATIONS } from '@/lib/pricing-data';
import { toast } from 'sonner';

/**
 * R5 · Air Rate Matrix — Destination Port × Weight Break editable grid.
 * Rows = destination ports · Columns = weight breaks (45 / 100 / 300 / 500 / 1000 kg).
 * Cells hold `ratePerKg` USD; inline-editable, dirty tracking, single save action.
 */

const WEIGHT_BREAKS = [45, 100, 300, 500, 1000];

const KWE_SERVICES = [
  { code: 'KWE-EXP', name: 'KWE Express' },
  { code: 'KWE-STD', name: 'KWE Standard' },
  { code: 'KWE-ECO', name: 'KWE Economy' },
];

// Build initial matrix from the seeded air matrices — take an average rate per (destination, break).
function buildInitialGrid(serviceCode) {
  const grid = {};
  for (const dest of AIR_DESTINATIONS) {
    grid[dest.code] = {};
    for (const wb of WEIGHT_BREAKS) {
      const cell = airMatrices.find((m) =>
        m.destination === dest.code &&
        (m.breaks?.some((b) => b.weight === wb))
      );
      const br = cell?.breaks?.find((b) => b.weight === wb);
      grid[dest.code][wb] = br
        ? parseFloat((br.freight + br.fuel).toFixed(2))
        : parseFloat((4.5 - (wb / 2000) + (serviceCode === 'KWE-EXP' ? 0.4 : serviceCode === 'KWE-ECO' ? -0.5 : 0)).toFixed(2));
    }
  }
  return grid;
}

export default function AirMatrixGrid() {
  const [service, setService] = useState('KWE-EXP');
  const [effective, setEffective] = useState(new Date().toISOString().split('T')[0]);
  const [grid, setGrid] = useState(() => buildInitialGrid('KWE-EXP'));
  const [dirty, setDirty] = useState(new Set());
  const [filter, setFilter] = useState('');

  const destinations = useMemo(() => {
    if (!filter) return AIR_DESTINATIONS;
    const q = filter.toLowerCase();
    return AIR_DESTINATIONS.filter((d) =>
      [d.code, d.city, d.country].some((v) => v?.toLowerCase().includes(q))
    );
  }, [filter]);

  const setCell = (dest, weight, value) => {
    const n = value === '' ? 0 : parseFloat(value);
    if (Number.isNaN(n)) return;
    setGrid((g) => ({ ...g, [dest]: { ...g[dest], [weight]: n } }));
    setDirty((d) => new Set(d).add(`${dest}:${weight}`));
  };

  const changeService = (v) => {
    if (dirty.size > 0) {
      if (!window.confirm('You have unsaved changes. Switch service and discard?')) return;
    }
    setService(v);
    setGrid(buildInitialGrid(v));
    setDirty(new Set());
  };

  const save = () => {
    // In production this hits PUT /api/v1/admin/matrix/air (bulk upsert).
    // For now we surface the dirty cells so the demo makes it visible.
    const cells = Array.from(dirty).map((k) => {
      const [dest, wb] = k.split(':');
      return { serviceCode: service, destinationPortCode: dest, weightBreakKg: Number(wb), ratePerKg: grid[dest][wb], effectiveFrom: effective };
    });
    console.info('[air-matrix] would PUT to /api/v1/admin/matrix/air', cells);
    toast.success(`Saved ${cells.length} rate cell${cells.length !== 1 ? 's' : ''} for ${service}`);
    setDirty(new Set());
  };

  return (
    <div className="space-y-5" data-testid="air-matrix-grid">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37]">
            <Grid3x3 className="h-3 w-3" /> Rate matrix · R5
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#0F172A] mt-1 inline-flex items-center gap-2">
            <Plane className="h-5 w-5 text-[#1E6AE1]" /> Air Rate Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">Destination Port × Weight Break · rates in USD per kg</p>
        </div>
        <Button
          onClick={save}
          disabled={dirty.size === 0}
          data-testid="matrix-grid-save"
          className="h-10 rounded-xl bg-[#1E6AE1] hover:bg-[#1758c2] text-white gap-1.5 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save {dirty.size > 0 && <span className="bg-white/20 rounded px-1.5 text-[10px]">{dirty.size}</span>}
        </Button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Service line</Label>
          <Select value={service} onValueChange={changeService}>
            <SelectTrigger data-testid="matrix-service" className="h-10 mt-1.5 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KWE_SERVICES.map((s) => (
                <SelectItem key={s.code} value={s.code} data-testid={`matrix-service-${s.code}`}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="matrix-effective" className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Effective from</Label>
          <Input
            id="matrix-effective"
            data-testid="matrix-effective"
            type="date"
            value={effective}
            onChange={(e) => setEffective(e.target.value)}
            className="h-10 mt-1.5 rounded-xl border-slate-200"
          />
        </div>
        <div>
          <Label htmlFor="matrix-filter" className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Filter destinations</Label>
          <Input
            id="matrix-filter"
            data-testid="matrix-filter"
            placeholder="City, code or country…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 mt-1.5 rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 kwe-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0B2545] text-white">
              <tr>
                <th className="sticky left-0 z-10 bg-[#0B2545] px-4 py-3 text-left text-[10px] uppercase tracking-widest font-bold">Destination Port</th>
                {WEIGHT_BREAKS.map((w) => (
                  <th key={w} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest font-bold text-[#5BB3FF]">
                    ≤ {w} kg
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {destinations.map((dest) => (
                <tr key={dest.code} className="hover:bg-slate-50/60">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Flag code={dest.countryCode} size={16} />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#0B2545] text-sm truncate">{dest.city}</div>
                        <div className="font-mono text-[10px] text-slate-500">{dest.code}</div>
                      </div>
                    </div>
                  </td>
                  {WEIGHT_BREAKS.map((w) => {
                    const key = `${dest.code}:${w}`;
                    const isDirty = dirty.has(key);
                    return (
                      <td key={w} className="px-2 py-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            data-testid={`cell-${dest.code}-${w}`}
                            value={grid[dest.code]?.[w] ?? 0}
                            onChange={(e) => setCell(dest.code, w, e.target.value)}
                            className={cn(
                              'w-24 h-9 pl-5 pr-2 rounded-lg border text-right font-mono text-sm transition-colors',
                              isDirty
                                ? 'border-[#D4AF37] bg-amber-50 ring-2 ring-[#D4AF37]/30'
                                : 'border-slate-200 hover:border-slate-300 focus:border-[#1E6AE1] focus:ring-2 focus:ring-[#1E6AE1]/20'
                            )}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {destinations.length === 0 && (
                <tr>
                  <td colSpan={WEIGHT_BREAKS.length + 1} className="px-4 py-10 text-center text-sm text-slate-400">
                    No destinations match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-500">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
        <span>
          Dirty cells are highlighted gold. Click <span className="font-semibold text-[#0B2545]">Save</span> to publish
        </span>
      </div>


    </div>
  );
}
