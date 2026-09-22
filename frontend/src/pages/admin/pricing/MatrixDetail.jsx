import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plane, Ship, Container as ContainerIcon, Copy, PowerOff, Pencil, FileCheck, Layers, History, Calculator, ArrowRight, Calendar, Tag, User, Building2, Receipt } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import Flag from '@/components/Flag';
import { Button } from '@/components/ui/button';
import { airMatrices, lclMatrices, fclMatrices, surchargeMatrices, matrixHistory, AIR_DESTINATIONS } from '@/lib/pricing-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TYPE_META = {
  air: { Icon: Plane, color: 'bg-sky-500', label: 'Air Matrix', accent: 'text-sky-700 bg-sky-50' },
  lcl: { Icon: Ship, color: 'bg-indigo-500', label: 'Ocean LCL', accent: 'text-indigo-700 bg-indigo-50' },
  fcl: { Icon: ContainerIcon, color: 'bg-teal-500', label: 'Ocean FCL', accent: 'text-teal-700 bg-teal-50' },
  surcharge: { Icon: Receipt, color: 'bg-amber-500', label: 'Surcharge', accent: 'text-amber-700 bg-amber-50' },
};

const AIR_CALCULATION_METHOD_LABELS = {
  flat_amount: 'Flat Amount',
  weight_rate: 'Chargeable Wt X Rate Per Unit (KG)',
  flat_plus_weight_rate: 'Flat Amount + Chargeable Wt X Rate Per Unit (KG)',
};

function lookup(id) {
  return airMatrices.find((m) => m.id === id)
    || lclMatrices.find((m) => m.id === id)
    || fclMatrices.find((m) => m.id === id)
    || surchargeMatrices.find((m) => m.id === id);
}

export default function MatrixDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const matrix = lookup(id);
  const [tab, setTab] = useState('general');

  if (!matrix) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
        <h2 className="font-bold text-[#0F172A]">Matrix Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The matrix <code className="font-mono">{id}</code> doesn’t exist.</p>
        <Button onClick={() => navigate('/admin/pricing')} className="mt-4 rounded-xl">Back to Pricing</Button>
      </div>
    );
  }

  const meta = TYPE_META[matrix.type];
  const history = matrixHistory.filter((h) => h.matrixId === matrix.id);

  const TABS = [
    { id: 'general', label: 'General', icon: FileCheck },
    { id: 'breaks', label: matrix.type === 'fcl' ? 'Container Rates' : matrix.type === 'air' ? 'Weight Breaks' : matrix.type === 'lcl' ? 'CBM Breaks' : 'Configuration', icon: Layers },
    { id: 'history', label: 'Version History', icon: History },
  ];

  return (
    <div className="space-y-6" data-testid={`matrix-detail-${matrix.id}`}>
      <PageHeader
        breadcrumb={`Pricing · ${meta.label}`}
        title={matrix.name}
        subtitle={`Matrix ${matrix.id} · v${matrix.version || 1} · last updated ${matrix.updatedAt || matrix.effectiveDate}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl h-10 gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
            <Button asChild variant="outline" className="rounded-xl h-10 gap-1.5"><Link to="/admin/pricing/calculator"><Calculator className="h-4 w-4" /> Try in calculator</Link></Button>
          </div>
        }
      />

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('h-14 w-14 rounded-xl text-white flex items-center justify-center', meta.color)}>
              <meta.Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-slate-500">{matrix.id}</span>
                <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded', meta.accent)}>{meta.label}</span>
                <StatusPill status={matrix.status} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#0F172A] mt-1.5 truncate">{matrix.name}</h2>
              {matrix.type !== 'surcharge' && (
                <LaneSummary matrix={matrix} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-xl h-10 gap-1.5" data-testid="md-edit"><Link to={`/admin/pricing/matrix/${matrix.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
            <Button variant="outline" className="rounded-xl h-10 gap-1.5" onClick={() => toast.success(`Cloned to new draft`)} data-testid="md-clone"><Copy className="h-4 w-4" /> Clone</Button>
            <Button variant="outline" className="rounded-xl h-10 gap-1.5 text-amber-700 border-amber-200" onClick={() => toast.info(`${matrix.id} deactivated`)} data-testid="md-deactivate"><PowerOff className="h-4 w-4" /> Deactivate</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow overflow-hidden">
        <div className="border-b border-slate-100 px-2 flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`md-tab-${t.id}`}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                tab === t.id ? 'border-[#D4AF37] text-[#0F172A]' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <t.icon className={cn('h-4 w-4', tab === t.id && 'text-[#D4AF37]')} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 fade-in">
          {tab === 'general' && <GeneralTab matrix={matrix} />}
          {tab === 'breaks' && <BreaksTab matrix={matrix} />}
          {tab === 'history' && <HistoryTab history={history} />}
        </div>
      </div>
    </div>
  );
}

function LaneSummary({ matrix }) {
  if (matrix.type === 'air') {
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
        <span className="font-mono font-bold text-[#0F172A]">{matrix.airlineFlightCode}</span>
        <span className="text-slate-400">·</span>
        <span>{matrix.airlineName}</span>
        <span className="text-slate-400">·</span>
        <Flag code={matrix.destinationCountryCode} size={14} />
        <span className="font-mono font-bold text-[#0F172A]">{matrix.destination}</span>
        <span>{matrix.destinationCity}</span>
        <span className="text-slate-400">·</span>
        <span>{matrix.serviceType}</span>
      </div>
    );
  }
  if (matrix.type === 'lcl' || matrix.type === 'fcl') {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
        <Flag code={matrix.originCountryCode} size={14} />
        <span className="font-mono font-bold text-[#0F172A]">{matrix.originPort}</span>
        <span>{matrix.originCity}</span>
        <ArrowRight className="h-3 w-3 text-slate-400" />
        <Flag code={matrix.destinationCountryCode} size={14} />
        <span className="font-mono font-bold text-[#0F172A]">{matrix.destinationPort}</span>
        <span>{matrix.destinationCity}</span>
        <span className="text-slate-400">·</span>
        <span>{matrix.carrierName}</span>
      </div>
    );
  }
  return null;
}

function GeneralTab({ matrix }) {
  if (matrix.type === 'air') {
    const calculationMethod = matrix.calculationMethod || matrix.calculationType;
    const rows = [
      ['Matrix ID', matrix.id],
      ['Airline', `${matrix.airlineFlightCode} - ${matrix.airlineName}`],
      ['Origin', matrix.origin || 'HKG'],
      ['Charge code', matrix.chargeCode || 'FRTAB'],
      ['Service', matrix.serviceType],
      ['Calculation method', AIR_CALCULATION_METHOD_LABELS[calculationMethod] || calculationMethod],
      ['Currency', matrix.currency],
      ['Effective', matrix.effectiveDate],
      ['Expiry', matrix.expiryDate],
      ['Status', matrix.status],
      ['Version', `v${matrix.version || 1}`],
      ['Updated on', matrix.updatedAt],
    ];

    return (
      <div className="grid grid-cols-1 gap-6">
        <InfoCard icon={Tag} title="General info" rows={rows} />
        {matrix.remarks && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Remarks</div>
            {matrix.remarks}
          </div>
        )}
      </div>
    );
  }

  const baseRows = [
    ['Matrix ID', matrix.id],
    ['Type', matrix.type.toUpperCase()],
    ['Status', matrix.status],
    ['Version', `v${matrix.version || 1}`],
    ['Currency', matrix.currency],
    ['Effective date', matrix.effectiveDate],
    ['Expiry date', matrix.expiryDate],
    ['Created on', matrix.createdAt],
    ['Updated on', matrix.updatedAt],
    ['Created by', matrix.createdBy],
  ];

  const typeRows = matrix.type === 'air'
    ? [['Airline code', matrix.airlineCode], ['Airline flight code', matrix.airlineFlightCode], ['Airline name', matrix.airlineName], ['Destination', `${matrix.destination} · ${matrix.destinationCity}`], ['Service type', matrix.serviceType]]
    : matrix.type === 'lcl'
      ? [['Carrier code', matrix.carrierCode], ['Carrier', matrix.carrierName], ['Origin port', `${matrix.originPort} · ${matrix.originCity}`], ['Destination port', `${matrix.destinationPort} · ${matrix.destinationCity}`]]
      : matrix.type === 'fcl'
        ? [['Carrier code', matrix.carrierCode], ['Carrier', matrix.carrierName], ['Origin port', `${matrix.originPort} · ${matrix.originCity}`], ['Destination port', `${matrix.destinationPort} · ${matrix.destinationCity}`]]
        : [['Surcharge type', matrix.surchargeName], ['Applies to', matrix.appliesTo], ['Calculation', matrix.calculationType], ['Value', matrix.calculationType === 'percentage' ? `${matrix.value}%` : `$${matrix.value}`]];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InfoCard icon={Tag} title="Matrix metadata" rows={baseRows} />
      <InfoCard icon={Building2} title="Configuration" rows={typeRows} />
      {matrix.remarks && (
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Remarks</div>
          {matrix.remarks}
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, title, rows }) {
  return (
    <div className="p-5 rounded-xl bg-slate-50/40 border border-slate-100">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <dl className="grid grid-cols-1 gap-y-2 text-sm">
        {rows.filter(([, v]) => v != null && v !== '').map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 pb-2 last:pb-0">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-semibold text-[#0F172A] text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BreaksTab({ matrix }) {
  if (matrix.type === 'air') {
    const hasLegacyWeightBreaks = Array.isArray(matrix.breaks) && matrix.breaks.length > 0;
    const resolvedCalculationMethod = matrix.calculationMethod || matrix.calculationType || (hasLegacyWeightBreaks ? 'weight_rate' : 'flat_amount');
    const showWeightRateColumns = resolvedCalculationMethod !== 'flat_amount';
    const showFlatAmountColumn = resolvedCalculationMethod === 'flat_amount' || resolvedCalculationMethod === 'flat_plus_weight_rate';

    const weightBreaks = (matrix.weightBreaks && matrix.weightBreaks.length > 0)
      ? matrix.weightBreaks.map((b, idx) => ({ label: b?.label || `${b?.value ?? idx + 1}` }))
      : (matrix.breaks || []).map((b) => ({ label: `${b.weight} KG+` }));

    const legacyBaseRates = (matrix.breaks || []).map((b) => Number((b.freight + b.fuel + b.security + b.other).toFixed(2)));
    const legacyDestinations = [
      matrix.destination,
      ...AIR_DESTINATIONS.map((d) => d.code).filter((code) => code !== matrix.destination),
    ].filter(Boolean).slice(0, 4);

    const fallbackRows = legacyDestinations.map((destination, idx) => {
      const factor = [1, 0.92, 0.84, 0.78][idx] || 1;
      return {
        destination,
        flatAmount: 0,
        min: idx === 0 ? 0 : idx * 10,
        max: undefined,
        rates: legacyBaseRates.map((rate) => Number((rate * factor).toFixed(2))),
      };
    });

    const destinationRows = ((matrix.destinationRows && matrix.destinationRows.length > 0)
      ? matrix.destinationRows
      : fallbackRows).map((row) => ({
      destination: row.destination,
      flatAmount: Number(row.flatAmount || 0),
      min: Number(row.min || 0),
      max: row.max,
      rates: Array.isArray(row.rates) ? row.rates : [],
    }));

    return (
      <div className="overflow-x-auto">
        <table className={cn('w-full text-sm', showWeightRateColumns ? 'min-w-[900px]' : 'min-w-[420px]')}>
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <th className="text-left py-3 px-4">Destination</th>
              {showFlatAmountColumn && <th className="text-right py-3 px-4">Flat Amount</th>}
              {showWeightRateColumns && <th className="text-right py-3 px-4">Min</th>}
              {showWeightRateColumns && <th className="text-right py-3 px-4">Max</th>}
              {showWeightRateColumns && weightBreaks.map((wb, idx) => (
                <th key={`${wb.label}-${idx}`} className="text-right py-3 px-4">{wb.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {destinationRows.map((row, rowIdx) => (
              <tr key={`${row.destination}-${rowIdx}`} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-bold text-[#0F172A]">{row.destination}</td>
                {showFlatAmountColumn && <td className="py-3 px-4 text-right font-mono font-semibold text-[#0F172A]">${Number(row.flatAmount || 0).toFixed(2)}</td>}
                {showWeightRateColumns && <td className="py-3 px-4 text-right font-mono">{Number(row.min || 0).toFixed(2)}</td>}
                {showWeightRateColumns && <td className="py-3 px-4 text-right font-mono">{row.max == null ? '-' : Number(row.max).toFixed(2)}</td>}
                {showWeightRateColumns && weightBreaks.map((_, colIdx) => {
                  const rate = Number(row?.rates?.[colIdx]);
                  return (
                    <td key={`${rowIdx}-${colIdx}`} className="py-3 px-4 text-right font-mono font-semibold text-[#0F172A]">
                      {Number.isFinite(rate) ? `$${rate.toFixed(2)}` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (matrix.type === 'lcl') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <th className="text-left py-3 px-5">CBM range</th>
              <th className="text-right py-3 px-5">Rate per CBM</th>
              <th className="text-right py-3 px-5">Doc fee</th>
              <th className="text-right py-3 px-5">THC</th>
              <th className="text-right py-3 px-5">Other</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrix.breaks.map((b, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="py-3 px-5 font-bold text-[#0F172A]">{b.minCBM}–{b.maxCBM === 9999 ? '∞' : b.maxCBM} CBM</td>
                <td className="py-3 px-5 text-right font-mono font-bold">${b.ratePerCbm}/CBM</td>
                <td className="py-3 px-5 text-right font-mono">${b.documentationFee}</td>
                <td className="py-3 px-5 text-right font-mono">${b.thc}</td>
                <td className="py-3 px-5 text-right font-mono">${b.other}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (matrix.type === 'fcl') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(matrix.containerRates).map(([type, rate]) => (
          <div key={type} className={cn('p-4 rounded-xl border', rate ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/40')}>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{type}</div>
            <div className="mt-1 text-2xl font-black tracking-tight text-[#0F172A]">
              {rate ? `$${rate.toLocaleString()}` : <span className="text-slate-300">—</span>}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">per container</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="text-sm text-slate-500">
      Surcharges do not carry break tables — see the General tab for configuration.
    </div>
  );
}

function HistoryTab({ history }) {
  if (!history.length) {
    return <div className="text-sm text-slate-500">No history yet for this matrix.</div>;
  }
  return (
    <ol className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-white border-2 border-[#D4AF37]" />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-bold text-[#0F172A] flex items-center gap-2">
                <span className="capitalize">{h.action.replace('-', ' ')}</span>
                <span className="font-mono text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">v{h.version}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><User className="h-3 w-3" /> {h.user} · {h.summary}</div>
            </div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1"><Calendar className="h-3 w-3" /> {h.timestamp}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
