'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import SkeletonCard from './SkeletonCard';
import { getPreviousPeriod } from './DateRangePicker';

function ChangeBadge({ current, previous, lowerIsBetter = false }: { current: number; previous: number; lowerIsBetter?: boolean }) {
  if (!previous || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const isGood = lowerIsBetter ? pct < 0 : pct > 0;
  return (
    <span style={{ fontSize: '11px', fontWeight: '600', color: isGood ? '#10B981' : '#EF4444', marginLeft: '6px' }}>
      {pct > 0 ? '↑' : '↓'}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

type Props = { slug: string; startDate: string; endDate: string; hasGHL: boolean };

type Lead = { id: number; name: string; source: string | null; status: string | null; created_date: string };
type LeadsData = {
  leads: Lead[];
  weekly: { week: string; count: number }[];
  sources: { source: string; count: number }[];
  summary: { newLeads: number; appointmentsBooked: number; appointmentsCompleted: number; leadToApptRate: number };
};

const SOURCE_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f97316', '#14b8a6', '#64748b', '#94a3b8'];

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  qualified: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
};

function getStatusStyle(status: string | null) {
  const s = (status || 'new').toLowerCase();
  if (s.includes('contact')) return STATUS_STYLES.contacted;
  if (s.includes('qualif')) return STATUS_STYLES.qualified;
  if (s.includes('lost') || s.includes('close')) return STATUS_STYLES.lost;
  return STATUS_STYLES.new;
}

export default function LeadsSection({ slug, startDate, endDate, hasGHL }: Props) {
  const [data, setData] = useState<LeadsData | null>(null);
  const [prevData, setPrevData] = useState<LeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true); setError(false);
    try {
      const prev = getPreviousPeriod(startDate, endDate);
      const [curr, prv] = await Promise.all([
        fetch(`/api/leads/${slug}?start_date=${startDate}&end_date=${endDate}`).then(r => r.json()),
        fetch(`/api/leads/${slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()),
      ]);
      setData(curr);
      setPrevData(prv);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [slug, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!hasGHL) return (
    <div className="bp-card text-center">
      <p className="text-slate-400 text-sm">No lead data yet. Add GHL Location ID in Settings.</p>
    </div>
  );

  if (loading) return <div className="space-y-6"><SkeletonCard height="h-24" /><SkeletonCard height="h-64" /><SkeletonCard height="h-48" /></div>;
  if (error) return <div className="bp-card text-slate-400 text-center">Failed to load — try refreshing</div>;

  const s = data?.summary;
  const prevS = prevData?.summary;
  const noData = !data || data.leads.length === 0;

  if (noData) return (
    <div className="bp-card text-center">
      <p className="text-slate-400 text-sm">No lead data for this period</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'New Leads', raw: s?.newLeads || 0, prev: prevS?.newLeads || 0, display: (s?.newLeads || 0).toLocaleString(), lower: false },
          { label: 'Appointments Booked', raw: s?.appointmentsBooked || 0, prev: prevS?.appointmentsBooked || 0, display: (s?.appointmentsBooked || 0).toLocaleString(), lower: false },
          { label: 'Appointments Completed', raw: s?.appointmentsCompleted || 0, prev: prevS?.appointmentsCompleted || 0, display: (s?.appointmentsCompleted || 0).toLocaleString(), lower: false },
          { label: 'Lead-to-Appt Rate', raw: s?.leadToApptRate || 0, prev: prevS?.leadToApptRate || 0, display: `${(s?.leadToApptRate || 0).toFixed(1)}%`, lower: false },
        ].map((card, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{card.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{card.display}</p>
              <ChangeBadge current={card.raw} previous={card.prev} lowerIsBetter={card.lower} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly leads */}
        <div className="bp-card">
          <h3 className="text-white font-semibold mb-4">New Leads Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.weekly || []}>
              <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, border: '1px solid' }} />
              <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead sources donut */}
        <div className="bp-card">
          <h3 className="text-white font-semibold mb-4">Lead Sources</h3>
          {(data?.sources || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No source data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data?.sources || []} dataKey="count" nameKey="source" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    {(data?.sources || []).map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, border: '1px solid' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {(data?.sources || []).slice(0, 5).map((src, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                      <span className="text-slate-300 capitalize">{src.source}</span>
                    </div>
                    <span className="text-slate-400">{src.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent leads table */}
      <div className="bp-card">
        <h3 className="text-white font-semibold mb-4">Recent Leads</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-left border-b border-border-light">
              <th className="pb-3 pr-4 text-axis-label font-medium uppercase">Name</th>
              <th className="pb-3 pr-4 text-axis-label font-medium uppercase">Source</th>
              <th className="pb-3 pr-4 text-axis-label font-medium uppercase">Status</th>
              <th className="pb-3 text-right text-axis-label font-medium uppercase">Date</th>
            </tr></thead>
            <tbody>
              {(data?.leads || []).slice(0, 20).map((lead, i) => (
                <tr key={i} className="hover:bg-white/[0.03] transition-colors border-b border-border-light last:border-0">
                  <td className="py-3 px-2 text-white">{lead.name}</td>
                  <td className="py-3 px-2 text-slate-300 capitalize">{lead.source || '—'}</td>
                  <td className="py-3 px-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusStyle(lead.status)}`}>
                      {lead.status || 'New'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-slate-400 text-xs">
                    {new Date(lead.created_date).toLocaleDateString()}
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
