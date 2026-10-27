import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, change, trend = 'up', icon: Icon, accent = false, suffix, testId }) {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';

  return (
    <div
      data-testid={testId}
      className={cn(
        'group relative overflow-hidden bg-white rounded-xl border border-slate-100 p-6 transition-all duration-200 hover:-translate-y-1 kwe-shadow hover:kwe-shadow-md',
        accent && 'border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20'
      )}
    >
      {accent && <div className="absolute top-0 right-0 h-24 w-24 bg-[#D4AF37]/10 blur-2xl rounded-full" />}
      <div className="relative flex items-start justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</span>
        {Icon && (
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', accent ? 'bg-[#D4AF37]/15 text-[#a8862a]' : 'bg-slate-100 text-slate-600')}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="relative flex items-baseline gap-1">
        <div className="text-3xl font-black tracking-tight text-[#0F172A]">{value}</div>
        {suffix && <div className="text-sm font-semibold text-slate-500">{suffix}</div>}
      </div>
      {change !== undefined && (
        <div className="relative mt-3 flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {change}
          </span>
          <span className="text-xs text-slate-500">vs last period</span>
        </div>
      )}
    </div>
  );
}
