import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import MobileNav from '@/components/MobileNav';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 navy-bg w-64 border-r border-slate-800/50">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8 max-w-[1600px] w-full mx-auto fade-in">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
