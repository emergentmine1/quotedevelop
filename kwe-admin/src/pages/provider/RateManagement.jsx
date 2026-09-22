import { useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { rates } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function RateManagement() {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    if (!q) return rates;
    return rates.filter((r) =>
      [r.origin, r.destination, r.mode, r.containerType].some((v) => v.toLowerCase().includes(q.toLowerCase()))
    );
  }, [q]);

  return (
    <div className="space-y-6" data-testid="rate-management-page">
      <PageHeader
        breadcrumb="Provider · Rates"
        title="Rate Management"
        subtitle="Maintain rates across all your lanes. Updates are reflected in shipper quotes in real time."
        action={
          <Button onClick={() => toast.info('Open new rate form')} data-testid="new-rate-button" className="rounded-xl bg-[#0F172A] hover:bg-[#1e293b] text-white gap-1.5">
            <Plus className="h-4 w-4" /> New Rate
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="p-5 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input data-testid="rates-search" placeholder="Search lane, mode, container…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-11 rounded-xl border-slate-200" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="text-left py-3 px-6">Origin</th>
                <th className="text-left py-3 px-6">Destination</th>
                <th className="text-left py-3 px-6">Mode</th>
                <th className="text-left py-3 px-6">Container</th>
                <th className="text-right py-3 px-6">Rate</th>
                <th className="text-left py-3 px-6">Valid</th>
                <th className="text-left py-3 px-6">Status</th>
                <th className="py-3 px-6"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-semibold text-[#0F172A]">{r.origin}</td>
                  <td className="py-3.5 px-6 font-semibold text-[#0F172A]">{r.destination}</td>
                  <td className="py-3.5 px-6 capitalize text-slate-700">{r.mode}</td>
                  <td className="py-3.5 px-6 text-slate-700">{r.containerType}</td>
                  <td className="py-3.5 px-6 text-right font-bold text-[#0F172A]">${r.rate.toLocaleString()}</td>
                  <td className="py-3.5 px-6 text-slate-600 text-xs">{r.validFrom} → {r.validTo}</td>
                  <td className="py-3.5 px-6"><StatusPill status={r.status} /></td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`edit-rate-${r.id}`}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700" data-testid={`delete-rate-${r.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
