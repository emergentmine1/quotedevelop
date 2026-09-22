import { useMemo, useState } from 'react';
import { Bell, Package, FileText, DollarSign, AlertCircle, Check } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { notifications as initialNotifs } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ICONS = { booking: Package, shipment: Package, invoice: DollarSign, system: AlertCircle };
const COLORS = {
  booking: 'bg-blue-50 text-blue-600',
  shipment: 'bg-emerald-50 text-emerald-600',
  invoice: 'bg-amber-50 text-amber-600',
  system: 'bg-slate-100 text-slate-600',
};

const TABS = [
  { id: 'all', label: 'All', type: null },
  { id: 'bookings', label: 'Bookings', type: 'booking' },
  { id: 'shipments', label: 'Shipments', type: 'shipment' },
  { id: 'invoices', label: 'Invoices', type: 'invoice' },
  { id: 'system', label: 'System', type: 'system' },
];

export default function Notifications() {
  const [notifs, setNotifs] = useState(initialNotifs);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return notifs;
    const tab = TABS.find((t) => t.id === filter);
    const type = tab?.type || filter;
    return notifs.filter((n) => n.type === type);
  }, [filter, notifs]);
  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = () => {
    if (unread === 0) {
      toast.info('No unread notifications');
      return;
    }
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
    toast.success(`Marked ${unread} as read`);
  };
  const toggleRead = (id) => setNotifs((n) => n.map((x) => (x.id === id ? { ...x, read: !x.read } : x)));

  const tabs = TABS.map((t) => ({ ...t, count: t.id === 'all' ? notifs.length : undefined }));

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <PageHeader
        breadcrumb="Inbox"
        title="Notifications"
        subtitle={`${unread} unread · stay on top of every shipment update.`}
        action={
          <Button data-testid="mark-all-read" onClick={markAllRead} variant="outline" className="rounded-xl h-10 gap-1.5">
            <Check className="h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        {/* Tabs */}
        <div className="border-b border-slate-100 px-4 flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              data-testid={`tab-${t.id}`}
              className={cn(
                'px-3 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                filter === t.id ? 'border-[#D4AF37] text-[#0F172A]' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
              {t.count !== undefined && <span className="ml-1.5 text-xs text-slate-400">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {filtered.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <button
                key={n.id}
                onClick={() => toggleRead(n.id)}
                data-testid={`notification-${n.id}`}
                className={cn('w-full text-left px-6 py-4 hover:bg-slate-50/60 transition-colors flex items-start gap-4', !n.read && 'bg-[#D4AF37]/5')}
              >
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', COLORS[n.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#0F172A]">{n.title}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{n.type}</span>
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5">{n.description}</div>
                  <div className="text-xs text-slate-400 mt-1.5">{n.timestamp}</div>
                </div>
                {!n.read && <span className="h-2.5 w-2.5 rounded-full gold-bg shrink-0 mt-2" />}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-500">All caught up — no notifications here.</div>}
      </div>
    </div>
  );
}
