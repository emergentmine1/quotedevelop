import { useMemo, useState } from 'react';
import { Search, Shield } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { auditLogs } from '@/lib/mock-data';

export default function AuditLogs() {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    if (!q) return auditLogs;
    return auditLogs.filter((l) => [l.user, l.action, l.resource, l.ip].some((v) => v.toLowerCase().includes(q.toLowerCase())));
  }, [q]);

  return (
    <div className="space-y-6" data-testid="audit-logs-page">
      <PageHeader breadcrumb="Admin · Security" title="Audit Logs" subtitle="A tamper-evident record of all sensitive actions on the platform." />

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="p-5 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input data-testid="audit-search" placeholder="Search user, action, resource…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-11 rounded-xl border-slate-200" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="text-left py-3 px-6">Timestamp</th>
                <th className="text-left py-3 px-6">User</th>
                <th className="text-left py-3 px-6">Action</th>
                <th className="text-left py-3 px-6">Resource</th>
                <th className="text-left py-3 px-6">IP address</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {list.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-6 text-slate-600 font-mono text-xs">{l.timestamp}</td>
                  <td className="py-3 px-6 font-semibold text-[#0F172A]">{l.user}</td>
                  <td className="py-3 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                      <Shield className="h-3 w-3 text-slate-500" />
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-slate-700 capitalize">{l.resource}</td>
                  <td className="py-3 px-6 font-mono text-xs text-slate-500">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
