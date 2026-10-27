import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, Calendar, Package, DollarSign, FileText, MessageSquare, Ship, Plane, Truck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { shipments } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const MODE_ICONS = { air: Plane, ocean: Ship, road: Truck };

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shipment = shipments.find((s) => s.id === id) || shipments[0];
  const ModeIcon = MODE_ICONS[shipment.mode] || Ship;

  return (
    <div className="space-y-6" data-testid="shipment-detail-page">
      <PageHeader
        breadcrumb={`Shipments · ${shipment.id}`}
        title={`${shipment.originCode} → ${shipment.destinationCode}`}
        subtitle={`${shipment.providerName} · ${shipment.containerType}`}
        action={
          <Button variant="outline" onClick={() => navigate('/shipments')} className="rounded-xl h-10 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> All shipments
          </Button>
        }
      />

      {/* Summary header */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-sm font-black text-white">{shipment.providerCode}</div>
            <div>
              <div className="font-mono text-xs text-slate-500">{shipment.id}</div>
              <div className="text-2xl font-black tracking-tight text-[#0F172A]">{shipment.providerName}</div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 capitalize font-semibold">
                  <ModeIcon className="h-3 w-3" /> {shipment.mode}
                </span>
                <span className="text-slate-400">·</span>
                <Calendar className="h-3 w-3" /> Booked {shipment.createdAt}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={shipment.status} />
            <Button asChild variant="outline" className="rounded-xl h-10 gap-1.5">
              <Link to="#"><FileText className="h-4 w-4" /> Documents</Link>
            </Button>
            <Button asChild className="bg-[#0F172A] hover:bg-[#1e293b] text-white rounded-xl h-10 gap-1.5">
              <Link to="#"><MessageSquare className="h-4 w-4" /> Contact carrier</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="ETA" value={shipment.eta} icon={Calendar} />
        <StatCard label="Weight" value={`${shipment.weight.toLocaleString()}`} suffix="kg" icon={Package} />
        <StatCard label="Volume" value={`${shipment.volume}`} suffix="CBM" icon={Package} />
        <StatCard label="Cost" value={`$${shipment.price.toLocaleString()}`} icon={DollarSign} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Timeline */}
        <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
          <h3 className="font-bold text-[#0F172A] mb-1">Tracking Timeline</h3>
          <p className="text-xs text-slate-500 mb-6">Live milestones updated every 15 minutes from carrier systems.</p>

          <ol className="relative space-y-5 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {shipment.timeline.map((t, i) => (
              <li key={i} className="relative">
                <div className="absolute -left-6 top-1">
                  {t.completed && !t.active ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-white flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : t.active ? (
                    <div className="relative h-5 w-5 rounded-full border-2 border-[#0F172A] ring-4 ring-white flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-[#0F172A] pulse-dot text-[#0F172A]" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-white border-2 border-slate-300 ring-4 ring-white" />
                  )}
                </div>
                <div className={cn('flex items-center justify-between gap-3 flex-wrap', !t.completed && 'opacity-50')}>
                  <div>
                    <div className={cn('font-bold', t.active ? 'text-[#0F172A]' : 'text-slate-700')}>{t.status}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      {t.location && <><MapPin className="h-3 w-3" /> {t.location}</>}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">{t.date || 'Pending'}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Side */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
            <h3 className="font-bold text-[#0F172A] mb-4">Shipper</h3>
            <div className="space-y-1.5 text-sm">
              <div className="font-semibold text-[#0F172A]">{shipment.shipperCompany}</div>
              <div className="text-slate-600">{shipment.shipperName}</div>
              <div className="text-xs text-slate-500">{shipment.origin}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
            <h3 className="font-bold text-[#0F172A] mb-4">Consignee</h3>
            <div className="space-y-1.5 text-sm">
              <div className="font-semibold text-[#0F172A]">{shipment.consigneeCompany}</div>
              <div className="text-slate-600">{shipment.consigneeName}</div>
              <div className="text-xs text-slate-500">{shipment.destination}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
            <h3 className="font-bold text-[#0F172A] mb-4">Documents</h3>
            <div className="space-y-2">
              {['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Certificate of Origin'].map((d) => (
                <div key={d} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/60 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="h-8 w-8 rounded-md bg-[#D4AF37]/15 text-[#a8862a] flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                  <div className="flex-1 text-sm font-semibold text-[#0F172A]">{d}</div>
                  <div className="text-xs text-slate-500">PDF</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
