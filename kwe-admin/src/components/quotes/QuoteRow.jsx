import { ArrowRight, Plane } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Flag from '@/components/Flag';
import { cn } from '@/lib/utils';
import { QUOTE_STATUSES } from '@/lib/quotes-store';

export const STATUS_STYLES = {
  new: 'bg-sky-100 text-sky-700 border-sky-200',
  reviewed: 'bg-amber-100 text-amber-700 border-amber-200',
  sent: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  lost: 'bg-slate-100 text-slate-500 border-slate-200',
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—';
const fmtNum = (n) => (n === null || n === undefined || n === '' ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 }));

export function QuoteRow({ quote, statusKey, onStatusChange, saving }) {
  return (
    <tr data-testid={`quote-row-${quote.qrid}`} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
      <td className="px-5 py-3.5">
        <div data-testid={`quote-ref-${quote.qrid}`} className="font-mono text-xs font-bold text-[#0B2545]">{quote.qrref}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{fmtDate(quote.createdAt)}</div>
      </td>
      <td className="px-5 py-3.5 min-w-0">
        <div className="text-sm font-semibold text-[#0F172A] truncate max-w-[220px]">{quote.fullName}</div>
        <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
          {quote.companyName ? `${quote.companyName} · ` : ''}{quote.email}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Plane className="h-3 w-3 text-slate-400" />
          <Flag code={quote.pickupCountryCode} size={14} />
          <span className="font-mono">{quote.originPortCode || '—'}</span>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <Flag code={quote.deliveryCountryCode} size={14} />
          <span className="font-mono">{quote.destinationPortCode || '—'}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-right text-xs text-slate-700 font-semibold whitespace-nowrap">
        {fmtNum(quote.totalChargeableWeight ?? quote.totalGrossWeight)} kg
        <div className="text-[11px] text-slate-400 font-normal">{fmtNum(quote.totalVolume)} cbm</div>
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{fmtDate(quote.cargoReadyDate)}</td>
      <td className="px-5 py-3.5">
        <Select value={statusKey} onValueChange={(v) => onStatusChange(quote, v)} disabled={saving}>
          <SelectTrigger
            data-testid={`quote-status-select-${quote.qrid}`}
            className={cn('h-8 w-32 rounded-lg border text-[11px] font-bold uppercase tracking-widest', STATUS_STYLES[statusKey])}
          >
            <SelectValue placeholder={quote.status} />
          </SelectTrigger>
          <SelectContent>
            {QUOTE_STATUSES.map((s) => (
              <SelectItem key={s.key} value={s.key} data-testid={`quote-status-option-${s.key}`}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}
