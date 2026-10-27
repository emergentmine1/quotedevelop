import { cn } from '@/lib/utils';

const VARIANTS = {
  // status pills
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'in transit': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'picked up': 'bg-slate-100 text-slate-700 ring-slate-600/20',
  'export cleared': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  'import cleared': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  'out for delivery': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  booked: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  draft: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  suspended: 'bg-red-50 text-red-700 ring-red-600/20',
  expired: 'bg-slate-100 text-slate-500 ring-slate-300',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

export default function StatusPill({ status, className }) {
  const key = (status || '').toLowerCase();
  const variant = VARIANTS[key] || 'bg-slate-100 text-slate-700 ring-slate-300';
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset capitalize', variant, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
