import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Check, X as XIcon, ArrowLeft, Star, Plane, Ship, Truck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { quotes as allQuotes } from '@/lib/mock-data';

const MODE_ICONS = { air: Plane, ocean: Ship, road: Truck };

const ROW_FEATURES = ['Door-to-door', 'Insurance included', 'Customs clearance', 'Real-time tracking'];

export default function QuoteComparison() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const quotes = (state?.quotes && state.quotes.length > 0 ? state.quotes : allQuotes.slice(0, 3));

  return (
    <div className="space-y-6" data-testid="quote-comparison-page">
      <PageHeader
        breadcrumb="Quotes · Compare"
        title="Side-by-side comparison."
        subtitle={`Comparing ${quotes.length} of up to 4 carriers — pick the right blend of speed, cost, and trust.`}
        action={
          <Button variant="outline" onClick={() => navigate('/quotes/results')} className="rounded-xl h-10 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to results
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="w-44 text-left p-6 align-top bg-slate-50 sticky left-0">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Comparing</div>
                <div className="font-bold text-[#0F172A] mt-1">{quotes.length} carriers</div>
              </th>
              {quotes.map((q) => {
                const ModeIcon = MODE_ICONS[q.mode] || Ship;
                return (
                  <th key={q.id} className="p-6 align-top text-left border-l border-slate-100">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-xs font-black text-white">
                      {q.providerCode}
                    </div>
                    <div className="mt-3 font-bold text-[#0F172A]">{q.providerName}</div>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
                      <span className="font-semibold text-slate-700">{q.providerReliability}/5</span>
                      <span className="text-slate-400">·</span>
                      <ModeIcon className="h-3.5 w-3.5 text-slate-500" />
                      <span className="capitalize text-slate-500">{q.mode}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="text-sm">
            <CompareRow label="Total price">
              {quotes.map((q) => (
                <td key={q.id} className="p-5 border-t border-l border-slate-100">
                  <div className="text-2xl font-black tracking-tight text-[#0F172A]">${q.price.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">all-in · {q.currency}</div>
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Transit time">
              {quotes.map((q) => (
                <td key={q.id} className="p-5 border-t border-l border-slate-100">
                  <span className="font-bold text-[#0F172A]">{q.transitDays} days</span>
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Service type">
              {quotes.map((q) => (
                <td key={q.id} className="p-5 border-t border-l border-slate-100 text-slate-700 font-medium">{q.serviceType}</td>
              ))}
            </CompareRow>

            <CompareRow label="Incoterm">
              {quotes.map((q) => (
                <td key={q.id} className="p-5 border-t border-l border-slate-100 text-slate-700 font-medium">{q.incoterm}</td>
              ))}
            </CompareRow>

            <CompareRow label="Reliability">
              {quotes.map((q) => (
                <td key={q.id} className="p-5 border-t border-l border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full gold-bg" style={{ width: `${(q.providerReliability / 5) * 100}%` }} />
                    </div>
                    <span className="font-bold text-[#0F172A] text-xs">{q.providerReliability}</span>
                  </div>
                </td>
              ))}
            </CompareRow>

            <CompareRow label="CO₂ emissions">
              {quotes.map((q) => (
                <td key={q.id} className="p-5 border-t border-l border-slate-100 text-slate-700 font-medium">{q.co2Kg} kg</td>
              ))}
            </CompareRow>

            {ROW_FEATURES.map((f) => (
              <CompareRow key={f} label={f}>
                {quotes.map((q) => (
                  <td key={q.id} className="p-5 border-t border-l border-slate-100">
                    {q.features.includes(f) ? (
                      <span className="inline-flex h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex h-7 w-7 rounded-full bg-slate-50 text-slate-300 items-center justify-center">
                        <XIcon className="h-4 w-4" />
                      </span>
                    )}
                  </td>
                ))}
              </CompareRow>
            ))}

            <tr>
              <td className="p-5 bg-slate-50 sticky left-0"></td>
              {quotes.map((q) => (
                <td key={q.id} className="p-5 border-t border-l border-slate-100">
                  <Button asChild className="w-full bg-[#D4AF37] hover:bg-[#c19f2d] hover:brightness-110 text-[#0F172A] font-semibold rounded-xl">
                    <Link to={`/bookings/new?quoteId=${q.id}`} data-testid={`select-${q.id}`}>Select & Book</Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({ label, children }) {
  return (
    <tr>
      <th className="text-left p-5 align-top bg-slate-50 sticky left-0 text-xs font-semibold uppercase tracking-widest text-slate-500 border-t border-slate-100">
        {label}
      </th>
      {children}
    </tr>
  );
}
