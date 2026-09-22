import { Star, Plane, Ship, Truck, Clock, Leaf, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const MODE_ICONS = { air: Plane, ocean: Ship, road: Truck };

export default function QuoteCard({ quote, selected, onSelect, onCompare, comparing }) {
  const navigate = useNavigate();
  const ModeIcon = MODE_ICONS[quote.mode] || Ship;

  return (
    <div
      data-testid={`quote-card-${quote.id}`}
      className={cn(
        'group relative bg-white rounded-xl border p-5 md:p-6 transition-all duration-200 hover:-translate-y-1 kwe-shadow hover:kwe-shadow-md',
        selected ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30' : 'border-slate-100'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        {/* Provider */}
        <div className="lg:w-56 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-xs font-black text-white shrink-0">
            {quote.providerCode}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-[#0F172A] truncate">{quote.providerName}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
              <span className="text-xs font-semibold text-slate-700">{quote.providerReliability}</span>
              <span className="text-[11px] text-slate-400">·</span>
              <span className="text-[11px] text-slate-500">{quote.serviceType}</span>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{quote.originCode}</div>
            <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{quote.origin.split(',')[0]}</div>
          </div>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex-1 h-px bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 relative">
              <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2">
                <ModeIcon className="h-4 w-4 text-[#D4AF37]" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{quote.destinationCode}</div>
            <div className="text-sm font-semibold text-[#0F172A] mt-0.5">{quote.destination.split(',')[0]}</div>
          </div>
        </div>

        {/* Meta */}
        <div className="lg:w-44 grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold">{quote.transitDays} days transit</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Leaf className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold">{quote.co2Kg} kg CO₂</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="lg:w-48 flex items-center justify-between lg:flex-col lg:items-end gap-3">
          <div className="lg:text-right">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">All-in</div>
            <div className="text-2xl font-black tracking-tight text-[#0F172A]">${quote.price.toLocaleString()}</div>
          </div>
          <Button
            data-testid={`book-quote-${quote.id}`}
            onClick={() => navigate(`/bookings/new?quoteId=${quote.id}`)}
            className="bg-[#D4AF37] hover:bg-[#c19f2d] hover:brightness-110 text-[#0F172A] font-semibold gap-1 active:scale-95 transition-all"
          >
            Book Now <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {quote.features.map((f) => (
            <span key={f} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
              {f}
            </span>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <Checkbox
            data-testid={`compare-${quote.id}`}
            checked={comparing}
            onCheckedChange={() => onCompare?.(quote)}
          />
          Add to compare
        </label>
      </div>
    </div>
  );
}
