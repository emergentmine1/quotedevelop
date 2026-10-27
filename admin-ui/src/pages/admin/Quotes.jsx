import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, Database, FlaskConical, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { downloadCsv } from '@/lib/csv';
import { downloadXlsx } from '@/lib/xlsx';
import { QUOTE_STATUSES, fetchQuotes, setQuoteStatus, fetchCountryOptions, toExportRows } from '@/lib/quotes-store';
import { QuoteFilters, EMPTY_FILTERS } from '@/components/quotes/QuoteFilters';
import { QuoteRow, STATUS_STYLES } from '@/components/quotes/QuoteRow';
import { useAuth } from '@/contexts/AuthContext';

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Quotes() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [data, setData] = useState({ items: [], total: 0, live: false, statusMap: { toCode: {}, toKey: {} } });
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const { canWrite } = useAuth();
  const query = useDebounced(filters.query, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchQuotes({
        query,
        countryCode: filters.countryCode === 'all' ? '' : filters.countryCode,
        statusKey: filters.statusKey === 'all' ? '' : filters.statusKey,
        from: filters.from,
        to: filters.to,
      }));
    } catch (e) {
      toast.error(e.message || 'Could not load quotes');
    } finally {
      setLoading(false);
    }
  }, [query, filters.countryCode, filters.statusKey, filters.from, filters.to]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchCountryOptions().then(setCountries).catch(() => setCountries([])); }, []);

  const counts = useMemo(() => {
    const c = Object.fromEntries(QUOTE_STATUSES.map((s) => [s.key, 0]));
    data.items.forEach((q) => { const k = data.statusMap.toKey[q.status]; if (k) c[k] += 1; });
    return c;
  }, [data]);

  const changeStatus = async (quote, key) => {
    setSavingId(quote.qrid);
    try {
      const updated = await setQuoteStatus(quote.qrid, key);
      setData((d) => ({ ...d, items: d.items.map((q) => (q.qrid === quote.qrid ? { ...q, ...updated } : q)) }));
      toast.success(`${quote.qrref} marked ${QUOTE_STATUSES.find((s) => s.key === key)?.label}`);
    } catch (e) {
      toast.error(e.message || 'Status change failed');
    } finally {
      setSavingId(null);
    }
  };

  const exportRows = () => toExportRows(data.items, data.statusMap.toKey);
  const fileName = `kwe-quotes-${new Date().toISOString().slice(0, 10)}`;
  const onCsv = () => { downloadCsv(fileName, exportRows()); toast.success(`Exported ${data.items.length} quotes to CSV`); };
  const onXlsx = async () => { await downloadXlsx(fileName, exportRows(), { sheetName: 'Quotes' }); toast.success(`Exported ${data.items.length} quotes to Excel`); };

  return (
    <div className="space-y-6" data-testid="admin-quotes-page">
      <QuotesHeader live={data.live} disabled={!data.items.length} onCsv={onCsv} onXlsx={onXlsx} />
      <StatusChips counts={counts} active={filters.statusKey} onPick={(k) => setFilters({ ...filters, statusKey: filters.statusKey === k ? 'all' : k })} />
      <QuoteFilters filters={filters} onChange={setFilters} countries={countries} />
      <QuotesTable data={data} loading={loading} savingId={savingId} canWrite={canWrite} onStatusChange={changeStatus} />
    </div>
  );
}

function QuotesHeader({ live, disabled, onCsv, onXlsx }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <div
          data-testid="quotes-source-badge"
          className={cn(
            'inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold',
            live ? 'text-emerald-600' : 'text-[#D4AF37]'
          )}
        >
          {live ? <Database className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
          {live ? 'Live · Java backend' : 'Sample data · backend not connected'}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#0F172A] mt-1">Quotes</h1>
        <p className="text-sm text-slate-500 mt-1">Every instant-quote request. Search, move it along, export for the weekly report.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button data-testid="quotes-export-csv" variant="outline" disabled={disabled} onClick={onCsv} className="h-10 rounded-xl gap-2 border-slate-200">
          <FileText className="h-4 w-4" /> Export CSV
        </Button>
        <Button data-testid="quotes-export-xlsx" disabled={disabled} onClick={onXlsx} className="h-10 rounded-xl gap-2 bg-[#0B2545] hover:bg-[#13315c] text-white">
          <FileSpreadsheet className="h-4 w-4" /> Export Excel
        </Button>
      </div>
    </div>
  );
}

function StatusChips({ counts, active, onPick }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {QUOTE_STATUSES.map((s) => (
        <button
          key={s.key}
          type="button"
          data-testid={`quotes-stat-${s.key}`}
          onClick={() => onPick(s.key)}
          className={cn(
            'text-left bg-white rounded-2xl border p-4 kwe-shadow transition-[transform,border-color] hover:-translate-y-0.5',
            active === s.key ? 'border-[#1E6AE1] ring-2 ring-[#1E6AE1]/15' : 'border-slate-100'
          )}
        >
          <div className="text-2xl font-black tracking-tight text-[#0F172A]">{counts[s.key]}</div>
          <span className={cn('inline-block mt-1 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md border', STATUS_STYLES[s.key])}>
            {s.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function QuotesTable({ data, loading, savingId, canWrite, onStatusChange }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 kwe-shadow overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div data-testid="quotes-count" className="text-xs font-bold uppercase tracking-widest text-slate-500">
          {data.items.length} of {data.total} quote{data.total !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-3">
          {!canWrite && <span data-testid="quotes-readonly-note" className="text-[11px] text-slate-400">Read-only access · status changes disabled</span>}
          {loading && <Loader2 data-testid="quotes-loading" className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left" data-testid="quotes-table">
          <thead className="bg-slate-50/60 text-[10px] uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-bold">Reference</th>
              <th className="px-5 py-2.5 font-bold">Customer</th>
              <th className="px-5 py-2.5 font-bold">Lane</th>
              <th className="px-5 py-2.5 font-bold text-right">Weight</th>
              <th className="px-5 py-2.5 font-bold">Cargo ready</th>
              <th className="px-5 py-2.5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((q) => (
              <QuoteRow
                key={q.qrid}
                quote={q}
                statusKey={data.statusMap.toKey[q.status]}
                saving={savingId === q.qrid}
                readOnly={!canWrite}
                onStatusChange={onStatusChange}
              />
            ))}
          </tbody>
        </table>
        {!loading && !data.items.length && (
          <div data-testid="quotes-empty" className="p-12 text-center">
            <Inbox className="h-8 w-8 mx-auto text-slate-300 mb-3" />
            <div className="text-sm font-semibold text-slate-500">No quotes match these filters</div>
          </div>
        )}
      </div>
    </div>
  );
}
