import { NavLink, Outlet } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/rate-profiles/constants';

export default function PricingLayout() {
  return (
    <div className="space-y-6" data-testid="pricing-layout">
      <PageHeader
        breadcrumb="Admin · Pricing Engine"
        title="Rate Management"
        subtitle="Rate Profiles for freight and origin charges. Single source of truth for freight cost calculation."
      />
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow px-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          {Object.values(CATEGORIES).map((c) => (
            <NavLink
              key={c.key}
              to={`/admin/pricing/${c.key}`}
              data-testid={`pricing-tab-${c.key}`}
              className={({ isActive }) => cn(
                'px-8 py-3.5 text-base font-bold border-b-2 transition-colors whitespace-nowrap',
                isActive ? 'border-[#D4AF37] text-[#0F172A]' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
