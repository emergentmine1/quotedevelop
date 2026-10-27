import { Controller, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DEST_PORTS, calcMethod } from '@/lib/rate-profiles/constants';
import { sanitizeWeightBreak } from '@/lib/rate-profiles/validation';
import { Section, blockNegative } from '@/components/rates/ProfileHeaderFields';

const ALLOWED_KEYS = /^[0-9<>=]$/;
const NAV_KEYS = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'];

// Weight-break header: blocks every key except 0-9 < > =, and strips anything pasted.
function WeightBreakInput({ field, testId }) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      value={field.value ?? ''}
      onKeyDown={(e) => {
        if (e.ctrlKey || e.metaKey || NAV_KEYS.includes(e.key)) return;
        if (!ALLOWED_KEYS.test(e.key)) e.preventDefault();
      }}
      onChange={(e) => field.onChange(sanitizeWeightBreak(e.target.value))}
      onBlur={field.onBlur}
      placeholder=">=45"
      maxLength={8}
      className="h-10 w-full rounded-lg border-slate-200 pr-8 font-semibold"
      data-testid={testId}
    />
  );
}

export function RateMatrixEditor({ form }) {
  const { control, register, watch, getValues, setValue, formState: { errors } } = form;
  const breaks = useFieldArray({ control, name: 'weightBreaks' });
  const rows = useFieldArray({ control, name: 'rows' });
  const m = calcMethod(watch('calculationMethod'));
  const used = (watch('rows') || []).map((r) => r.destPort);

  const setRates = (fn) => (getValues('rows') || []).forEach((r, i) => setValue(`rows.${i}.rates`, fn([...(r.rates || [])]), { shouldDirty: true }));
  const addBreak = () => {
    const last = getValues('weightBreaks').at(-1)?.label || '';
    const n = Number(last.replace(/\D/g, '')) || 0;
    breaks.append({ label: `>=${n ? n + 100 : 45}` });
    setRates((r) => [...r, 0]);
  };
  const removeBreak = (i) => { breaks.remove(i); setRates((r) => { r.splice(i, 1); return r; }); };
  const addRow = () => rows.append({ destPort: '', flatAmount: 0, minAmount: '', maxAmount: '', rates: breaks.fields.map(() => 0) });

  const rowErr = (i) => {
    const e = errors.rows?.[i];
    return e && (e.destPort?.message || e.maxAmount?.message || e.minAmount?.message || e.flatAmount?.message || e.rates?.find?.((x) => x)?.message);
  };

  return (
    <Section title="Rate Matrix" subtitle="Horizontal axis is weight breaks and vertical axis is destination port">
      <div className="overflow-x-auto">
        <table className={cn('w-full text-sm table-fixed', m.weight ? 'min-w-[980px]' : 'min-w-[520px]')} data-testid="rate-matrix-editor">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              <th className="text-left pb-2 px-2 w-48">Dest Port</th>
              {m.flat && <th className="text-left pb-2 px-2 w-32">Flat Amount</th>}
              {m.weight && <th className="text-left pb-2 px-2 w-24">Min.</th>}
              {m.weight && <th className="text-left pb-2 px-2 w-24">Max.</th>}
              {m.weight && breaks.fields.map((f, c) => (
                <th key={f.id} className="text-left pb-2 px-2 w-[150px]">
                  <div className="relative">
                    <Controller control={control} name={`weightBreaks.${c}.label`} render={({ field }) => <WeightBreakInput field={field} testId={`weight-break-${c}`} />} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeBreak(c)} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-red-500" data-testid={`remove-weight-break-${c}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </th>
              ))}
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {rows.fields.map((f, r) => (
              <tr key={f.id}>
                <td className="px-2 py-1">
                  <Controller control={control} name={`rows.${r}.destPort`} render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className={cn('h-10 rounded-lg border-slate-200', errors.rows?.[r]?.destPort && 'border-red-400')} data-testid={`dest-port-${r}`}><SelectValue placeholder="Select port" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {DEST_PORTS.map((d) => (
                          <SelectItem key={d.code} value={d.code} disabled={d.code !== field.value && used.includes(d.code)}>{`${d.name} (${d.code})`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </td>
                {m.flat && <td className="px-2 py-1"><Input type="number" step="0.01" {...blockNegative} {...register(`rows.${r}.flatAmount`)} className="h-10 rounded-lg border-slate-200" data-testid={`flat-amount-${r}`} /></td>}
                {m.weight && <td className="px-2 py-1"><Input type="number" step="any" {...blockNegative} {...register(`rows.${r}.minAmount`)} className="h-10 rounded-lg border-slate-200" data-testid={`row-min-${r}`} /></td>}
                {m.weight && <td className="px-2 py-1"><Input type="number" step="any" {...blockNegative} {...register(`rows.${r}.maxAmount`)} className={cn('h-10 rounded-lg border-slate-200', errors.rows?.[r]?.maxAmount && 'border-red-400')} data-testid={`row-max-${r}`} /></td>}
                {m.weight && breaks.fields.map((b, c) => (
                  <td key={b.id} className="px-2 py-1"><Input type="number" step="0.01" {...blockNegative} {...register(`rows.${r}.rates.${c}`)} className="h-10 rounded-lg border-slate-200" data-testid={`rate-${r}-${c}`} /></td>
                ))}
                <td className="px-2 py-1">
                  <Button type="button" variant="ghost" size="sm" disabled={rows.fields.length <= 1} onClick={() => rows.remove(r)} className="h-10 w-10 p-0 text-red-500" data-testid={`remove-dest-row-${r}`}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {m.weight && <Button type="button" variant="outline" onClick={addBreak} className="rounded-xl gap-1.5" data-testid="add-weight-break"><Plus className="h-4 w-4" /> Add Weight Break Column</Button>}
        <Button type="button" variant="outline" onClick={addRow} disabled={rows.fields.length >= DEST_PORTS.length} className="rounded-xl gap-1.5" data-testid="add-dest-row"><Plus className="h-4 w-4" /> Add Destination Row</Button>
      </div>
      {(errors.weightBreaks?.message || errors.weightBreaks?.root?.message || errors.rows?.message) && (
        <p data-testid="matrix-error" className="text-xs text-red-600 mt-2">{errors.weightBreaks?.message || errors.weightBreaks?.root?.message || errors.rows?.message}</p>
      )}
      {rows.fields.map((f, r) => rowErr(r) && <p key={f.id} data-testid={`row-error-${r}`} className="text-xs text-red-600 mt-1">Row {r + 1}: {rowErr(r)}</p>)}
    </Section>
  );
}
