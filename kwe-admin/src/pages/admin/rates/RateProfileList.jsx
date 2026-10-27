import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Upload, Download, FileSpreadsheet, Filter, Plane, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { downloadCsv } from '@/lib/csv';
import { downloadXlsx } from '@/lib/xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIES } from '@/lib/rate-profiles/constants';
import { listProfiles, changeStatus, deleteProfile, ProfileConflictError } from '@/lib/rate-profiles/store';
import { ConfirmProfileAction } from '@/components/rates/ConfirmProfileAction';
import { ProfileFilters, EMPTY_PROFILE_FILTERS, applyProfileFilters } from '@/components/rates/ProfileFilters';
import { ProfileTable, exportRows } from '@/components/rates/ProfileTable';

export default function RateProfileList() {
  const { category } = useParams();
  const meta = CATEGORIES[category];
  const navigate = useNavigate();
  const { user } = useAuth();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_PROFILE_FILTERS);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFilters(EMPTY_PROFILE_FILTERS);
    listProfiles(category)
      .then((items) => alive && setAll(items))
      .catch((e) => toast.error(e.message || 'Could not load rate profiles'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [category]);

  const list = useMemo(() => applyProfileFilters(all, filters), [all, filters]);

  const runAction = async ({ action, profile }) => {
    if (action === 'delete') {
      try {
        await deleteProfile(profile.id);
        setAll((cur) => cur.filter((x) => x.id !== profile.id));
        toast.success(`${profile.profileCode} deleted`);
      } catch (e) {
        toast.error(e.message || 'Delete failed');
      }
    } else {
      await toggleStatus(profile);
    }
    setPending(null);
  };

  const toggleStatus = async (p) => {
    const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const saved = await changeStatus(p, next, user.email);
      setAll((cur) => [saved, ...cur.filter((x) => x.id !== saved.id)]);
      toast.success(`${p.profileCode} ${next === 'ACTIVE' ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error(e instanceof ProfileConflictError ? e.message : e.message || 'Status change failed', { duration: 8000 });
    }
  };

  const fileName = `kwe-rate-profiles-${category}`;
  const Icon = category === 'freight' ? Plane : Building2;

  return (
    <div className="space-y-5" data-testid={`rate-profile-list-${category}`}>
      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center"><Icon className="h-5 w-5" /></div>
            <div>
              <h3 className="font-bold text-[#0F172A]">{meta.label} Rate Profiles</h3>
              <p data-testid="profile-count" className="text-xs text-slate-500">
                {list.length} of {all.length} profiles · {meta.description} · sorted by last modified
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled title="Import from file — coming soon" className="rounded-xl h-10 gap-1.5" data-testid="profile-import">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!list.length} className="rounded-xl h-10 gap-1.5" data-testid="profile-export"><Download className="h-4 w-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="profile-export-xlsx" onClick={async () => { await downloadXlsx(fileName, exportRows(list), { sheetName: meta.label }); toast.success(`${list.length} profiles exported`); }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" /> Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="profile-export-csv" onClick={() => { downloadCsv(fileName, exportRows(list)); toast.success(`${list.length} profiles exported`); }}>
                  <Download className="h-4 w-4 mr-2" /> Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild className="rounded-xl h-10 bg-[#0F172A] hover:bg-[#1e293b] text-white gap-1.5" data-testid="profile-new">
              <Link to={`/admin/pricing/${category}/new`}><Plus className="h-4 w-4" /> New Matrix</Link>
            </Button>
          </div>
        </div>
        <ProfileFilters category={category} filters={filters} onChange={setFilters} profiles={all} />
        {JSON.stringify(filters) !== JSON.stringify(EMPTY_PROFILE_FILTERS) && (
          <button onClick={() => setFilters(EMPTY_PROFILE_FILTERS)} data-testid="profile-reset-filters" className="mt-3 text-xs font-semibold text-slate-500 hover:text-[#D4AF37] inline-flex items-center gap-1">
            <Filter className="h-3 w-3" /> Reset filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : (
        <ProfileTable
          list={list}
          onView={(p) => navigate(`/admin/pricing/profile/${p.id}`)}
          onClone={(p) => navigate(`/admin/pricing/${category}/new?cloneFrom=${p.id}`)}
          onToggleStatus={(p) => (p.status === 'ACTIVE' ? setPending({ action: 'deactivate', profile: p }) : toggleStatus(p))}
          onDelete={(p) => setPending({ action: 'delete', profile: p })}
        />
      )}
      <ConfirmProfileAction pending={pending} onCancel={() => setPending(null)} onConfirm={runAction} />
    </div>
  );
}
