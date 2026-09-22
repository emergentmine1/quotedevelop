import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Download, Upload, Eye, Copy, PowerOff, Trash2, Plane, Filter, FileSpreadsheet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StatusPill from '@/components/StatusPill';
import ExcelImportDialog from '@/components/ExcelImportDialog';
import { airMatrices, AIRLINES, AIR_DESTINATIONS, SERVICE_TYPES } from '@/lib/pricing-data';
import { downloadCsv } from '@/lib/csv';
import { downloadXlsx } from '@/lib/xlsx';
import { toast } from 'sonner';
import { airports } from '@/lib/mock-data';

const COLS = ['id', 'name', 'airlineFlightCode', 'destination', 'serviceType', 'currency', 'effectiveDate', 'expiryDate', 'status', 'version'];

export default function AirMatrix() {
  const [q, setQ] = useState('');
  const [airline, setAirline] = useState('all');
  const [dest, setDest] = useState('all');
  const [status, setStatus] = useState('all');
  const [service, setService] = useState('all');
  const [importOpen, setImportOpen] = useState(false);

  const list = useMemo(() => airMatrices.filter((m) => {
    const matchesQ = !q || [m.id, m.name, m.airlineName, m.airlineFlightCode, m.destination].some((v) => String(v).toLowerCase().includes(q.toLowerCase()));
    return matchesQ
      && (airline === 'all' || m.airlineCode === airline)
      && (dest === 'all' || m.destination === dest)
      && (status === 'all' || m.status === status)
      && (service === 'all' || m.serviceType === service);
  }), [q, airline, dest, status, service]);

  const reset = () => { setQ(''); setAirline('all'); setDest('all'); setStatus('all'); setService('all'); };

  const getOriginLabel = (originCode) => {
    const airport = airports.find((a) => a.code === originCode);
    return airport ? `${airport.code} - ${airport.city}` : (originCode || 'N/A');
  };

  return (
    <div className="space-y-5" data-testid="air-matrix-list">
      <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A]">Air Rate Matrix</h3>
              <p className="text-xs text-slate-500">{list.length} of {airMatrices.length} matrices · weight-break rates by destination & airline</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} className="rounded-xl h-10 gap-1.5" data-testid="air-import">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl h-10 gap-1.5" data-testid="air-export">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <DropdownMenuItem
                   data-testid="air-export-xlsx"
                   onClick={async () => { await downloadXlsx('kwe-air-matrix', list, { columns: COLS, sheetName: 'Air Matrix' }); toast.success(`${list.length} matrices exported to Excel`); }}
                 >
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="air-export-csv"
                  onClick={() => { downloadCsv('kwe-air-matrix.csv', list, COLS); toast.success(`${list.length} matrices exported to CSV`); }}
                >
                  <Download className="h-4 w-4 mr-2" /> Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="rounded-xl h-10 bg-[#0F172A] hover:bg-[#1e293b] text-white gap-1.5" data-testid="air-new">
              <Link to="/admin/pricing/matrix/new?type=air"><Plus className="h-4 w-4" /> New matrix</Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input data-testid="air-search" placeholder="Search ID, airline, destination…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-10 rounded-xl border-slate-200" />
          </div>
          <Select value={airline} onValueChange={setAirline}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="filter-airline"><SelectValue placeholder="Airline" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All airlines</SelectItem>
              {AIRLINES.map((a) => <SelectItem key={a.code} value={a.code}>{a.flightCode} · {a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dest} onValueChange={setDest}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="filter-destination"><SelectValue placeholder="Destination" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All destinations</SelectItem>
              {AIR_DESTINATIONS.map((d) => <SelectItem key={d.code} value={d.code}>{d.city} ({d.code})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="filter-service"><SelectValue placeholder="Service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200" data-testid="filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {['active', 'draft', 'expired'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {(q || airline !== 'all' || dest !== 'all' || status !== 'all' || service !== 'all') && (
          <button onClick={reset} data-testid="air-reset" className="mt-3 text-xs font-semibold text-slate-500 hover:text-[#D4AF37] inline-flex items-center gap-1">
            <Filter className="h-3 w-3" /> Reset filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <th className="text-left py-3 px-5">Matrix</th>
              <th className="text-left py-3 px-5">Airline</th>
              <th className="text-left py-3 px-5">Origin</th>
              <th className="text-left py-3 px-5">Charge code</th>
              <th className="text-left py-3 px-5">Service</th>
              <th className="text-left py-3 px-5">Currency</th>
              <th className="text-left py-3 px-5">Effective</th>
              <th className="text-left py-3 px-5">Expiry</th>
              <th className="text-left py-3 px-5">Status</th>
              <th className="text-right py-3 px-5">Version</th>
              <th className="py-3 px-5"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {list.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/60 transition-colors" data-testid={`air-row-${m.id}`}>
                <td className="py-3.5 px-5">
                  <Link to={`/admin/pricing/matrix/${m.id}`} className="font-bold text-[#0F172A] hover:text-[#D4AF37] font-mono text-xs">{m.id}</Link>
                  <div className="text-xs text-slate-500 mt-0.5">{m.name}</div>
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F172A] px-1.5 py-0.5 rounded bg-sky-50">{m.airlineFlightCode}</span>
                    <span className="text-slate-700 text-xs">{m.airlineName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-slate-700 text-xs">{getOriginLabel(m.origin)}</td>
                <td className="py-3.5 px-5 font-mono text-xs text-slate-700">{m.chargeCode || 'FRTAB'}</td>
                <td className="py-3.5 px-5 text-slate-700">{m.serviceType}</td>
                <td className="py-3.5 px-5 font-mono text-xs text-slate-600">{m.currency}</td>
                <td className="py-3.5 px-5 text-slate-600">{m.effectiveDate}</td>
                <td className="py-3.5 px-5 text-slate-600">{m.expiryDate}</td>
                <td className="py-3.5 px-5"><StatusPill status={m.status} /></td>
                <td className="py-3.5 px-5 text-right font-mono text-xs text-slate-700">v{m.version}</td>
                <td className="py-3.5 px-5">
                  <RowActions id={m.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No matrices match your filters.</div>}
      </div>

      <ExcelImportDialog open={importOpen} onOpenChange={setImportOpen} matrixType="air" onConfirm={(rows) => toast.success(`Queued ${rows.length} air rows for review`)} />
      </div>
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
