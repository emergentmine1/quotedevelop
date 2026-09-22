import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Download, Upload, Eye, Copy, PowerOff, Trash2, Ship, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StatusPill from '@/components/StatusPill';
import Flag from '@/components/Flag';
import ExcelImportDialog from '@/components/ExcelImportDialog';
import { lclMatrices, OCEAN_PORTS, OCEAN_CARRIERS } from '@/lib/pricing-data';
import { downloadCsv } from '@/lib/csv';
import { downloadXlsx } from '@/lib/xlsx';
import { toast } from 'sonner';

export default function LclMatrix() {
  const [q, setQ] = useState('');
  const [origin, setOrigin] = useState('all');
  const [dest, setDest] = useState('all');
  const [carrier, setCarrier] = useState('all');
  const [status, setStatus] = useState('all');
  const [importOpen, setImportOpen] = useState(false);

  const list = useMemo(() => lclMatrices.filter((m) => {
    const matchesQ = !q || [m.id, m.name, m.carrierName, m.originPort, m.destinationPort].some((v) => String(v).toLowerCase().includes(q.toLowerCase()));
    return matchesQ
      && (origin === 'all' || m.originPort === origin)
      && (dest === 'all' || m.destinationPort === dest)
      && (carrier === 'all' || m.carrierCode === carrier)
      && (status === 'all' || m.status === status);
  }), [q, origin, dest, carrier, status]);

  return (
    <div className="space-y-5" data-testid="lcl-matrix-list">
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A]">Ocean LCL Matrix</h3>
              <p className="text-xs text-slate-500">{list.length} of {lclMatrices.length} matrices · CBM-break rates by origin → destination port</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} className="rounded-xl h-10 gap-1.5" data-testid="lcl-import">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl h-10 gap-1.5" data-testid="lcl-export">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <DropdownMenuItem data-testid="lcl-export-xlsx" onClick={async () => { await downloadXlsx('kwe-lcl-matrix', list, { sheetName: 'LCL Matrix' }); toast.success(`${list.length} matrices exported to Excel`); }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="lcl-export-csv" onClick={() => { downloadCsv('kwe-lcl-matrix.csv', list); toast.success(`${list.length} matrices exported to CSV`); }}>
                  <Download className="h-4 w-4 mr-2" /> Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="rounded-xl h-10 bg-[#0F172A] hover:bg-[#1e293b] text-white gap-1.5" data-testid="lcl-new">
              <Link to="/admin/pricing/matrix/new?type=lcl"><Plus className="h-4 w-4" /> New matrix</Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input data-testid="lcl-search" placeholder="Search ID, carrier, port…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-10 rounded-xl border-slate-200" />
          </div>
          <Select value={origin} onValueChange={setOrigin}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="lcl-origin"><SelectValue placeholder="Origin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All origins</SelectItem>
              {OCEAN_PORTS.map((p) => <SelectItem key={p.code} value={p.code}>{p.city} ({p.code})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dest} onValueChange={setDest}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="lcl-destination"><SelectValue placeholder="Destination" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All destinations</SelectItem>
              {OCEAN_PORTS.map((p) => <SelectItem key={p.code} value={p.code}>{p.city} ({p.code})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="lcl-carrier"><SelectValue placeholder="Carrier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All carriers</SelectItem>
              {OCEAN_CARRIERS.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="lcl-status"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {['active', 'draft', 'expired'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <th className="text-left py-3 px-5">Matrix</th>
              <th className="text-left py-3 px-5">Carrier</th>
              <th className="text-left py-3 px-5">Lane</th>
              <th className="text-left py-3 px-5">Currency</th>
              <th className="text-left py-3 px-5">Effective</th>
              <th className="text-left py-3 px-5">Expiry</th>
              <th className="text-left py-3 px-5">Status</th>
              <th className="py-3 px-5"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {list.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/60" data-testid={`lcl-row-${m.id}`}>
                <td className="py-3.5 px-5">
                  <Link to={`/admin/pricing/matrix/${m.id}`} className="font-bold text-[#0F172A] hover:text-[#D4AF37] font-mono text-xs">{m.id}</Link>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">v{m.version}</div>
                </td>
                <td className="py-3.5 px-5">
                  <div className="font-semibold text-[#0F172A] text-sm">{m.carrierName}</div>
                  <div className="text-xs text-slate-500 font-mono">{m.carrierCode}</div>
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-2">
                    <Flag code={m.originCountryCode} size={18} />
                    <span className="font-mono text-xs text-[#0F172A] font-bold">{m.originPort}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <Flag code={m.destinationCountryCode} size={18} />
                    <span className="font-mono text-xs text-[#0F172A] font-bold">{m.destinationPort}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{m.originCity} → {m.destinationCity}</div>
                </td>
                <td className="py-3.5 px-5 font-mono text-xs text-slate-600">{m.currency}</td>
                <td className="py-3.5 px-5 text-slate-600">{m.effectiveDate}</td>
                <td className="py-3.5 px-5 text-slate-600">{m.expiryDate}</td>
                <td className="py-3.5 px-5"><StatusPill status={m.status} /></td>
                <td className="py-3.5 px-5"><RowActions id={m.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No matrices match your filters.</div>}
      </div>

      <ExcelImportDialog open={importOpen} onOpenChange={setImportOpen} matrixType="lcl" onConfirm={(rows) => toast.success(`Queued ${rows.length} LCL rows for review`)} />
    </div>
  );
}

function RowActions({ id }) {
  return (
    <div className="flex items-center gap-0.5 justify-end">
      <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`view-${id}`}>
        <Link to={`/admin/pricing/matrix/${id}`}><Eye className="h-3.5 w-3.5" /></Link>
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`clone-${id}`} onClick={() => toast.success(`Cloned ${id}`)}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600" data-testid={`deactivate-${id}`} onClick={() => toast.info(`${id} deactivated`)}>
        <PowerOff className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" data-testid={`delete-${id}`} onClick={() => toast.error(`${id} deleted`)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
