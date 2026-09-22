import { Link } from 'react-router-dom';
import { Package, FileText, Ship, DollarSign, ArrowRight, Bell, MapPin } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusPill from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { quotes, shipments, bookings, notifications, revenueTrend, quoteTrend, modeDistribution } from '@/lib/mock-data';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const recentQuotes = quotes.slice(0, 5);
  const recentShipments = shipments.slice(0, 5);
  const recentNotifs = notifications.slice(0, 5);

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <PageHeader
        breadcrumb={`Overview · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
        title={`Hello, ${user?.name.split(' ')[0]}.`}
        subtitle="Here's a snapshot of your freight operations across all trade lanes."
        action={
          <Button asChild className="bg-[#D4AF37] hover:bg-[#c19f2d] hover:brightness-110 text-[#0F172A] font-semibold rounded-xl h-11 px-5">
            <Link to="/quotes/search" data-testid="dashboard-new-quote-btn">
              New quote search <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard testId="kpi-total-quotes" label="Total Quotes" value={quotes.length} change="+18%" icon={FileText} />
        <StatCard testId="kpi-active-bookings" label="Active Bookings" value={bookings.filter((b) => b.status === 'confirmed').length} change="+9%" icon={Package} />
        <StatCard testId="kpi-active-shipments" label="Active Shipments" value={shipments.filter((s) => s.status !== 'Delivered').length} change="+12%" icon={Ship} accent />
        <StatCard testId="kpi-revenue" label="Revenue (YTD)" value="$2.4M" change="+24%" icon={DollarSign} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Revenue Trend" subtitle="Last 7 months" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend} margin={{ left: -10, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px -10px rgba(15,23,42,.12)' }}
                formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mode Mix" subtitle="By volume">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={modeDistribution} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4} cornerRadius={6}>
                {modeDistribution.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
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
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Quote Volume" subtitle="Quotes generated vs accepted">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quoteTrend} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="quotes" fill="#0F172A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="accepted" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Booking Trend" subtitle="Bookings per month">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2.5} fill="url(#bookGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 kwe-shadow">
          <div className="flex items-center justify-between p-6 pb-3">
            <div>
              <h3 className="font-bold text-[#0F172A]">Recent Shipments</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest activity across your network</p>
            </div>
            <Link to="/shipments" className="text-xs font-semibold text-slate-600 hover:text-[#D4AF37] uppercase tracking-widest">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentShipments.map((s) => (
              <Link
                key={s.id}
                to={`/shipments/${s.id}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">{s.providerCode}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#0F172A] truncate">{s.id}</div>
                  <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {s.originCode} → {s.destinationCode}
                  </div>
                </div>
                <div className="hidden sm:block text-xs text-slate-500">ETA {s.eta}</div>
                <StatusPill status={s.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
          <div className="flex items-center justify-between p-6 pb-3">
            <h3 className="font-bold text-[#0F172A] flex items-center gap-2"><Bell className="h-4 w-4 text-[#D4AF37]" /> Notifications</h3>
            <Link to="/notifications" className="text-xs font-semibold text-slate-600 hover:text-[#D4AF37] uppercase tracking-widest">All →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentNotifs.map((n) => (
              <div key={n.id} className="px-6 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[#0F172A]">{n.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{n.description}</div>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full gold-bg shrink-0 mt-1.5" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{n.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="flex items-center justify-between p-6 pb-3">
          <div>
            <h3 className="font-bold text-[#0F172A]">Recent Quotes</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quotes received from your network</p>
          </div>
          <Link to="/quotes/results" className="text-xs font-semibold text-slate-600 hover:text-[#D4AF37] uppercase tracking-widest">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="text-left py-2.5 px-6">Quote ID</th>
                <th className="text-left py-2.5 px-6">Provider</th>
                <th className="text-left py-2.5 px-6">Lane</th>
                <th className="text-left py-2.5 px-6">Mode</th>
                <th className="text-right py-2.5 px-6">Transit</th>
                <th className="text-right py-2.5 px-6">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-6 font-mono text-xs text-slate-700">{q.id}</td>
                  <td className="py-3 px-6 font-semibold text-[#0F172A]">{q.providerName}</td>
                  <td className="py-3 px-6 text-slate-600">{q.originCode} → {q.destinationCode}</td>
                  <td className="py-3 px-6 capitalize text-slate-600">{q.mode}</td>
                  <td className="py-3 px-6 text-right text-slate-600">{q.transitDays}d</td>
                  <td className="py-3 px-6 text-right font-bold text-[#0F172A]">${q.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 p-6 kwe-shadow ${className}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-bold text-[#0F172A]">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
