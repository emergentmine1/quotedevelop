import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Layers, Plane, Ship, Container, Receipt, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { matrixHistory } from '@/lib/pricing-data';
import { downloadCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ICONS = { air: Plane, lcl: Ship, fcl: Container, surcharge: Receipt };
const TYPE_COLORS = {
  air: 'bg-sky-50 text-sky-700',
  lcl: 'bg-indigo-50 text-indigo-700',
  fcl: 'bg-teal-50 text-teal-700',
  surcharge: 'bg-amber-50 text-amber-700',
};
const ACTION_COLORS = {
  created: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  updated: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cloned: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  deactivated: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  activated: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'rate-adjusted': 'bg-purple-50 text-purple-700 ring-purple-600/20',
};

export default function MatrixHistory() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [action, setAction] = useState('all');

  const list = useMemo(() => matrixHistory.filter((h) => {
    const matchesQ = !q || [h.matrixId, h.matrixName, h.user, h.summary].some((v) => String(v).toLowerCase().includes(q.toLowerCase()));
    return matchesQ
      && (type === 'all' || h.matrixType === type)
      && (action === 'all' || h.action === action);
  }), [q, type, action]);

  return (
    <div className="space-y-5" data-testid="matrix-history-page">
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A]">Matrix History</h3>
              <p className="text-xs text-slate-500">Audit trail of every change made to the pricing engine</p>
            </div>
          </div>
          <Button variant="outline" data-testid="hist-export" onClick={() => { downloadCsv('kwe-matrix-history.csv', list); toast.success(`${list.length} events exported`); }} className="rounded-xl h-10 gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input data-testid="hist-search" placeholder="Search matrix, user, summary…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-10 rounded-xl border-slate-200" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="hist-type"><SelectValue placeholder="Matrix type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="air">Air</SelectItem>
              <SelectItem value="lcl">Ocean LCL</SelectItem>
              <SelectItem value="fcl">Ocean FCL</SelectItem>
              <SelectItem value="surcharge">Surcharge</SelectItem>
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="hist-action"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {Object.keys(ACTION_COLORS).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="divide-y divide-slate-100">
          {list.map((h) => {
            const Icon = ICONS[h.matrixType] || Layers;
            return (
              <div key={h.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors" data-testid={`hist-row-${h.id}`}>
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', TYPE_COLORS[h.matrixType])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/admin/pricing/matrix/${h.matrixId}`} className="font-bold text-[#0F172A] hover:text-[#D4AF37] font-mono text-xs">{h.matrixId}</Link>
                    <span className="text-sm font-semibold text-slate-700 truncate">{h.matrixName}</span>
                    <span className="font-mono text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">v{h.version}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{h.summary}</div>
                </div>
                <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest ring-1 ring-inset', ACTION_COLORS[h.action] || 'bg-slate-100 text-slate-700')}>
                  {h.action}
                </span>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-700">{h.user}</div>
                  <div className="text-[10px] font-mono text-slate-400">{h.ip}</div>
                </div>
                <div className="text-xs text-slate-500 font-mono w-24 text-right">{h.timestamp}</div>
              </div>
            );
          })}
        </div>
        {list.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No events match your filters.</div>}
      </div>
    </div>
  );
}
