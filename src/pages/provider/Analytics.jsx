import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { revenueTrend, quoteTrend, modeDistribution } from '@/lib/mock-data';
import { DollarSign, BarChart3, Star, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

export default function Analytics() {
  return (
    <div className="space-y-8" data-testid="provider-analytics-page">
      <PageHeader breadcrumb="Provider · Analytics" title="Performance Analytics" subtitle="Insights into your network performance, bid win-rate and customer satisfaction." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Win rate" value="42%" change="+5pt" icon={TrendingUp} accent />
        <StatCard label="Avg margin" value="18.4%" change="+1.2pt" icon={DollarSign} />
        <StatCard label="NPS" value="62" change="+8" icon={Star} />
        <StatCard label="Quote volume" value="184" change="+9%" icon={BarChart3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
          <h3 className="font-bold text-[#0F172A]">Quote Vs Accepted</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Weekly trend</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={quoteTrend} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="quotes" fill="#0F172A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="accepted" fill="#D4AF37" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
          <h3 className="font-bold text-[#0F172A]">Mode Mix</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Of your bookings</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={modeDistribution} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4} cornerRadius={6}>
                {modeDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
        <h3 className="font-bold text-[#0F172A]">Revenue Contribution</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">Across last 7 months</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueTrend} margin={{ left: -10, right: 10 }}>
            <defs>
              <linearGradient id="revC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
            <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#revC)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
