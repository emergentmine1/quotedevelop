import { useMemo, useState } from 'react';
import { Calculator, Plane, ArrowRight, ChevronDown, Sparkles, AlertCircle, Database, FileCheck, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateQuote } from '@/lib/pricing-engine';
import { AIRLINES, AIR_DESTINATIONS, SERVICE_TYPES } from '@/lib/pricing-data';
import Flag from '@/components/Flag';
import { cn } from '@/lib/utils';

const MODES = [
  { id: 'air', label: 'Air', icon: Plane, color: 'sky' },
];

export default function QuoteCalculator() {
  const [mode, setMode] = useState('air');

  // Air inputs
  const [airDest, setAirDest] = useState('TPE');
  const [airAirline, setAirAirline] = useState('any');
  const [airService, setAirService] = useState('any');
  const [weight, setWeight] = useState(300);

  const input = useMemo(() => ({
    mode: 'air',
    destination: airDest,
    carrier: airAirline === 'any' ? undefined : airAirline,
    serviceType: airService === 'any' ? undefined : airService,
    weight: Number(weight) || 0,
  }), [airDest, airAirline, airService, weight]);

  const result = useMemo(() => calculateQuote(input), [input]);

  return (
    <div className="space-y-5" data-testid="quote-calculator-page">
      {/* Mode selector */}
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/15 text-[#a8862a] flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0F172A]">Quote Calculation Engine</h3>
              <p className="text-xs text-slate-500">Live preview of how the pricing engine resolves a cost from your matrices</p>
            </div>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100">
            <Database className="h-3 w-3" /> Live engine · `calculateQuote()`
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              data-testid={`calc-mode-${m.id}`}
              onClick={() => setMode(m.id)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3',
                mode === m.id
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 ring-2 ring-[#D4AF37]/20'
                  : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5'
              )}
            >
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', mode === m.id ? 'bg-[#0F172A] text-[#D4AF37]' : 'bg-slate-100 text-slate-600')}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-[#0F172A]">{m.label}</div>
                <div className="text-xs text-slate-500">Matrix-driven</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-5">
        {/* Inputs */}
        <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
          <h3 className="font-bold text-[#0F172A] mb-4">Inputs</h3>

          {mode === 'air' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Destination airport">
                <Select value={airDest} onValueChange={setAirDest}>
                  <SelectTrigger data-testid="calc-air-dest" className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AIR_DESTINATIONS.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        <span className="flex items-center gap-2"><Flag code={d.countryCode} size={16} />{d.city} ({d.code})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Airline (optional)">
                <Select value={airAirline} onValueChange={setAirAirline}>
                  <SelectTrigger data-testid="calc-air-airline" className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any airline (lowest cost)</SelectItem>
                    {AIRLINES.map((a) => <SelectItem key={a.code} value={a.code}>{a.flightCode} · {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Service type">
                <Select value={airService} onValueChange={setAirService}>
                  <SelectTrigger data-testid="calc-air-service" className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any service</SelectItem>
                    {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Weight (kg)">
                <Input data-testid="calc-weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-11 rounded-xl border-slate-200" />
              </Field>
            </div>
          )}

          {/* Input JSON debug */}
          <details className="mt-6 group">
            <summary className="text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer flex items-center gap-1">
              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" /> Engine input payload
            </summary>
            <pre className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto" data-testid="calc-payload-json">
{JSON.stringify(input, null, 2)}
            </pre>
          </details>
        </div>

        {/* Output */}
        <ResultPanel result={result} />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}


function ResultPanel({ result }) {
  return (
    <div className="space-y-4">
      {result?.error || !result?.matrix ? (
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-6 text-center" data-testid="calc-no-result">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <h3 className="mt-3 font-bold text-[#0F172A]">No Matching Matrix</h3>
          <p className="mt-1 text-sm text-slate-600">{result?.error || 'Adjust your inputs to find an applicable rate.'}</p>
        </div>
      ) : (
        <>
          {/* Total cost */}
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1e293b] text-white rounded-xl p-6 relative overflow-hidden" data-testid="calc-result-total">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#D4AF37]/20 blur-3xl" />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Calculated total</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight">${result.totalCost.toFixed(2)}</span>
                <span className="text-sm text-slate-300 font-semibold">{result.currency}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Base freight</div>
                  <div className="font-bold mt-0.5">${result.baseCost.toFixed(2)}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Surcharges</div>
                  <div className="font-bold mt-0.5">${result.totalSurcharges.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Matrix applied */}
          <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><FileCheck className="h-3.5 w-3.5 text-[#D4AF37]" /> Matrix applied</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-[#0F172A] truncate">{result.matrix.name}</div>
                <div className="text-xs text-slate-500 font-mono">{result.matrix.id} · v{result.matrix.version}</div>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-lg gap-1" data-testid="calc-view-matrix">
                <a href={`/admin/pricing/matrix/${result.matrix.id}`}>View <ArrowRight className="h-3 w-3" /></a>
              </Button>
            </div>
            {result.appliedBreak && (
              <div className="mt-3 p-3 rounded-lg bg-slate-50 text-xs">
                <div className="font-bold uppercase tracking-widest text-slate-500 mb-1">Applied break</div>
                <pre className="font-mono text-slate-700 whitespace-pre-wrap">{JSON.stringify(result.appliedBreak, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Cost breakdown</div>
            <div className="mt-2 space-y-1.5">
              {result.breakdown.map((b) => (
                <div key={b.label} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-semibold text-[#0F172A]">{b.label}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{b.formula}</div>
                  </div>
                  <div className="font-bold text-[#0F172A] font-mono">${b.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Surcharges */}
          {result.surcharges?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5 text-amber-500" /> Surcharges applied · {result.surcharges.length}</div>
              <div className="mt-2 space-y-1.5">
                {result.surcharges.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="font-semibold text-[#0F172A]">{s.surchargeName}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.calculationType === 'percentage' ? `${s.value}% of base` : `Flat $${s.value}`} · <span className="font-mono">{s.id}</span>
                      </div>
                    </div>
                    <div className="font-bold text-[#0F172A] font-mono">${s.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {result.alternatives?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> Next best alternatives</div>
              <div className="mt-2 space-y-1.5">
                {result.alternatives.map((a, i) => (
                  <div key={a.matrixId} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="font-semibold text-[#0F172A]">#{i + 2} · {a.providerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{a.matrixId}</div>
                    </div>
                    <div className="font-bold text-slate-600 font-mono">${a.baseCost.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
