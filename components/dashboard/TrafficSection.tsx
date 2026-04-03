'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import SkeletonCard from './SkeletonCard';
import { getPreviousPeriod } from './DateRangePicker';

type Props = { slug: string; startDate: string; endDate: string };

type DailyRow = { date: string; sessions: number; total_users: number; bounce_rate: number; conversions: number };
type PageRow = { page_path: string; page_views: number; avg_time_on_page: number; bounce_rate: number };
type SourceRow = { source: string; medium: string; sessions: number; conversions: number };
type AnalyticsData = {
  daily: DailyRow[];
  summary: { totalSessions: number; totalUsers: number; avgBounceRate: number; totalConversions: number };
  topPages: PageRow[];
  sources: SourceRow[];
};

const SOURCE_COLORS: Record<string, string> = {
  organic: '#10b981',
  paid: '#0ea5e9',
  social: '#8b5cf6',
  direct: '#94a3b8',
  referral: '#f97316',
  email: '#14b8a6',
  other: '#4b5563',
};

function classifySource(source: string, medium: string): string {
  const s = (source + ' ' + medium).toLowerCase();
  if (s.includes('organic') || medium === 'organic') return 'organic';
  if (s.includes('cpc') || s.includes('paid') || medium === 'cpc') return 'paid';
  if (s.includes('social') || s.includes('facebook') || s.includes('instagram') || s.includes('twitter')) return 'social';
  if (source === '(direct)' || medium === '(none)') return 'direct';
  if (medium === 'referral') return 'referral';
  if (medium === 'email') return 'email';
  return 'other';
}

function fmtDuration(seconds: number): string {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60), s = Math.round(seconds % 60);
  return m === 0 ? `${s}s` : `${m}m ${s}s`;
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      background: '#0d0d1a', border: '1px solid rgba(147,107,218,0.25)',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: '12px',
    }}>
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#8b8b9e' }}>{p.name}:</span>
          <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px', padding: '22px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const AXIS_STYLE = { fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Inter, sans-serif' };
const GRID = { stroke: 'var(--bg-card-subtle)', strokeDasharray: '0' };

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

export default function TrafficSection({ slug, startDate, endDate }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [prevData, setPrevData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllPages, setShowAllPages] = useState(false);
  const [sortKey, setSortKey] = useState<'page_views' | 'avg_time_on_page' | 'bounce_rate'>('page_views');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true); setError(false);
    const safe = (raw: any) =>
      raw && Array.isArray(raw.daily)
        ? raw
        : { daily: [], summary: { totalSessions: 0, totalUsers: 0, avgBounceRate: 0, totalConversions: 0 }, topPages: [], sources: [] };
    try {
      const prev = getPreviousPeriod(startDate, endDate);
      const [curr, prv] = await Promise.all([
        fetch(`/api/analytics/${slug}?start_date=${startDate}&end_date=${endDate}`).then(r => r.json()).then(safe),
        fetch(`/api/analytics/${slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()).then(safe),
      ]);
      setData(curr);
      setPrevData(prv);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [slug, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SkeletonCard height="h-72" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <SkeletonCard height="h-64" />
        <SkeletonCard height="h-64" />
      </div>
      <SkeletonCard height="h-48" />
    </div>
  );

  if (error) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Failed to load — try refreshing
    </div>
  );

  const noGA4 = !data || data.daily.length === 0;

  // Chart data
  const sessionChart = (data?.daily || []).map(r => ({
    date: (r.date?.toString().split('T')[0] || '').slice(5),
    sessions: r.sessions,
    users: r.total_users,
  }));

  // Source aggregation
  const sourceAgg = new Map<string, { name: string; sessions: number; color: string }>();
  for (const s of data?.sources || []) {
    const cat = classifySource(s.source, s.medium);
    const ex = sourceAgg.get(cat) || { name: cat.charAt(0).toUpperCase() + cat.slice(1), sessions: 0, color: SOURCE_COLORS[cat] || '#4b5563' };
    ex.sessions += s.sessions;
    sourceAgg.set(cat, ex);
  }
  const sourceData = Array.from(sourceAgg.values()).sort((a, b) => b.sessions - a.sessions);
  const totalSessions = sourceData.reduce((s, r) => s + r.sessions, 0);

  // Pages
  const pages = [...(data?.topPages || [])].sort((a, b) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });
  const visiblePages = showAllPages ? pages.slice(0, 50) : pages.slice(0, 10);

  const handleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const { totalSessions: ts = 0, totalUsers: tu = 0, avgBounceRate: br = 0, totalConversions: tc = 0 } = data?.summary || {};
  const prevS = prevData?.summary || { totalSessions: 0, totalUsers: 0, avgBounceRate: 0, totalConversions: 0 };

  // Build comparison chart data (index-aligned)
  const prevDaily = prevData?.daily || [];
  const sessionChartWithPrev = (data?.daily || []).map((r, i) => ({
    date: (r.date?.toString().split('T')[0] || '').slice(5),
    sessions: r.sessions,
    users: r.total_users,
    prevSessions: prevDaily[i]?.sessions ?? null,
    prevUsers: prevDaily[i]?.total_users ?? null,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Summary KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Sessions', value: ts, display: ts.toLocaleString(), prev: prevS.totalSessions, color: '#0ea5e9', lower: false },
          { label: 'Users', value: tu, display: tu.toLocaleString(), prev: prevS.totalUsers, color: '#926BD9', lower: false },
          { label: 'Bounce Rate', value: (br||0)*100, display: ((br || 0) * 100).toFixed(1) + '%', prev: (prevS.avgBounceRate||0)*100, color: '#F59E0B', lower: true },
          { label: 'Conversions', value: tc, display: tc.toLocaleString(), prev: prevS.totalConversions, color: '#00FFD4', lower: false },
        ].map(item => (
          <div key={item.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px',
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{item.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '24px', fontWeight: '700', color: item.color, margin: 0 }}>{item.display}</p>
              <ChangeBadge current={item.value} previous={item.prev} lowerIsBetter={item.lower} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Sessions over time ── */}
      <ChartCard title="Sessions & Users Over Time">
        {noGA4 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '40px 0' }}>
            No analytics data yet — add GA4 Property ID in Settings to sync.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={sessionChartWithPrev}>
              <defs>
                <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#926BD9" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#926BD9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="sessions" stroke="#0ea5e9" strokeWidth={2} fill="url(#sessGrad)" dot={false} name="Sessions" />
              <Area type="monotone" dataKey="users" stroke="#926BD9" strokeWidth={1.5} fill="url(#usersGrad)" dot={false} name="Users" />
              <Area type="monotone" dataKey="prevSessions" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray="4 2" fill="none" dot={false} name="Prev Sessions" strokeOpacity={0.4} />
              <Area type="monotone" dataKey="prevUsers" stroke="#926BD9" strokeWidth={1} strokeDasharray="4 2" fill="none" dot={false} name="Prev Users" strokeOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Source bar + top sources table ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Source bar chart */}
        <ChartCard title="Traffic by Source">
          {sourceData.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px 0' }}>No source data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sourceData} layout="vertical" barSize={16}>
                  <CartesianGrid {...GRID} horizontal={false} />
                  <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="sessions" name="Sessions" radius={[0, 4, 4, 0]}>
                    {sourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend breakdown */}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sourceData.slice(0, 5).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>{s.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        height: '3px', width: `${totalSessions > 0 ? (s.sessions / totalSessions) * 60 : 0}px`,
                        background: s.color, borderRadius: '2px', opacity: 0.6, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
                        {totalSessions > 0 ? ((s.sessions / totalSessions) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        {/* Top sources table */}
        <ChartCard title="Top Sources">
          {(data?.sources || []).length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px 0' }}>No data</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Source / Medium', 'Sessions', 'Conv.', 'Rate'].map(h => (
                    <th key={h} style={{
                      padding: '0 6px 10px',
                      textAlign: h === 'Source / Medium' ? 'left' : 'right',
                      fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.sources || []).slice(0, 10).map((s, i) => {
                  const convRate = s.sessions > 0 ? (s.conversions / s.sessions) * 100 : 0;
                  const cat = classifySource(s.source, s.medium);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--bg-card-subtle)' }}>
                      <td style={{ padding: '9px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: SOURCE_COLORS[cat] || '#4b5563', flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
                            {s.source} / {s.medium}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 6px', textAlign: 'right', color: '#0ea5e9', fontWeight: '600' }}>{s.sessions.toLocaleString()}</td>
                      <td style={{ padding: '9px 6px', textAlign: 'right', color: 'var(--text-muted)' }}>{s.conversions.toLocaleString()}</td>
                      <td style={{ padding: '9px 6px', textAlign: 'right', color: 'var(--text-muted)' }}>{convRate.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </ChartCard>
      </div>

      {/* ── Top Pages table ── */}
      <ChartCard title="Top Pages">
        {pages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px 0' }}>No page data</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    Page Path
                  </th>
                  {(['page_views', 'avg_time_on_page', 'bounce_rate'] as const).map(k => (
                    <th key={k}
                      onClick={() => handleSort(k)}
                      style={{
                        padding: '0 8px 12px', textAlign: 'right', cursor: 'pointer',
                        fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: sortKey === k ? 'var(--text-primary)' : 'var(--text-muted)',
                        borderBottom: '1px solid var(--border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {k === 'page_views' ? 'Views' : k === 'avg_time_on_page' ? 'Avg Time' : 'Bounce'}
                      {sortKey === k && <span style={{ marginLeft: '4px' }}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiblePages.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 8px', color: '#FFFFFF', fontFamily: 'monospace', fontSize: '12px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.page_path}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0ea5e9', fontWeight: '600' }}>{(p.page_views || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#8b8b9e' }}>{fmtDuration(p.avg_time_on_page || 0)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#8b8b9e' }}>{((p.bounce_rate || 0) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages.length > 10 && (
              <button
                onClick={() => setShowAllPages(v => !v)}
                style={{
                  marginTop: '14px', fontSize: '13px', color: '#926BD9',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0', fontFamily: 'Inter, sans-serif',
                }}
              >
                {showAllPages ? 'Show less' : `Show ${pages.length - 10} more`}
              </button>
            )}
          </>
        )}
      </ChartCard>
    </div>
  );
}
