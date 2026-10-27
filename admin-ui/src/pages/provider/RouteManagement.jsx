import { Route as RouteIcon, Plus, Plane, Ship, Truck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/mock-data';

const MODE_ICONS = { air: Plane, ocean: Ship, road: Truck };

export default function RouteManagement() {
  return (
    <div className="space-y-6" data-testid="route-management-page">
      <PageHeader
        breadcrumb="Provider · Routes"
        title="Route Management"
        subtitle="Configure the lanes you serve, frequency and service standards."
        action={
          <Button className="rounded-xl bg-[#0F172A] hover:bg-[#1e293b] text-white gap-1.5" data-testid="new-route-button">
            <Plus className="h-4 w-4" /> Add Route
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {routes.map((r) => {
          const ModeIcon = MODE_ICONS[r.mode] || Ship;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5 hover:-translate-y-0.5 transition-transform" data-testid={`route-card-${r.id}`}>
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/15 text-[#a8862a] flex items-center justify-center">
                  <RouteIcon className="h-5 w-5" />
                </div>
                <StatusPill status={r.status} />
              </div>
              <div className="mt-3">
                <div className="font-mono text-xs text-slate-500 uppercase tracking-widest">{r.name}</div>
                <div className="font-bold text-[#0F172A] mt-1">{r.origin}</div>
                <div className="text-xs text-slate-500 mt-1">to</div>
                <div className="font-bold text-[#0F172A]">{r.destination}</div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 capitalize font-semibold">
                  <ModeIcon className="h-3 w-3" /> {r.mode}
                </span>
                <span className="text-slate-600 font-semibold">{r.frequency}</span>
                <span className="text-slate-600 font-semibold">{r.transitDays}d</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
