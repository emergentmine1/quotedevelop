import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { Star, Mail, Phone, Plus } from 'lucide-react';
import { providers } from '@/lib/mock-data';

export default function ProviderManagement() {
  return (
    <div className="space-y-6" data-testid="provider-management-page">
      <PageHeader
        breadcrumb="Admin · Providers"
        title="Provider Network"
        subtitle="Approve, monitor and manage the carrier network on KWE."
        action={<Button className="rounded-xl bg-[#0F172A] text-white hover:bg-[#1e293b] gap-1.5" data-testid="add-provider-btn"><Plus className="h-4 w-4" /> Add provider</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {providers.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6 hover:-translate-y-1 transition-transform" data-testid={`provider-card-${p.id}`}>
            <div className="flex items-start justify-between">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center font-black text-base" style={{ background: p.color, color: p.textColor }}>{p.code}</div>
              <StatusPill status={p.status} />
            </div>
            <h3 className="mt-4 font-bold text-[#0F172A] text-lg">{p.name}</h3>
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#0F172A]">{p.reliability}</span>
              <span className="text-xs text-slate-500 ml-1">trust score</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 pt-5 border-t border-slate-100">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Routes</div>
                <div className="font-bold text-[#0F172A] mt-0.5">{p.routes}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Bookings</div>
                <div className="font-bold text-[#0F172A] mt-0.5">{p.bookings}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Revenue</div>
                <div className="font-bold text-[#0F172A] mt-0.5">${(p.revenue / 1000).toFixed(0)}k</div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-600"><Mail className="h-3 w-3" /> {p.contactEmail}</div>
              <div className="flex items-center gap-2 text-slate-600"><Phone className="h-3 w-3" /> {p.contactPhone}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
