import { Link } from 'react-router-dom';
import { Plane, ArrowRight, Calculator, History, Activity, Database, Layers } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { airMatrices, matrixHistory } from '@/lib/pricing-data';

const MATRIX_CARDS = [
  {
    type: 'air',
    title: 'Air Rate Matrix',
    description: 'Airline · destination · weight-break rates with fuel and security charges.',
    icon: Plane,
    to: '/admin/pricing/air',
    color: 'from-sky-500/15 to-sky-500/5',
    iconBg: 'bg-sky-500',
  },
];

export default function PricingOverview() {
  const totals = {
    air: airMatrices.length,
    all: airMatrices.length,
  };
  const allActive = [...airMatrices].filter((m) => m.status === 'active').length;
  const breakRows = airMatrices.reduce((a, m) => a + m.breaks.length, 0);

  return (
    <div className="space-y-8" data-testid="pricing-overview-page">
      {/* Hero with engine illustration */}
      <div className="bg-gradient-to-br from-[#0F172A] to-[#1e293b] text-white rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              <Database className="h-3.5 w-3.5" /> Single source of truth
            </div>
            <h2 className="mt-3 text-3xl lg:text-4xl font-black tracking-tight">
              The KWE pricing engine.
            </h2>
            <p className="mt-2 text-slate-300 max-w-xl">
              Every freight cost on KWE is computed from these matrices — no inference, no guesswork.
              AI-driven optimization modules consume from this same source.
            </p>
            <div className="mt-5 flex gap-3 flex-wrap">
              <Button asChild className="bg-[#D4AF37] hover:bg-[#c19f2d] text-[#0F172A] font-semibold rounded-xl h-11 px-5">
                <Link to="/admin/pricing/calculator" data-testid="open-calculator-btn">
                  <Calculator className="h-4 w-4 mr-1" /> Open quote calculator
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl h-11 bg-white/5 text-white border-white/20 hover:bg-white/10">
                <Link to="/admin/pricing/history">
                  <History className="h-4 w-4 mr-1" /> Recent changes
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active matrices', value: allActive, hint: `of ${totals.all} total` },
              { label: 'Break records', value: breakRows.toLocaleString(), hint: 'weight break rows' },
              { label: 'Carriers covered', value: '8', hint: 'air carriers' },
              { label: 'Trade lanes', value: '60+', hint: 'origin → destination pairs' },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">{s.label}</div>
                <div className="text-2xl font-black tracking-tight mt-1">{s.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        <StatCard label="Air matrices" value={totals.air} icon={Plane} testId="kpi-air" />
      </div>

      {/* Matrix type cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        {MATRIX_CARDS.map((c) => (
          <Link
            key={c.type}
            to={c.to}
            data-testid={`pricing-card-${c.type}`}
            className="group relative bg-white rounded-2xl border border-slate-100 p-6 hover:-translate-y-1 transition-all duration-200 kwe-shadow hover:kwe-shadow-md overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className="relative flex items-start gap-4">
              <div className={`h-12 w-12 rounded-xl ${c.iconBg} text-white flex items-center justify-center shrink-0`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#0F172A] text-lg">{c.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{c.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#0F172A] group-hover:text-[#D4AF37]">
                  Open matrix <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent history */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="flex items-center justify-between p-6 pb-3">
          <div>
            <h3 className="font-bold text-[#0F172A] flex items-center gap-2"><Activity className="h-4 w-4 text-[#D4AF37]" /> Latest matrix activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit trail of pricing updates across all matrices</p>
          </div>
          <Link to="/admin/pricing/history" className="text-xs font-bold text-slate-600 hover:text-[#D4AF37] uppercase tracking-widest">View all →</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {matrixHistory.slice(0, 6).map((h) => (
            <div key={h.id} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50/60">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Layers className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#0F172A] truncate">
                  {h.matrixName} <span className="font-mono text-xs text-slate-500">· v{h.version}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{h.summary} · by {h.user}</div>
              </div>
              <div className="text-xs text-slate-400">{h.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
