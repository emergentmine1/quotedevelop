import { Button } from '@/components/ui/button';

export default function CargoSummaryCard({ label = 'Cargo type', cargoName, cargoDescription, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
          <div className="mt-1 text-lg font-bold text-[#0B2545]">{cargoName || 'Select cargo type'}</div>
          <div className="mt-1 text-sm text-slate-600">{cargoDescription || 'Select a cargo type to continue.'}</div>
        </div>
        {onChange ? (
          <Button type="button" variant="outline" className="h-9 rounded-xl px-3" onClick={onChange}>
            Change
          </Button>
        ) : null}
      </div>
    </div>
  );
}
