import { LogOut, Menu, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/lib/admin-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AppHeader({ onMenuClick }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            data-testid="header-menu-button"
            onClick={onMenuClick}
            className="lg:hidden h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </button>
          <div className="text-sm font-bold text-[#0F172A] tracking-tight">KWE Instant Quote Admin</div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="header-user-menu"
              className="flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0F172A] to-[#1e293b] flex items-center justify-center text-xs font-bold text-white uppercase">
                {user?.email?.slice(0, 2)}
              </div>
              <div className="hidden md:block text-left">
                <div data-testid="header-user-email" className="text-sm font-semibold text-slate-900 leading-tight">{user?.email}</div>
                <div data-testid="header-user-role" className="text-[11px] text-slate-500 leading-tight">{ROLE_LABELS[user?.role]}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold truncate">{user?.email}</span>
                <span className="text-xs text-slate-500 font-normal">{ROLE_LABELS[user?.role]}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="header-menu-logout"
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
