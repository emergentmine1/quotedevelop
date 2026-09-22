import { useMemo, useState } from 'react';
import { Search, Plus, MoreHorizontal, Mail, Shield } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { users } from '@/lib/mock-data';

export default function UserManagement() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');

  const list = useMemo(() => users.filter((u) => {
    const matchesQ = !q || [u.name, u.email, u.company].some((v) => v.toLowerCase().includes(q.toLowerCase()));
    const matchesRole = role === 'all' || u.role === role;
    return matchesQ && matchesRole;
  }), [q, role]);

  return (
    <div className="space-y-6" data-testid="user-management-page">
      <PageHeader
        breadcrumb="Admin · Users"
        title="User Management"
        subtitle={`${users.length} users across customers, providers and platform admins.`}
        action={<Button className="rounded-xl bg-[#0F172A] text-white hover:bg-[#1e293b] gap-1.5" data-testid="invite-user-btn"><Plus className="h-4 w-4" /> Invite User</Button>}
      />

      <div className="bg-white rounded-xl border border-slate-100 kwe-shadow">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input data-testid="users-search" placeholder="Search by name, email, company…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-11 rounded-xl border-slate-200" />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full sm:w-40 h-11 rounded-xl border-slate-200" data-testid="users-role-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <th className="text-left py-3 px-6">User</th>
                <th className="text-left py-3 px-6">Role</th>
                <th className="text-left py-3 px-6">Company</th>
                <th className="text-left py-3 px-6">Last login</th>
                <th className="text-left py-3 px-6">Status</th>
                <th className="py-3 px-6"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {list.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60" data-testid={`user-row-${u.id}`}>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-white text-xs font-bold flex items-center justify-center">
                        {u.name.split(' ').map((p) => p[0]).join('')}
                      </div>
                      <div>
                        <div className="font-bold text-[#0F172A]">{u.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest">
                      <Shield className="h-3 w-3" /> {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-slate-700 font-semibold">{u.company}</td>
                  <td className="py-3 px-6 text-slate-600">{u.lastLogin}</td>
                  <td className="py-3 px-6"><StatusPill status={u.status} /></td>
                  <td className="py-3 px-6">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`user-actions-${u.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
