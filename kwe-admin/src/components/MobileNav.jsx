import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { navFor } from '@/lib/admin-nav';

export default function MobileNav() {
  const { user } = useAuth();
  const items = navFor(user?.role);

  return (
    <nav
      data-testid="mobile-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-slate-200 flex items-stretch justify-around"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          data-testid={`mobile-nav-${item.short.toLowerCase()}`}
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
              <span className="text-[10px] font-semibold tracking-wide">{item.short}</span>
              {isActive && <span className="h-0.5 w-6 gold-bg rounded-full" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
