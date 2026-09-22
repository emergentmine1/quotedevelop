import { cn } from '@/lib/utils';

export default function PageHeader({ title, subtitle, action, breadcrumb, className }) {
  return (
    <div className={cn('mb-6 lg:mb-8', className)}>
      {breadcrumb && (
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          {breadcrumb}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0F172A]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm md:text-base text-slate-500 max-w-2xl">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
