import PageHeader from '@/components/PageHeader';
import { Check, X } from 'lucide-react';

const ROLES = [
  {
    name: 'Customer',
    description: 'Shippers searching and booking freight on KWE.',
    color: 'bg-blue-50 text-blue-700',
    count: 142,
    permissions: { 'View Quotes': true, 'Create Booking': true, 'View Shipments': true, 'Manage Rates': false, 'Approve Providers': false, 'Audit Logs': false, 'User Management': false },
  },
  {
    name: 'Provider',
    description: 'Carriers managing rates, routes and booking requests.',
    color: 'bg-amber-50 text-amber-700',
    count: 60,
    permissions: { 'View Quotes': true, 'Create Booking': false, 'View Shipments': true, 'Manage Rates': true, 'Approve Providers': false, 'Audit Logs': false, 'User Management': false },
  },
  {
    name: 'Admin',
    description: 'Platform operators with full system access.',
    color: 'bg-slate-100 text-slate-700',
    count: 8,
    permissions: { 'View Quotes': true, 'Create Booking': true, 'View Shipments': true, 'Manage Rates': true, 'Approve Providers': true, 'Audit Logs': true, 'User Management': true },
  },
];

const ALL_PERMS = ['View Quotes', 'Create Booking', 'View Shipments', 'Manage Rates', 'Approve Providers', 'Audit Logs', 'User Management'];

export default function RolesPermissions() {
  return (
    <div className="space-y-6" data-testid="roles-permissions-page">
      <PageHeader breadcrumb="Admin · Access" title="Roles & Permissions" subtitle="Configure what each role on the platform can access and do." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {ROLES.map((r) => (
          <div key={r.name} data-testid={`role-card-${r.name}`} className="bg-white rounded-xl border border-slate-100 kwe-shadow p-6">
            <div className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-widest ${r.color}`}>{r.name}</div>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-[#0F172A]">{r.count} users</h3>
            <p className="text-sm text-slate-500 mt-1">{r.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <th className="text-left py-3 px-6">Permission</th>
              {ROLES.map((r) => <th key={r.name} className="text-center py-3 px-6">{r.name}</th>)}
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {ALL_PERMS.map((perm) => (
              <tr key={perm} className="hover:bg-slate-50/60">
                <td className="py-3.5 px-6 font-semibold text-[#0F172A]">{perm}</td>
                {ROLES.map((r) => (
                  <td key={r.name} className="py-3.5 px-6 text-center">
                    {r.permissions[perm] ? (
                      <span className="inline-flex h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center"><Check className="h-4 w-4" /></span>
                    ) : (
                      <span className="inline-flex h-7 w-7 rounded-full bg-slate-50 text-slate-300 items-center justify-center"><X className="h-4 w-4" /></span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
