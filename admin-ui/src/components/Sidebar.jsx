import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { navFor, ROLE_LABELS } from '@/lib/admin-nav';
import BrandLogo from '@/components/BrandLogo';

export default function Sidebar({ collapsed = false }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const nav = navFor(user?.role);
  const logoClass = collapsed ? 'h-8 w-auto' : 'h-9 w-auto';

  const logout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'navy-bg text-slate-300 h-screen sticky top-0 flex flex-col border-r border-slate-800/50 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className={cn('flex items-center h-16 px-6 border-b border-slate-800/60', collapsed && 'justify-center px-0')}>
        <div className="flex items-center gap-2">
          <BrandLogo className={logoClass} />
          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Instant Quote</div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!collapsed && (
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">Administration</div>
        )}
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                collapsed && 'justify-center px-2'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] gold-bg rounded-r-full" />}
                <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#D4AF37]' : 'text-slate-400')} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && user && (
        <div data-testid="sidebar-user-card" className="border-t border-slate-800/60 p-3 m-3 rounded-xl bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user.email.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div data-testid="sidebar-user-email" className="text-sm font-semibold text-white truncate">{user.email}</div>
              <div data-testid="sidebar-user-role" className="text-[11px] text-slate-400 truncate">{ROLE_LABELS[user.role]}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              data-testid="sidebar-logout-button"
              aria-label="Log out"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
