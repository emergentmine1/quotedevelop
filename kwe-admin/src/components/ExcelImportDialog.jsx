import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { parseXlsxFile, downloadXlsx, templateColumns } from '@/lib/xlsx';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ExcelImportDialog({ open, onOpenChange, matrixType, onConfirm }) {
  const inputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [filename, setFilename] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setRows([]); setFilename(''); setError(''); };

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError('Please pick a .xlsx, .xls or .csv file');
      return;
    }
    try {
      const { rows: parsed } = await parseXlsxFile(file);
      if (!parsed.length) {
        setError('That sheet appears to be empty.');
        return;
      }
      setRows(parsed);
      setFilename(file.name);
    } catch (e) {
      setError(e.message || 'Failed to parse file');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

   const downloadTemplate = async () => {
     const cols = templateColumns(matrixType);
     const sample = [Object.fromEntries(cols.map((c) => [c, '']))];
     await downloadXlsx(`kwe-${matrixType}-import-template`, sample, { sheetName: `${matrixType.toUpperCase()} template`, columns: cols });
     toast.success('Template downloaded');
   };

  const confirm = () => {
    onConfirm?.(rows);
    toast.success(`${rows.length} rows queued for import`);
    onOpenChange(false);
    reset();
  };

  const previewRows = rows.slice(0, 6);
  const previewCols = previewRows[0] ? Object.keys(previewRows[0]).slice(0, 8) : [];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F172A]">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Import {matrixType?.toUpperCase()} matrices
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV file. The first row must contain column headers matching the template.
          </DialogDescription>
        </DialogHeader>

        {!rows.length ? (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                dragging ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
              )}
              data-testid="xlsx-drop-zone"
            >
              <Upload className="h-10 w-10 text-slate-400 mx-auto" />
              <div className="font-bold text-[#0F172A] mt-3">Drop your file here</div>
              <div className="text-xs text-slate-500 mt-1">or click to browse · .xlsx, .xls, .csv up to 10MB</div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
                data-testid="xlsx-file-input"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm" data-testid="xlsx-error">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-xs text-slate-600">
              <span>Need a starting point?</span>
              <button onClick={downloadTemplate} data-testid="xlsx-template-btn" className="inline-flex items-center gap-1 font-semibold text-[#D4AF37] hover:underline">
                <Download className="h-3 w-3" /> Download template
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/60">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> {filename}
                <span className="text-xs font-normal text-emerald-700">({rows.length} rows)</span>
              </div>
              <button onClick={reset} className="h-7 w-7 rounded-md hover:bg-white flex items-center justify-center text-slate-500" data-testid="xlsx-clear">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {previewCols.map((c) => (
                      <th key={c} className="text-left font-semibold uppercase tracking-widest text-[10px] text-slate-500 px-3 py-2">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((r, i) => (
                    <tr key={i}>
                      {previewCols.map((c) => (
                        <td key={c} className="px-3 py-2 font-mono text-slate-700 truncate max-w-[120px]">{String(r[c] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[11px] text-slate-500 text-center">
              Showing first {previewRows.length} of {rows.length} rows
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          {rows.length > 0 && (
            <Button onClick={confirm} className="rounded-xl bg-[#0F172A] hover:bg-[#1e293b] text-white" data-testid="xlsx-confirm">
              Import {rows.length} rows
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
