import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { Users, Truck, Activity, Shield } from 'lucide-react';
import { users, providers, auditLogs, shipments } from '@/lib/mock-data';
import { revenueTrend, modeDistribution } from '@/lib/mock-data';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const activeProviders = providers.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-8" data-testid="admin-dashboard-page">
      <PageHeader breadcrumb="Admin · Overview" title="Platform Overview" subtitle="System-wide health, network status, and operations across KWE." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Active users" value={activeUsers} change="+5" icon={Users} />
        <StatCard label="Active providers" value={activeProviders} change="+2" icon={Truck} />
        <StatCard label="Live shipments" value={shipments.filter((s) => s.status !== 'Delivered').length} change="+12%" icon={Activity} accent />
        <StatCard label="Audit events (30d)" value={auditLogs.length} icon={Shield} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
          <h3 className="font-bold text-[#0F172A]">Network Revenue</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Total across all providers</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="adGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} fill="url(#adGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6 flex flex-col">
          <h3 className="font-bold text-[#0F172A]">Mode Mix</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Across the platform</p>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modeDistribution} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4} cornerRadius={6}>
                  {modeDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {modeDistribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-bold text-[#0F172A]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="p-6 pb-3">
          <h3 className="font-bold text-[#0F172A]">Recent Audit Events</h3>
          <p className="text-xs text-slate-500 mt-0.5">Last 5 sensitive actions</p>
        </div>
        <div className="divide-y divide-slate-100">
          {auditLogs.slice(0, 5).map((l) => (
            <div key={l.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50/60">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center"><Shield className="h-4 w-4 text-slate-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#0F172A]">{l.action}</div>
                <div className="text-xs text-slate-500">{l.user} · {l.resource} · {l.ip}</div>
              </div>
              <div className="text-xs text-slate-400">{l.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
