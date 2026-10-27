import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Copy, PowerOff, Power, Plane, FileText, Layers, Tag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusPill from '@/components/StatusPill';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
  CATEGORIES, CARRIERS, ORIGIN_PORTS, DEST_PORTS, TRANSPORT_MODES, CALC_METHODS, nameOf, calcMethod,
} from '@/lib/rate-profiles/constants';
import { getProfile, changeStatus } from '@/lib/rate-profiles/store';
import { fmtStamp, pct } from '@/components/rates/ProfileTable';

const money = (v, cur) => (v === undefined || v === null || v === '' ? '—' : `${cur === 'USD' ? '$' : ''}${Number(v).toFixed(2)}${cur === 'USD' ? '' : ` ${cur}`}`);

export default function RateProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [p, setP] = useState(undefined);

  useEffect(() => { getProfile(id).then(setP).catch(() => setP(null)); }, [id]);

  if (p === undefined) return <div className="py-24 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>;
  if (!p) return <div data-testid="profile-not-found" className="py-24 text-center text-slate-500">Rate profile not found.</div>;

  const meta = CATEGORIES[p.category];
  const title = `${p.carrierCode} · ${p.originPort} · ${p.chargeCode}`;
  const toggle = async () => {
    const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setP(await changeStatus(p, next, user.email));
      toast.success(`${p.profileCode} ${next === 'ACTIVE' ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error(e.message || 'Status change failed', { duration: 8000 });
    }
  };

  return (
    <div className="space-y-6" data-testid="rate-profile-detail">
      <PageHeader
        breadcrumb={`Rate Management · ${meta.label}`}
        title={title}
        subtitle={`Profile ${p.profileCode} · v${p.version} · last updated ${fmtStamp(p.updatedAt)}`}
        action={<Button variant="outline" onClick={() => navigate(`/admin/pricing/${p.category}`)} className="rounded-xl h-10 gap-1.5" data-testid="detail-back"><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />
      <div className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-sky-500 text-white flex items-center justify-center"><Plane className="h-6 w-6" /></div>
          <div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-mono text-slate-500">{p.profileCode}</span>
              <span className="font-bold uppercase tracking-widest text-sky-700 bg-sky-50 px-2 py-0.5 rounded">{meta.label}</span>
              <StatusPill status={p.status} />
            </div>
            <div className="text-xl font-black text-[#0F172A] mt-1">{title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{nameOf(CARRIERS, p.carrierCode)} · {nameOf(ORIGIN_PORTS, p.originPort)} · {p.serviceType}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-1.5" data-testid="detail-edit" onClick={() => navigate(`/admin/pricing/profile/${p.id}/edit`)}><Pencil className="h-4 w-4" /> Edit</Button>
          <Button variant="outline" className="rounded-xl gap-1.5" data-testid="detail-clone" onClick={() => navigate(`/admin/pricing/${p.category}/new?cloneFrom=${p.id}`)}><Copy className="h-4 w-4" /> Clone</Button>
          <Button variant="outline" className={`rounded-xl gap-1.5 ${p.status === 'ACTIVE' ? 'border-amber-200 text-amber-700' : 'border-emerald-200 text-emerald-700'}`} data-testid="detail-toggle-status" onClick={toggle}>
            {p.status === 'ACTIVE' ? <><PowerOff className="h-4 w-4" /> Deactivate</> : <><Power className="h-4 w-4" /> Activate</>}
          </Button>
        </div>
      </div>
      <Tabs defaultValue="general" className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-4">
        <TabsList className="bg-transparent border-b border-slate-100 rounded-none w-full justify-start h-auto p-0 gap-2">
          <TabsTrigger value="general" data-testid="detail-tab-general" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37] data-[state=active]:shadow-none px-4 py-2.5"><FileText className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="breaks" data-testid="detail-tab-weight-breaks" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#D4AF37] data-[state=active]:shadow-none px-4 py-2.5"><Layers className="h-4 w-4" /> Weight Breaks</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="pt-4"><GeneralInfo p={p} /></TabsContent>
        <TabsContent value="breaks" className="pt-4"><WeightBreaks p={p} /></TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralInfo({ p }) {
  const items = [
    ['Profile ID', p.profileCode], ['Charge Code', p.chargeCode], ['Carrier Code', `${p.carrierCode} - ${nameOf(CARRIERS, p.carrierCode)}`],
    ['Transport Mode', nameOf(TRANSPORT_MODES, p.transportMode)], ['Service Type', p.serviceType], ['Origin Port', `${p.originPort} - ${nameOf(ORIGIN_PORTS, p.originPort)}`],
    ['Calculation Method', nameOf(CALC_METHODS, p.calculationMethod)], ['Currency Code', p.currencyCode],
    ['Effective Date', p.effectiveDate], ['Expiration Date', p.expirationDate],
    ['External Markup', pct(p.externalMarkup)], ['Internal Markup', pct(p.internalMarkup)],
    ['Status', p.status], ['Version', `v${p.version}`], ['Created', `${fmtStamp(p.createdAt)} · ${p.createdBy || '—'}`],
    ['Last Modified', `${fmtStamp(p.updatedAt)} · ${p.updatedBy || '—'}`],
  ];
  return (
    <div className="space-y-4" data-testid="detail-general">
      <div className="rounded-xl bg-slate-50/70 p-5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3"><Tag className="h-3.5 w-3.5" /> General info</div>
        <dl className="divide-y divide-slate-100">
          {items.map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 text-sm">
              <dt className="text-slate-600">{k}</dt>
              <dd data-testid={`general-${k.toLowerCase().replace(/\s+/g, '-')}`} className="font-semibold text-[#0F172A] text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      {p.remarks && (
        <div className="rounded-xl bg-slate-50/70 p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Remarks</div>
          <p className="text-sm text-slate-700">{p.remarks}</p>
        </div>
      )}
    </div>
  );
}

function WeightBreaks({ p }) {
  const m = calcMethod(p.calculationMethod);
  return (
    <div className="overflow-x-auto" data-testid="detail-weight-breaks">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            <th className="text-left py-3 px-4">Destination</th>
            {m.flat && <th className="text-right py-3 px-4">Flat</th>}
            {m.weight && <th className="text-right py-3 px-4">Min</th>}
            {m.weight && <th className="text-right py-3 px-4">Max</th>}
            {m.weight && p.weightBreaks.map((w) => <th key={w} className="text-right py-3 px-4">{w} KG</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {p.rows.map((r) => (
            <tr key={r.destPort} data-testid={`detail-row-${r.destPort}`}>
              <td className="py-3 px-4 font-bold text-[#0F172A]">{r.destPort} <span className="font-normal text-xs text-slate-500">{nameOf(DEST_PORTS, r.destPort)}</span></td>
              {m.flat && <td className="py-3 px-4 text-right font-mono">{money(r.flatAmount, p.currencyCode)}</td>}
              {m.weight && <td className="py-3 px-4 text-right font-mono">{money(r.minAmount, p.currencyCode)}</td>}
              {m.weight && <td className="py-3 px-4 text-right font-mono">{money(r.maxAmount, p.currencyCode)}</td>}
              {m.weight && p.weightBreaks.map((w, c) => <td key={w} className="py-3 px-4 text-right font-mono font-semibold">{money(r.rates[c], p.currencyCode)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
