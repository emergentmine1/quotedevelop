import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Search,
  Filter,
  Ship,
  Plane,
  Container,
  Boxes,
  Trash2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Briefcase,
  RefreshCw,
  AlarmClock,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Flag from '@/components/Flag';
import {
  listLeads,
  updateLead,
  deleteLead,
  SALES_TEAMS,
  LEAD_STATUSES,
} from '@/lib/leads-store';
import { toast } from 'sonner';

const STATUS_STYLES = {
  new: 'bg-sky-100 text-sky-700 border-sky-200',
  contacted: 'bg-amber-100 text-amber-700 border-amber-200',
  qualified: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  proposal: 'bg-purple-100 text-purple-700 border-purple-200',
  won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  lost: 'bg-slate-100 text-slate-500 border-slate-200',
};

// Follow-up SLA: a lead in `new` or `contacted` becomes "overdue" after 48h.
const OVERDUE_THRESHOLD_MS = 48 * 3600 * 1000;
function isOverdue(lead) {
  if (!lead || !['new', 'contacted'].includes(lead.status)) return false;
  const age = Date.now() - new Date(lead.createdAt).getTime();
  return age > OVERDUE_THRESHOLD_MS;
}
function ageHours(lead) {
  return Math.round((Date.now() - new Date(lead.createdAt).getTime()) / 3600000);
}

const KANBAN_COLUMNS = [
  { id: 'new',       label: 'New',        color: 'sky' },
  { id: 'contacted', label: 'Contacted',  color: 'amber' },
  { id: 'qualified', label: 'Qualified',  color: 'indigo' },
  { id: 'proposal',  label: 'Proposal',   color: 'purple' },
  { id: 'won',       label: 'Won',        color: 'emerald' },
];

export default function Leads() {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list');       // 'list' | 'kanban'
  const [draggingId, setDraggingId] = useState(null);

  const leads = useMemo(() => listLeads(), [refresh]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (teamFilter !== 'all' && l.salesTeamId !== teamFilter) return false;
      if (typeFilter !== 'all' && l.userType !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company || '').toLowerCase().includes(q) ||
          l.origin?.code?.toLowerCase().includes(q) ||
          l.destination?.code?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, search, statusFilter, teamFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((l) => l.status === 'new').length,
      contacted: leads.filter((l) => l.status === 'contacted').length,
      qualified: leads.filter((l) => l.status === 'qualified').length,
      won: leads.filter((l) => l.status === 'won').length,
      overdue: leads.filter((l) => isOverdue(l)).length,
      newThisWeek: leads.filter(
        (l) => Date.now() - new Date(l.createdAt).getTime() < 7 * 86400000
      ).length,
    };
  }, [leads]);

  const changeStatus = (id, status) => {
    updateLead(id, { status });
    toast.success(`Lead moved to ${status}`);
    setRefresh((n) => n + 1);
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const remove = (id) => {
    deleteLead(id);
    toast.success('Lead deleted');
    setRefresh((n) => n + 1);
    if (selected?.id === id) setSelected(null);
  };

  const regenerateQuote = (lead) => {
    if (!lead?.quotePayload) {
      toast.error('This lead has no stored quote payload. Ask the customer to re-submit.');
      return;
    }
    sessionStorage.setItem('iq_payload', JSON.stringify(lead.quotePayload));
    toast.success(`Regenerating ${lead.name}'s quote…`);
    navigate('/instant-quote/results');
  };

  return (
    <div className="space-y-6" data-testid="admin-leads-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37]">
            <Sparkles className="h-3 w-3" /> Sales pipeline
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#0F172A] mt-1">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">
            Prospects captured from the Instant Quote flow. Assign, follow up and convert.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            data-testid="view-list"
            onClick={() => setView('list')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors',
              view === 'list' ? 'bg-[#0B2545] text-white' : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <ListIcon className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total leads" value={stats.total} icon={Users} tone="navy" testId="stat-total" />
        <StatCard label="New" value={stats.new} icon={Sparkles} tone="sky" testId="stat-new" />
        <StatCard label="Contacted" value={stats.contacted} icon={Clock} tone="amber" testId="stat-contacted" />
        <StatCard label="Qualified" value={stats.qualified} icon={TrendingUp} tone="indigo" testId="stat-qualified" />
        <StatCard label="Won" value={stats.won} icon={TrendingUp} tone="emerald" testId="stat-won" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="leads-search"
              placeholder="Search by name, email, company or lane…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 rounded-xl border-slate-200"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Filters:
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="filter-status" className="h-10 w-40 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger data-testid="filter-team" className="h-10 w-52 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sales teams</SelectItem>
              {SALES_TEAMS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger data-testid="filter-type" className="h-10 w-40 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="new">New customers</SelectItem>
              <SelectItem value="existing">Existing customers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Split view: list + detail */}
      {view === 'kanban' ? (
        <KanbanBoard
          leads={filtered}
          onDropStatus={(leadId, status) => changeStatus(leadId, status)}
          onSelect={(l) => setSelected(l)}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
        />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-100 kwe-shadow overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">
                No leads match these filters yet.
              </div>
            )}
            {filtered.map((lead) => {
              const ModeIcon = lead.shippingMode === 'air' ? Plane : Ship;
              const isSelected = selected?.id === lead.id;
              const overdue = isOverdue(lead);
              return (
                <button
                  key={lead.id}
                  type="button"
                  data-testid={`lead-row-${lead.id}`}
                  onClick={() => setSelected(lead)}
                  className={cn(
                    'w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors flex items-center gap-4 relative',
                    isSelected && 'bg-[#EAF3FF]',
                    overdue && !isSelected && 'bg-rose-50/40'
                  )}
                >
                  {overdue && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-rose-500" />
                  )}
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#1E6AE1] text-white text-sm font-black flex items-center justify-center shrink-0">
                    {lead.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#0F172A] truncate">{lead.name}</span>
                      {lead.userType === 'new' ? (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-200">
                          New
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-slate-100 text-slate-600 border-slate-200">
                          Existing
                        </Badge>
                      )}
                      {overdue && (
                        <Badge
                          data-testid={`overdue-badge-${lead.id}`}
                          variant="outline"
                          className="text-[10px] uppercase tracking-widest bg-rose-100 text-rose-700 border-rose-200 inline-flex items-center gap-1"
                        >
                          <AlarmClock className="h-3 w-3" /> Follow-up · {ageHours(lead)}h
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {lead.company ? `${lead.company} · ` : ''}
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Flag code={lead.origin?.countryCode} size={14} />
                        <span className="font-mono">{lead.origin?.code}</span>
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Flag code={lead.destination?.countryCode} size={14} />
                        <span className="font-mono">{lead.destination?.code}</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <ModeIcon className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-500 uppercase text-[10px] font-semibold tracking-widest">
                        {lead.cargoMode === 'fcl' ? 'FCL' : lead.cargoMode === 'lcl' ? 'LCL' : 'Air'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right shrink-0">
                    <span className={cn('text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md border', STATUS_STYLES[lead.status])}>
                      {lead.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {lead.salesTeamName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <aside className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-6 lg:sticky lg:top-6 h-fit">
          {!selected ? (
            <div className="text-center py-16">
              <Users className="h-8 w-8 mx-auto text-slate-300 mb-3" />
              <div className="text-sm font-semibold text-slate-500">Select a lead</div>
              <div className="text-xs text-slate-400 mt-1">Choose a lead from the list to see full details.</div>
            </div>
          ) : (
            <div className="space-y-5">
              {isOverdue(selected) && (
                <div data-testid="overdue-banner" className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5">
                  <AlarmClock className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-rose-900">
                    <div className="font-bold">Needs follow-up</div>
                    <div className="mt-0.5">This lead has been open for {ageHours(selected)}h without contact. Move to <span className="font-semibold">Contacted</span> or above once you&apos;ve reached out.</div>
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#1E6AE1] text-white text-base font-black flex items-center justify-center">
                    {selected.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-lg text-[#0F172A] truncate">{selected.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{selected.id}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <DetailRow icon={Mail} label="Email">
                  <a href={`mailto:${selected.email}`} className="text-[#1E6AE1] hover:underline break-all">{selected.email}</a>
                </DetailRow>
                <DetailRow icon={Phone} label="Phone">
                  <a href={`tel:${selected.phone}`} className="text-[#0F172A]">{selected.phone}</a>
                </DetailRow>
                {selected.company && (
                  <DetailRow icon={Building2} label="Company">{selected.company}</DetailRow>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Shipment inquiry</div>
                <div className="flex items-center gap-2 text-sm">
                  <Flag code={selected.origin?.countryCode} size={18} />
                  <span className="font-semibold">{selected.origin?.city}</span>
                  <span className="font-mono text-xs text-slate-500">({selected.origin?.code})</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 mx-1" />
                  <Flag code={selected.destination?.countryCode} size={18} />
                  <span className="font-semibold">{selected.destination?.city}</span>
                  <span className="font-mono text-xs text-slate-500">({selected.destination?.code})</span>
                </div>
                {selected.commodity && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-slate-700">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 shrink-0 mt-0.5">Commodity ·</span>
                    <span data-testid="lead-commodity" className="font-semibold">{selected.commodity}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    {selected.cargoMode === 'fcl' ? <Container className="h-3.5 w-3.5" /> : <Boxes className="h-3.5 w-3.5" />}
                    <span className="font-semibold uppercase">{selected.cargoMode}</span>
                  </span>
                  {selected.cargoMode === 'fcl' && selected.containers?.length > 0 ? (
                    <span className="font-semibold">
                      {selected.containers.map((c) => `${c.count}× ${c.type}`).join(' · ')}
                    </span>
                  ) : (
                    <span className="font-semibold">
                      {selected.shipmentTotals?.units} units · {selected.shipmentTotals?.cft?.toFixed?.(1)} CFT
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-2">Ready: <span className="font-semibold text-slate-700">{selected.readyDate}</span></div>
              </div>

              {selected.exporter && (selected.exporter.city || selected.exporter.addressLine1) && (
                <div data-testid="lead-exporter" className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Exporter location</div>
                  <div className="text-sm font-semibold text-[#0B2545]">{selected.exporter.exporterName || selected.company}</div>
                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {selected.exporter.addressLine1 && <>{selected.exporter.addressLine1}<br /></>}
                    {selected.exporter.addressLine2 && <>{selected.exporter.addressLine2}<br /></>}
                    {[selected.exporter.city, selected.exporter.state, selected.exporter.postalCode].filter(Boolean).join(', ')}
                    {selected.exporter.countryCode && <> · <span className="font-mono">{selected.exporter.countryCode}</span></>}
                  </div>
                </div>
              )}

              <div>
                <Label>Status</Label>
                <Select value={selected.status} onValueChange={(v) => changeStatus(selected.id, v)}>
                  <SelectTrigger data-testid="lead-status-select" className="h-11 mt-1.5 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sales team</Label>
                <div className="mt-1.5 px-3 h-11 rounded-xl border border-slate-200 flex items-center text-sm font-semibold text-[#0F172A]">
                  {selected.salesTeamName}
                </div>
              </div>

              {selected.notes && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-900">
                  {selected.notes}
                </div>
              )}

              <Button
                onClick={() => regenerateQuote(selected)}
                data-testid="lead-regenerate-quote"
                disabled={!selected.quotePayload}
                className="w-full h-11 rounded-xl bg-[#1E6AE1] hover:bg-[#1758c2] text-white font-semibold gap-2 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate quote
              </Button>

              <Button
                variant="outline"
                onClick={() => remove(selected.id)}
                data-testid="lead-delete-button"
                className="w-full h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Delete lead
              </Button>
            </div>
          )}
        </aside>
      </div>
      )}
    </div>
  );
}

function KanbanBoard({ leads, onDropStatus, onSelect, draggingId, setDraggingId }) {
  const grouped = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter((l) => l.status === col.id);
    return acc;
  }, {});
  return (
    <div data-testid="leads-kanban" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {KANBAN_COLUMNS.map((col) => (
        <KanbanColumn
          key={col.id}
          column={col}
          leads={grouped[col.id]}
          onDropStatus={onDropStatus}
          onSelect={onSelect}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
        />
      ))}
    </div>
  );
}

function KanbanColumn({ column, leads, onDropStatus, onSelect, draggingId, setDraggingId }) {
  const tones = {
    sky:      'from-sky-500 to-sky-600',
    amber:    'from-amber-500 to-amber-600',
    indigo:   'from-indigo-500 to-indigo-600',
    purple:   'from-purple-500 to-purple-600',
    emerald:  'from-emerald-500 to-emerald-600',
  };
  return (
    <div
      data-testid={`kanban-col-${column.id}`}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/lead-id');
        if (id) onDropStatus(id, column.id);
        setDraggingId(null);
      }}
      className={cn(
        'bg-white rounded-2xl border border-slate-100 kwe-shadow flex flex-col min-h-[420px]',
        draggingId && 'ring-2 ring-[#5BB3FF]/40'
      )}
    >
      <div className={cn('px-3 py-2 rounded-t-2xl bg-gradient-to-r text-white flex items-center justify-between', tones[column.color])}>
        <div className="text-[11px] uppercase tracking-widest font-bold">{column.label}</div>
        <div className="text-xs font-mono bg-white/20 px-1.5 py-0.5 rounded">{leads.length}</div>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[560px]">
        {leads.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            Drop leads here
          </div>
        )}
        {leads.map((lead) => (
          <div
            key={lead.id}
            data-testid={`kanban-card-${lead.id}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/lead-id', lead.id);
              e.dataTransfer.effectAllowed = 'move';
              setDraggingId(lead.id);
            }}
            onDragEnd={() => setDraggingId(null)}
            onClick={() => onSelect(lead)}
            className={cn(
              'bg-white border border-slate-200 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-[#1E6AE1] hover:-translate-y-0.5 transition-all shadow-sm',
              draggingId === lead.id && 'opacity-50 rotate-1'
            )}
          >
            <div className="flex items-start gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0B2545] to-[#1E6AE1] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                {lead.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0F172A] truncate">{lead.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{lead.company}</div>
              </div>
            </div>
            {lead.commodity && (
              <div className="mt-2 text-[10px] text-slate-600 line-clamp-1">
                <span className="font-semibold">Cargo:</span> {lead.commodity}
              </div>
            )}
            <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
              <Flag code={lead.origin?.countryCode} size={12} />
              <span className="font-mono">{lead.origin?.code}</span>
              <ArrowRight className="h-2.5 w-2.5 text-slate-300" />
              <Flag code={lead.destination?.countryCode} size={12} />
              <span className="font-mono">{lead.destination?.code}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone, testId }) {
  const tones = {
    navy: 'from-[#0B2545] to-[#1E6AE1] text-white',
    sky: 'from-sky-500 to-sky-600 text-white',
    amber: 'from-amber-500 to-amber-600 text-white',
    indigo: 'from-indigo-500 to-indigo-600 text-white',
    emerald: 'from-emerald-500 to-emerald-600 text-white',
    red: 'from-rose-500 to-red-600 text-white',
  };
  return (
    <div data-testid={testId} className="bg-white rounded-2xl border border-slate-100 kwe-shadow p-4 flex items-center gap-3">
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0', tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-black tracking-tight text-[#0F172A]">{value}</div>
        <div className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 truncate">{label}</div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div className="text-xs font-semibold uppercase tracking-widest text-slate-600">{children}</div>;
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">{label}</div>
        <div className="text-sm text-[#0F172A] mt-0.5 min-w-0">{children}</div>
      </div>
    </div>
  );
}
