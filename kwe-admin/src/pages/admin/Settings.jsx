import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [form, setForm] = useState({
    brandName: 'KWE',
    supportEmail: 'support@kwe.com',
    timezone: 'Asia/Singapore',
    currency: 'USD',
    notifyBookings: true,
    notifyInvoices: true,
    autoAccept: false,
    twoFactor: true,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => toast.success('Settings saved');

  return (
    <div className="space-y-6" data-testid="admin-settings-page">
      <PageHeader breadcrumb="Admin · Settings" title="System Settings" subtitle="Platform-wide configuration for branding, locale and notifications." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Branding & Locale" subtitle="How KWE appears across the application.">
          <Field label="Brand name">
            <Input data-testid="settings-brand" value={form.brandName} onChange={(e) => set('brandName', e.target.value)} className="h-11 rounded-xl border-slate-200" />
          </Field>
          <Field label="Support email">
            <Input data-testid="settings-email" type="email" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} className="h-11 rounded-xl border-slate-200" />
          </Field>
          <Field label="Timezone">
            <Select value={form.timezone} onValueChange={(v) => set('timezone', v)}>
              <SelectTrigger data-testid="settings-tz" className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'America/Los_Angeles', 'America/New_York', 'UTC'].map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default currency">
            <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger data-testid="settings-currency" className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['USD', 'EUR', 'JPY', 'SGD', 'GBP', 'CNY'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Notifications" subtitle="Control transactional alerts for the team.">
          <ToggleRow label="Booking confirmations" value={form.notifyBookings} onChange={(v) => set('notifyBookings', v)} testId="toggle-bookings" />
          <ToggleRow label="Invoice updates" value={form.notifyInvoices} onChange={(v) => set('notifyInvoices', v)} testId="toggle-invoices" />
          <ToggleRow label="Auto-accept provider quotes below threshold" value={form.autoAccept} onChange={(v) => set('autoAccept', v)} testId="toggle-auto" />
        </Section>

        <Section title="Security" subtitle="Account safety and access policies.">
          <ToggleRow label="Require two-factor authentication" value={form.twoFactor} onChange={(v) => set('twoFactor', v)} testId="toggle-2fa" />
          <ToggleRow label="Session expiry after 30 days" value={true} onChange={() => {}} testId="toggle-session" />
        </Section>

        <Section title="Network" subtitle="Provider onboarding and review standards.">
          <ToggleRow label="Manual provider approval" value={true} onChange={() => {}} testId="toggle-approval" />
          <ToggleRow label="Show trust score publicly" value={true} onChange={() => {}} testId="toggle-score" />
        </Section>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} data-testid="settings-save" className="h-11 px-6 rounded-xl bg-[#0F172A] hover:bg-[#1e293b] text-white font-semibold">Save changes</Button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6 space-y-5">
      <div>
        <h3 className="font-bold text-[#0F172A]">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ToggleRow({ label, value, onChange, testId }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm font-semibold text-[#0F172A]">{label}</span>
      <Switch data-testid={testId} checked={value} onCheckedChange={onChange} />
    </div>
  );
}
