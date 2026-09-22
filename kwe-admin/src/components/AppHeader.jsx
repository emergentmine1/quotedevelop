import { Bell, Search, LogOut, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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

  const handleLogout = () => {
    signOut();
    navigate('/login');
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
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              data-testid="header-search-input"
              type="search"
              placeholder="Search shipments, quotes, invoices…"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 focus:outline-none text-sm placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="header-notifications-button"
            onClick={() => navigate('/notifications')}
            className="relative h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-700" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#D4AF37] ring-2 ring-white" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="header-user-menu"
                className="flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0F172A] to-[#1e293b] flex items-center justify-center text-xs font-bold text-white">
                  {user?.avatar}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 capitalize leading-tight">{user?.role}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.name}</span>
                  <span className="text-xs text-slate-500 font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="header-menu-profile" onClick={() => navigate('/dashboard')}>
                My Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="header-menu-settings">Account Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="header-menu-logout"
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
