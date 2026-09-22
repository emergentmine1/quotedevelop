import { Link } from 'react-router-dom';
import { Package, Route as RouteIcon, DollarSign, BarChart3, ArrowRight, Star } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusPill from '@/components/StatusPill';
import { revenueTrend, bookings, providers } from '@/lib/mock-data';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

export default function ProviderDashboard() {
  const me = providers[1]; // Kuehne+Nagel for the demo provider user
  const recentRequests = bookings.slice(0, 6);

  return (
    <div className="space-y-8" data-testid="provider-dashboard-page">
      <PageHeader
        breadcrumb="Provider · Overview"
        title={`Welcome back, ${me.name}.`}
        subtitle="Your carrier performance, rates and incoming requests."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard testId="provider-kpi-revenue" label="Revenue MTD" value={`$${(me.revenue / 1000).toFixed(0)}k`} change="+11%" icon={DollarSign} accent />
        <StatCard testId="provider-kpi-quotes" label="Quotes (30d)" value="184" change="+9%" icon={BarChart3} />
        <StatCard testId="provider-kpi-bookings" label="Active Bookings" value={me.bookings} change="+14%" icon={Package} />
        <StatCard testId="provider-kpi-routes" label="Active Routes" value={me.routes} icon={RouteIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#0F172A]">Revenue Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Across all trade lanes you serve</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F172A" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0F172A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="revenue" stroke="#0F172A" strokeWidth={2.5} fill="url(#prevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
          <h3 className="font-bold text-[#0F172A]">Service Score</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Updated weekly based on shipper feedback</p>
          <div className="flex items-center gap-3">
            <div className="text-5xl font-black tracking-tight text-[#0F172A]">{me.reliability}</div>
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(me.reliability) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-slate-200'}`} />
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-1">out of 5.0</div>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {[
              { label: 'On-time pickup', value: 96 },
              { label: 'On-time delivery', value: 92 },
              { label: 'Doc accuracy', value: 98 },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{m.label}</span>
                  <span className="font-bold text-[#0F172A]">{m.value}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="flex items-center justify-between p-6 pb-3">
          <div>
            <h3 className="font-bold text-[#0F172A]">Incoming Booking Requests</h3>
            <p className="text-xs text-slate-500 mt-0.5">Review and accept new shipper requests</p>
          </div>
          <Link to="/provider/booking-requests" className="text-xs font-semibold text-slate-600 hover:text-[#D4AF37] uppercase tracking-widest">All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="text-left py-2.5 px-6">Booking</th>
                <th className="text-left py-2.5 px-6">Lane</th>
                <th className="text-left py-2.5 px-6">Mode</th>
                <th className="text-right py-2.5 px-6">Amount</th>
                <th className="text-left py-2.5 px-6">Status</th>
                <th className="py-2.5 px-6"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {recentRequests.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-6 font-mono text-xs text-slate-700">{b.id}</td>
                  <td className="py-3 px-6 text-slate-600">{b.origin.split(',')[0]} → {b.destination.split(',')[0]}</td>
                  <td className="py-3 px-6 capitalize text-slate-600">{b.mode}</td>
                  <td className="py-3 px-6 text-right font-bold text-[#0F172A]">${b.amount.toLocaleString()}</td>
                  <td className="py-3 px-6"><StatusPill status={b.status} /></td>
                  <td className="py-3 px-6"><ArrowRight className="h-4 w-4 text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
