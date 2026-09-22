import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Package,
  FileText,
  Bell,
  Ship,
  BarChart3,
  Users,
  Shield,
  Settings,
  Truck,
  Route as RouteIcon,
  DollarSign,
  ClipboardList,
  FileSearch,
  Anchor,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import BrandLogo from '@/components/BrandLogo';

const CUSTOMER_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/quotes/search', label: 'Quote Search', icon: Search },
  { to: '/quotes/results', label: 'Quote Results', icon: FileSearch },
  { to: '/bookings/new', label: 'New Booking', icon: ClipboardList },
  { to: '/shipments', label: 'Shipments', icon: Package },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

const PROVIDER_NAV = [
  { to: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/provider/rates', label: 'Rate Management', icon: DollarSign },
  { to: '/provider/routes', label: 'Route Management', icon: RouteIcon },
  { to: '/provider/booking-requests', label: 'Booking Requests', icon: ClipboardList },
  { to: '/provider/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

const ADMIN_NAV = [
  { to: '/admin/pricing', label: 'Pricing Matrices', icon: DollarSign },
  { to: '/admin/leads', label: 'Quote Request', icon: Users },
];

function getNav(role) {
  if (role === 'provider') return PROVIDER_NAV;
  if (role === 'admin') return ADMIN_NAV;
  return CUSTOMER_NAV;
}

export default function Sidebar({ collapsed = false }) {
  const { user } = useAuth();
  const nav = getNav(user?.role);
  const logoClass = collapsed ? 'h-8 w-auto' : 'h-9 w-auto';

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'navy-bg text-slate-300 h-screen sticky top-0 flex flex-col border-r border-slate-800/50 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-6 border-b border-slate-800/60', collapsed && 'justify-center px-0')}>
              <div className="flex items-center gap-2">
                <BrandLogo className={logoClass} />
                {!collapsed && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Freight Network</div>
                  </div>
                )}
              </div>
            </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!collapsed && (
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">
            {user?.role === 'admin' ? 'Administration' : user?.role === 'provider' ? 'Provider Portal' : 'Operations'}
          </div>
        )}
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                collapsed && 'justify-center px-2'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] gold-bg rounded-r-full" />
                )}
                <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#D4AF37]' : 'text-slate-400')} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User card at bottom */}
      {!collapsed && user && (
        <div className="border-t border-slate-800/60 p-3 m-3 rounded-xl bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white">
              {user.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate capitalize">{user.role} · {user.company}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
