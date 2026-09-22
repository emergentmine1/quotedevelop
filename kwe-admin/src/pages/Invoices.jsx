import { useMemo, useState } from 'react';
import { Search, Download, Eye, DollarSign, Clock, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusPill from '@/components/StatusPill';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { invoices } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function Invoices() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      const matchesQ = !q || i.id.toLowerCase().includes(q.toLowerCase()) || i.customer.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = status === 'all' || i.status === status;
      return matchesQ && matchesStatus;
    });
  }, [q, status]);

  const stats = useMemo(() => ({
    total: invoices.reduce((a, i) => a + i.amount, 0),
    paid: invoices.filter((i) => i.status === 'paid').reduce((a, i) => a + i.amount, 0),
    pending: invoices.filter((i) => i.status === 'pending').reduce((a, i) => a + i.amount, 0),
    overdue: invoices.filter((i) => i.status === 'overdue').length,
  }), []);

  return (
    <div className="space-y-6" data-testid="invoices-page">
      <PageHeader breadcrumb="Finance" title="Invoices" subtitle={`${invoices.length} invoices across all bookings.`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total billed" value={`$${(stats.total / 1000).toFixed(0)}k`} icon={DollarSign} />
        <StatCard label="Paid" value={`$${(stats.paid / 1000).toFixed(0)}k`} change="+12%" icon={DollarSign} />
        <StatCard label="Pending" value={`$${(stats.pending / 1000).toFixed(0)}k`} icon={Clock} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertCircle} />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="invoices-search"
              placeholder="Search invoice ID, customer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40 h-11 rounded-xl border-slate-200" data-testid="invoices-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="text-left py-3 px-6">Invoice</th>
                <th className="text-left py-3 px-6">Booking</th>
                <th className="text-left py-3 px-6">Customer</th>
                <th className="text-right py-3 px-6">Amount</th>
                <th className="text-left py-3 px-6">Status</th>
                <th className="text-left py-3 px-6">Due</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-bold text-[#0F172A] font-mono text-xs">{i.id}</td>
                  <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">{i.bookingId}</td>
                  <td className="py-3.5 px-6 text-slate-700 font-semibold">{i.customer}</td>
                  <td className="py-3.5 px-6 text-right font-bold text-[#0F172A]">${i.amount.toLocaleString()}</td>
                  <td className="py-3.5 px-6"><StatusPill status={i.status} /></td>
                  <td className="py-3.5 px-6 text-slate-600">{i.dueDate}</td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-1">
                      <Button data-testid={`view-invoice-${i.id}`} variant="ghost" size="sm" onClick={() => toast.info(`Opening ${i.id}`)} className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button data-testid={`download-invoice-${i.id}`} variant="ghost" size="sm" onClick={() => toast.success(`Downloaded ${i.id}.pdf`)} className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="py-12 text-center text-sm text-slate-500">No invoices match.</div>}
        </div>
      </div>
    </div>
  );
}
