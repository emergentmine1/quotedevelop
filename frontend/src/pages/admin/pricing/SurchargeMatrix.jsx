import { useMemo, useState } from 'react';
import { Search, Plus, Download, Receipt, Edit2, Trash2, Percent, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusPill from '@/components/StatusPill';
import { surchargeMatrices, SURCHARGE_TYPES } from '@/lib/pricing-data';
import { downloadCsv } from '@/lib/csv';
import { toast } from 'sonner';

export default function SurchargeMatrix() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [appliesTo, setAppliesTo] = useState('all');

  const list = useMemo(() => surchargeMatrices.filter((s) => {
    const matchesQ = !q || [s.id, s.name, s.surchargeName].some((v) => String(v).toLowerCase().includes(q.toLowerCase()));
    return matchesQ
      && (type === 'all' || s.surchargeType === type)
      && (appliesTo === 'all' || s.appliesTo === appliesTo);
  }), [q, type, appliesTo]);

  return (
    <div className="space-y-5" data-testid="surcharge-matrix-list">
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A]">Surcharge Matrix</h3>
              <p className="text-xs text-slate-500">Applied automatically by the pricing engine on top of base freight cost</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" data-testid="sur-export" onClick={() => { downloadCsv('kwe-surcharges.csv', list); toast.success(`${list.length} surcharges exported`); }} className="rounded-xl h-10 gap-1.5">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => toast.info('Opening new surcharge form')} className="rounded-xl h-10 bg-[#0F172A] hover:bg-[#1e293b] text-white gap-1.5" data-testid="sur-new">
              <Plus className="h-4 w-4" /> New surcharge
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input data-testid="sur-search" placeholder="Search surcharge name…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-10 rounded-xl border-slate-200" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="sur-type"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {SURCHARGE_TYPES.map((s) => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={appliesTo} onValueChange={setAppliesTo}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="sur-applies"><SelectValue placeholder="Applies to" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="air">Air</SelectItem>
              <SelectItem value="ocean">Ocean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((s) => (
          <div key={s.id} data-testid={`sur-card-${s.id}`} className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5 hover:-translate-y-0.5 transition-transform">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                {s.calculationType === 'percentage' ? <Percent className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
              </div>
              <StatusPill status={s.status} />
            </div>
            <div className="mt-3 font-mono text-xs text-slate-500">{s.id}</div>
            <h3 className="mt-1 font-bold text-[#0F172A]">{s.surchargeName}</h3>
            <div className="mt-2 text-xs text-slate-600">
              <span className="capitalize">{s.appliesTo === 'all' ? 'All modes' : `${s.appliesTo} freight`}</span> · {s.appliedToCarriers === 'all' ? 'All carriers' : `Carrier: ${s.appliedToCarriers}`}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <div className="text-3xl font-black tracking-tight text-[#0F172A]">
                {s.calculationType === 'percentage' ? `${s.value}%` : `$${s.value}`}
              </div>
              <div className="text-xs text-slate-500 font-semibold">{s.calculationType === 'percentage' ? 'of base' : `${s.currency} flat`}</div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>{s.effectiveDate} → {s.expiryDate}</span>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast.info(`Edit ${s.id}`)} data-testid={`sur-edit-${s.id}`}><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => toast.error(`${s.id} deleted`)} data-testid={`sur-delete-${s.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <div className="bg-white rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">No surcharges match.</div>}
    </div>
  );
}
