import { Eye, Copy, PowerOff, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusPill from '@/components/StatusPill';
import { CARRIERS, ORIGIN_PORTS, TRANSPORT_MODES, CALC_METHODS, nameOf } from '@/lib/rate-profiles/constants';

export const fmtStamp = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '—');
export const pct = (v) => (v === undefined || v === null || v === '' ? '—' : `${v}%`);

export const exportRows = (list) => list.map((p) => ({
  'Profile ID': p.profileCode,
  'Charge Code': p.chargeCode,
  Carrier: p.carrierCode,
  'Transport Mode': p.transportMode,
  'Service Type': p.serviceType,
  'Origin Port': p.originPort,
  'Calculation Method': nameOf(CALC_METHODS, p.calculationMethod),
  Currency: p.currencyCode,
  'Effective Date': p.effectiveDate,
  'Expiration Date': p.expirationDate,
  'External Markup %': p.externalMarkup ?? '',
  'Internal Markup %': p.internalMarkup ?? '',
  Status: p.status,
  Version: p.version,
  'Last Modified': fmtStamp(p.updatedAt),
  'Modified By': p.updatedBy,
  Destinations: (p.rows || []).map((r) => r.destPort).join(' '),
}));

const TH = ({ children, right }) => <th className={`${right ? 'text-right' : 'text-left'} py-3 px-4 whitespace-nowrap`}>{children}</th>;

export function ProfileTable({ list, onView, onClone, onToggleStatus }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 kwe-shadow overflow-x-auto">
      <table className="w-full" data-testid="profile-table">
        <thead className="bg-slate-50">
          <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            <TH>Profile</TH><TH>Charge code</TH><TH>Carrier</TH><TH>Mode</TH><TH>Origin</TH><TH>Service</TH>
            <TH>Currency</TH><TH>Effective</TH><TH>Expiry</TH><TH>Status</TH><TH>Last modified</TH><TH right>Ver.</TH><TH />
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100">
          {list.map((p) => (
            <tr key={p.id} data-testid={`profile-row-${p.profileCode}`} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3.5 px-4">
                <button onClick={() => onView(p)} className="font-bold text-[#0F172A] hover:text-[#D4AF37] font-mono text-xs">{p.profileCode}</button>
                <div className="text-xs text-slate-500 mt-0.5">{(p.rows || []).map((r) => r.destPort).slice(0, 4).join(', ') || '—'}</div>
              </td>
              <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">{p.chargeCode}</td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0F172A] px-1.5 py-0.5 rounded bg-sky-50 whitespace-nowrap">{p.carrierCode}</span>
                  <span className="text-slate-700 text-xs">{nameOf(CARRIERS, p.carrierCode)}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-xs text-slate-700">{nameOf(TRANSPORT_MODES, p.transportMode)}</td>
              <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">{p.originPort} - {nameOf(ORIGIN_PORTS, p.originPort)}</td>
              <td className="py-3.5 px-4 text-slate-700">{p.serviceType}</td>
              <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{p.currencyCode}</td>
              <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{p.effectiveDate}</td>
              <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{p.expirationDate}</td>
              <td className="py-3.5 px-4"><StatusPill status={p.status} /></td>
              <td data-testid={`profile-modified-${p.profileCode}`} className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">{fmtStamp(p.updatedAt)}</td>
              <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700">v{p.version}</td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-0.5 justify-end">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View" data-testid={`view-${p.profileCode}`} onClick={() => onView(p)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Clone" data-testid={`clone-${p.profileCode}`} onClick={() => onClone(p)}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${p.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'}`}
                    title={p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} data-testid={`toggle-status-${p.profileCode}`} onClick={() => onToggleStatus(p)}>
                    {p.status === 'ACTIVE' ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 && <div data-testid="profile-empty" className="py-16 text-center text-sm text-slate-500">No rate profiles match your filters.</div>}
    </div>
  );
}
