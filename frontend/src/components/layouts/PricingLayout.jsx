import { NavLink, Outlet } from 'react-router-dom';
import { Plane, History, Calculator, LayoutDashboard } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/admin/pricing', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/pricing/air', label: 'Air Matrix', icon: Plane },
  { to: '/admin/pricing/calculator', label: 'Calculator', icon: Calculator },
  { to: '/admin/pricing/history', label: 'History', icon: History },
];

export default function PricingLayout() {
  return (
    <div className="space-y-6" data-testid="pricing-layout">
      <PageHeader
        breadcrumb="Admin · Pricing Engine"
        title="Pricing Matrix Management"
        subtitle="Single source of truth for freight cost calculation. Future AI optimization modules consume pricing from this engine."
      />

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow px-2 overflow-x-auto">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              data-testid={`pricing-tab-${t.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                  isActive ? 'border-[#D4AF37] text-[#0F172A]' : 'border-transparent text-slate-500 hover:text-slate-700'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className={cn('h-4 w-4', isActive && 'text-[#D4AF37]')} />
                  {t.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
