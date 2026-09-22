import { Check, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { bookings } from '@/lib/mock-data';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BookingRequests() {
  const [list, setList] = useState(bookings.slice(0, 20));

  const action = (id, status) => {
    setList((arr) => arr.map((b) => (b.id === id ? { ...b, status } : b)));
    toast.success(`Booking ${id} ${status}`);
  };

  return (
    <div className="space-y-6" data-testid="booking-requests-page">
      <PageHeader breadcrumb="Provider · Requests" title="Booking Requests" subtitle="Review shipper requests and accept the ones that match your capacity." />

      <div className="space-y-3">
        {list.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="md:w-32">
              <div className="font-mono text-xs text-slate-500">{b.id}</div>
              <div className="font-bold text-[#0F172A]">${b.amount.toLocaleString()}</div>
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-slate-500 uppercase tracking-widest font-semibold">Origin</div>
                <div className="text-slate-800 font-semibold mt-0.5">{b.origin.split(',')[0]}</div>
              </div>
              <div>
                <div className="text-slate-500 uppercase tracking-widest font-semibold">Destination</div>
                <div className="text-slate-800 font-semibold mt-0.5">{b.destination.split(',')[0]}</div>
              </div>
              <div>
                <div className="text-slate-500 uppercase tracking-widest font-semibold">Mode</div>
                <div className="text-slate-800 font-semibold mt-0.5 capitalize">{b.mode}</div>
              </div>
              <div>
                <div className="text-slate-500 uppercase tracking-widest font-semibold">ETA</div>
                <div className="text-slate-800 font-semibold mt-0.5">{b.eta}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={b.status} />
              {b.status === 'pending' && (
                <>
                  <Button onClick={() => action(b.id, 'confirmed')} data-testid={`accept-${b.id}`} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-9 rounded-lg">
                    <Check className="h-3.5 w-3.5" /> Accept
                  </Button>
                  <Button onClick={() => action(b.id, 'cancelled')} data-testid={`reject-${b.id}`} variant="outline" size="sm" className="h-9 rounded-lg gap-1 text-red-600 border-red-200 hover:bg-red-50">
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
