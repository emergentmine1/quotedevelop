import { Button } from '@/components/ui/button';

export default function ModeSummaryCard({ label = 'Shipping mode', modeName, modeDescription, modeEta, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
          <div className="mt-1 text-lg font-bold text-[#0B2545]">{modeName || 'Select mode'}</div>
          <div className="mt-1 text-sm text-slate-600">{modeDescription || 'Select a shipping mode to continue.'}</div>
          {modeEta ? <div className="mt-1 text-xs font-semibold text-[#1E6AE1]">{modeEta}</div> : null}
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
