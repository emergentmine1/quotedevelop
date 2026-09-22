import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Package, FileText, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NAV_BY_ROLE = {
  customer: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/quotes/search', label: 'Quotes', icon: Search },
    { to: '/shipments', label: 'Ships', icon: Package },
    { to: '/invoices', label: 'Invoices', icon: FileText },
    { to: '/notifications', label: 'Alerts', icon: Bell },
  ],
  provider: [
    { to: '/provider/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/provider/rates', label: 'Rates', icon: FileText },
    { to: '/provider/booking-requests', label: 'Requests', icon: Package },
    { to: '/provider/analytics', label: 'Stats', icon: Search },
    { to: '/notifications', label: 'Alerts', icon: Bell },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: FileText },
    { to: '/admin/providers', label: 'Providers', icon: Package },
    { to: '/admin/audit-logs', label: 'Logs', icon: Search },
    { to: '/admin/settings', label: 'Settings', icon: Bell },
  ],
};

export default function MobileNav() {
  const { user } = useAuth();
  const items = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.customer;

  return (
    <nav
      data-testid="mobile-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-slate-200 flex items-stretch justify-around"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          data-testid={`mobile-nav-${item.label.toLowerCase()}`}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              isActive ? 'text-[#0F172A]' : 'text-slate-500'
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn('h-5 w-5', isActive && 'text-[#D4AF37]')} />
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
              {isActive && <span className="h-0.5 w-6 gold-bg rounded-full" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
