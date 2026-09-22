import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Plane, Ship, Truck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shipments } from '@/lib/mock-data';

const MODE_ICONS = { air: Plane, ocean: Ship, road: Truck };

export default function Shipments() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [mode, setMode] = useState('all');

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      const q = query.toLowerCase();
      const matchesQ = !q || s.id.toLowerCase().includes(q) || s.providerName.toLowerCase().includes(q) || s.origin.toLowerCase().includes(q) || s.destination.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || s.status === status;
      const matchesMode = mode === 'all' || s.mode === mode;
      return matchesQ && matchesStatus && matchesMode;
    });
  }, [query, status, mode]);

  return (
    <div className="space-y-6" data-testid="shipments-page">
      <PageHeader breadcrumb="Operations" title="Shipments" subtitle={`Track ${shipments.length} shipments across all trade lanes.`} />

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        {/* Filters bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="shipments-search"
              placeholder="Search by ID, lane, provider…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200"
            />
          </div>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full sm:w-36 h-11 rounded-xl border-slate-200" data-testid="shipments-mode-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="ocean">Ocean</SelectItem>
              <SelectItem value="air">Air</SelectItem>
              <SelectItem value="road">Road</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl border-slate-200" data-testid="shipments-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {['Booked', 'Picked Up', 'Export Cleared', 'In Transit', 'Import Cleared', 'Out for Delivery', 'Delivered'].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="text-left py-3 px-6">Shipment</th>
                <th className="text-left py-3 px-6">Provider</th>
                <th className="text-left py-3 px-6">Lane</th>
                <th className="text-left py-3 px-6">Mode</th>
                <th className="text-left py-3 px-6">ETA</th>
                <th className="text-left py-3 px-6">Status</th>
                <th className="py-3 px-6"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filtered.map((s) => {
                const ModeIcon = MODE_ICONS[s.mode] || Ship;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <Link to={`/shipments/${s.id}`} className="font-bold text-[#0F172A] hover:text-[#D4AF37]">{s.id}</Link>
                      <div className="text-xs text-slate-500">Booked {s.createdAt}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">{s.providerCode}</div>
                        <span className="font-semibold text-slate-700">{s.providerName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-xs">{s.originCode} → {s.destinationCode}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold capitalize">
                        <ModeIcon className="h-3 w-3" /> {s.mode}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">{s.eta}</td>
                    <td className="py-4 px-6"><StatusPill status={s.status} /></td>
                    <td className="py-4 px-6">
                      <Link to={`/shipments/${s.id}`} data-testid={`view-${s.id}`} className="text-slate-500 hover:text-[#D4AF37]">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No shipments match your search.</div>}
        </div>
      </div>
    </div>
  );
}
