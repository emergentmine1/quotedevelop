import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ArrowDownUp, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import QuoteCard from '@/components/QuoteCard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { quotes, providers } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function QuoteResults() {
  const [priceRange, setPriceRange] = useState([500, 10000]);
  const [transit, setTransit] = useState([1, 45]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [minReliability, setMinReliability] = useState(0);
  const [sort, setSort] = useState('price-asc');
  const [comparing, setComparing] = useState([]);
  const navigate = useNavigate();

  const toggleProvider = (id) => {
    setSelectedProviders((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const toggleCompare = (quote) => {
    setComparing((arr) => {
      if (arr.find((q) => q.id === quote.id)) return arr.filter((q) => q.id !== quote.id);
      if (arr.length >= 4) {
        toast.error('You can compare up to 4 quotes');
        return arr;
      }
      return [...arr, quote];
    });
  };

  const filtered = useMemo(() => {
    let list = quotes.filter(
      (q) =>
        q.price >= priceRange[0] &&
        q.price <= priceRange[1] &&
        q.transitDays >= transit[0] &&
        q.transitDays <= transit[1] &&
        q.providerReliability >= minReliability &&
        (selectedProviders.length === 0 || selectedProviders.includes(q.providerId))
    );
    switch (sort) {
      case 'price-asc': list = list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = list.sort((a, b) => b.price - a.price); break;
      case 'transit-asc': list = list.sort((a, b) => a.transitDays - b.transitDays); break;
      case 'reliability-desc': list = list.sort((a, b) => b.providerReliability - a.providerReliability); break;
      default: break;
    }
    return list.slice(0, 30);
  }, [priceRange, transit, selectedProviders, minReliability, sort]);

  const goCompare = () => {
    if (comparing.length < 2) {
      toast.error('Pick at least 2 quotes to compare');
      return;
    }
    navigate('/quotes/compare', { state: { quotes: comparing } });
  };

  return (
    <div className="space-y-6" data-testid="quote-results-page">
      <PageHeader
        breadcrumb="Quotes · Results"
        title={`${filtered.length} quotes available.`}
        subtitle="Shanghai (CNSHA) → Los Angeles (USLAX) · 40ft Standard · 2,500 kg"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-slate-500" />
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger data-testid="sort-select" className="h-10 w-48 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Lowest price</SelectItem>
                  <SelectItem value="price-desc">Highest price</SelectItem>
                  <SelectItem value="transit-asc">Fastest transit</SelectItem>
                  <SelectItem value="reliability-desc">Highest reliability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {comparing.length > 0 && (
              <Button
                data-testid="open-compare-button"
                onClick={goCompare}
                className="h-10 px-4 bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold rounded-xl"
              >
                Compare ({comparing.length})
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Filters */}
        <aside className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5 h-fit lg:sticky lg:top-20">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="font-bold text-[#0F172A]">Filters</h3>
            {(selectedProviders.length > 0 || minReliability > 0) && (
              <button
                onClick={() => {
                  setSelectedProviders([]);
                  setMinReliability(0);
                  setPriceRange([500, 10000]);
                  setTransit([1, 45]);
                }}
                className="ml-auto text-xs text-slate-500 hover:text-[#D4AF37] flex items-center gap-1"
                data-testid="clear-filters-btn"
              >
                <X className="h-3 w-3" /> Reset
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Price range</Label>
                <span className="text-xs font-mono text-slate-700">${priceRange[0]}–${priceRange[1]}</span>
              </div>
              <Slider data-testid="price-slider" min={500} max={10000} step={100} value={priceRange} onValueChange={setPriceRange} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">Transit (days)</Label>
                <span className="text-xs font-mono text-slate-700">{transit[0]}–{transit[1]}d</span>
              </div>
              <Slider min={1} max={45} step={1} value={transit} onValueChange={setTransit} />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2 block">Carriers</Label>
              <div className="space-y-2">
                {providers.map((p) => (
                  <label key={p.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                    <Checkbox
                      data-testid={`provider-filter-${p.code}`}
                      checked={selectedProviders.includes(p.id)}
                      onCheckedChange={() => toggleProvider(p.id)}
                    />
                    <span className="text-slate-700">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-2 block">Min reliability</Label>
              <div className="flex gap-1">
                {[0, 4.0, 4.5, 4.7, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinReliability(r)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                      minReliability === r ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r === 0 ? 'Any' : `${r}+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-500">
              No quotes match your filters. Try widening the range.
            </div>
          ) : (
            filtered.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                comparing={!!comparing.find((c) => c.id === q.id)}
                onCompare={toggleCompare}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
