import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, AlertCircle, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIES, categoryOfChargeCode, calcMethod } from '@/lib/rate-profiles/constants';
import { profileSchema } from '@/lib/rate-profiles/validation';
import { getProfile, saveProfile, ProfileConflictError } from '@/lib/rate-profiles/store';
import { ProfileHeaderFields } from '@/components/rates/ProfileHeaderFields';
import { RateMatrixEditor } from '@/components/rates/RateMatrixEditor';

const today = () => new Date().toISOString().slice(0, 10);
const yearLater = () => new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

function blank(category) {
  return {
    chargeCode: CATEGORIES[category].chargeCodes[0].code,
    carrierCode: '', transportMode: 'AIR', serviceType: 'Regular', originPort: '',
    calculationMethod: 'FLAT_WEIGHT', currencyCode: 'USD',
    effectiveDate: today(), expirationDate: yearLater(),
    externalMarkup: '', internalMarkup: '', status: 'DRAFT', remarks: '',
    weightBreaks: [{ label: '>=45' }, { label: '>=100' }, { label: '>=300' }],
    rows: [{ destPort: '', flatAmount: 0, minAmount: '', maxAmount: '', rates: [0, 0, 0] }],
  };
}

const toForm = (p) => ({
  ...p,
  externalMarkup: p.externalMarkup ?? '',
  internalMarkup: p.internalMarkup ?? '',
  remarks: p.remarks || '',
  weightBreaks: (p.weightBreaks || []).map((label) => ({ label })),
  rows: (p.rows || []).map((r) => ({ ...r, minAmount: r.minAmount ?? '', maxAmount: r.maxAmount ?? '', rates: [...(r.rates || [])] })),
});

const toProfile = (d, category, base) => {
  const m = calcMethod(d.calculationMethod);
  return {
  ...(base ? { id: base.id, version: base.version } : {}),
  category,
  chargeCode: d.chargeCode, carrierCode: d.carrierCode, transportMode: d.transportMode,
  serviceType: d.serviceType, originPort: d.originPort, calculationMethod: d.calculationMethod,
  currencyCode: d.currencyCode, effectiveDate: d.effectiveDate, expirationDate: d.expirationDate,
  externalMarkup: d.externalMarkup, internalMarkup: d.internalMarkup, status: d.status, remarks: d.remarks || '',
  weightBreaks: m.weight ? d.weightBreaks.map((w) => w.label) : [],
  rows: d.rows.map((r) => ({
    destPort: r.destPort,
    flatAmount: m.flat ? r.flatAmount : undefined,
    minAmount: m.weight ? r.minAmount : undefined,
    maxAmount: m.weight ? r.maxAmount : undefined,
    rates: m.weight ? r.rates : [],
  })),
  };
};

export default function RateProfileForm() {
  const { id, category: routeCategory } = useParams();
  const [params] = useSearchParams();
  const cloneFrom = params.get('cloneFrom');
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(id || cloneFrom ? null : { category: routeCategory, base: null, values: blank(routeCategory) });

  useEffect(() => {
    const sourceId = id || cloneFrom;
    if (!sourceId) return;
    getProfile(sourceId).then((p) => {
      if (!p) { toast.error('Rate profile not found'); navigate('/admin/pricing'); return; }
      const category = id ? p.category : routeCategory || categoryOfChargeCode(p.chargeCode) || p.category;
      // Clone: same data, but a brand-new Draft profile until the user saves it.
      setLoaded({ category, base: id ? p : null, values: id ? toForm(p) : { ...toForm(p), status: 'DRAFT' } });
    });
  }, [id, cloneFrom, routeCategory, navigate]);

  if (!loaded || !CATEGORIES[loaded.category]) return <div className="py-24 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>;
  return <ProfileEditor key={`${loaded.category}-${id || cloneFrom || 'new'}`} {...loaded} cloned={!!cloneFrom && !id} />;
}

function ProfileEditor({ category, base, values, cloned }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conflict, setConflict] = useState('');
  const form = useForm({ resolver: zodResolver(profileSchema(category)), defaultValues: values, mode: 'onBlur' });
  const meta = CATEGORIES[category];

  const onSubmit = async (d) => {
    setConflict('');
    try {
      const saved = await saveProfile(toProfile(d, category, base), user.email);
      toast.success(base ? `${saved.profileCode} updated` : `${saved.profileCode} created`);
      navigate(`/admin/pricing/profile/${saved.id}`, { replace: true });
    } catch (e) {
      if (e instanceof ProfileConflictError) {
        setConflict(e.message);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else toast.error(e.message || 'Save failed');
    }
  };

  const title = base ? `Edit · ${base.profileCode}` : cloned ? `New ${meta.label} Profile (clone)` : `New ${meta.label} Profile`;
  return (
    <div className="space-y-6" data-testid="rate-profile-form">
      <PageHeader
        breadcrumb={`Rate Management · ${meta.label}`}
        title={title}
        subtitle={base ? `Version v${base.version} · saving creates v${base.version + 1}` : cloned ? 'Pre-filled from an existing profile. Nothing is created until you save.' : 'Create a new Rate Profile from scratch'}
        action={<Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl h-10 gap-1.5" data-testid="form-cancel"><ArrowLeft className="h-4 w-4" /> Cancel</Button>}
      />
      {cloned && (
        <div data-testid="clone-banner" className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 flex items-center gap-2">
          <Copy className="h-4 w-4" /> Cloned values loaded. Status was reset to Draft — review and save to create the new profile.
        </div>
      )}
      {conflict && (
        <div data-testid="form-conflict-error" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {conflict}
        </div>
      )}
      <ErrorSummary errors={form.formState.errors} />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <ProfileHeaderFields form={form} category={category} />
        <RateMatrixEditor form={form} />
        <div className="sticky bottom-0 bg-white border-t border-slate-100 -mx-4 px-4 py-4 lg:mx-0 lg:rounded-2xl lg:border lg:kwe-shadow flex items-center justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting} data-testid="form-save" className="rounded-xl h-11 bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold gap-1.5">
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {base ? 'Save Changes' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function collect(err, path = '', out = []) {
  if (!err || typeof err !== 'object') return out;
  if (typeof err.message === 'string' && err.message) { out.push(err.message); return out; }
  for (const [k, v] of Object.entries(err)) if (k !== 'ref') collect(v, `${path}.${k}`, out);
  return out;
}

function ErrorSummary({ errors }) {
  const msgs = [...new Set(collect(errors))];
  if (!msgs.length) return null;
  return (
    <div data-testid="form-error-summary" className="rounded-xl border border-red-200 bg-red-50/60 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-red-700"><AlertCircle className="h-4 w-4" /> {msgs.length} validation issue{msgs.length !== 1 ? 's' : ''}</div>
      <ul className="mt-2 text-xs text-red-700 space-y-0.5 list-disc list-inside">{msgs.slice(0, 8).map((m) => <li key={m}>{m}</li>)}</ul>
    </div>
  );
}
