import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CITY_ZIP_SUGGESTIONS, formatCityZipSuggestion } from '@/lib/city-zip-suggestions';

export default function CityZipAutocomplete({
  value,
  onChange,
  onSelect,
  countryCode,
  placeholder = 'Type city or zip code',
  testId,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(value || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value || '');
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const suggestions = useMemo(() => {
    const base = countryCode
      ? CITY_ZIP_SUGGESTIONS.filter((item) => item.countryCode === countryCode)
      : CITY_ZIP_SUGGESTIONS;

    const q = (debouncedQuery || '').trim().toLowerCase();
    if (!q) return base.slice(0, 8);

    return base.filter((item) => {
      const cityMatch = item.city.toLowerCase().includes(q);
      const stateMatch = item.state.toLowerCase().includes(q);
      const zipMatch = item.zipCode.startsWith(q);
      return cityMatch || stateMatch || zipMatch;
    }).slice(0, 8);
  }, [debouncedQuery, countryCode]);

  return (
    <div className={cn('relative', className)}>
      <Input
        data-testid={testId}
        value={value || ''}
        onChange={(event) => {
          onChange?.(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay close so click on a suggestion can be captured.
          setTimeout(() => setIsOpen(false), 120);
        }}
        placeholder={placeholder}
        className="h-12 rounded-xl border-slate-200"
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {suggestions.map((item) => {
            const label = formatCityZipSuggestion(item);
            return (
              <button
                key={`${item.city}-${item.state}-${item.zipCode}`}
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange?.(label);
                  onSelect?.(item);
                  setIsOpen(false);
                }}
              >
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

