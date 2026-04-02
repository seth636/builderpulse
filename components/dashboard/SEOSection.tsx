'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import SkeletonCard from './SkeletonCard';
import { getPreviousPeriod } from './DateRangePicker';

type Props = { slug: string; startDate: string; endDate: string };

type DailyRow = { date: string; clicks: number; impressions: number };
type QueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
type PageRow = { page: string; clicks: number; impressions: number; ctr: number; position: number };
type GSCData = {
  daily: DailyRow[];
  queries: QueryRow[];
  pages: PageRow[];
  summary: { totalClicks: number; totalImpressions: number; avgCtr: number; avgPosition: number };
};

// ── Custom Tooltip ──────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      background: '#0d0d1a', border: '1px solid rgba(147,107,218,0.25)',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      fontSize: '12px', fontFamily: 'Inter, sans-serif',
    }}>
      {label && <p style={{ color: '#8b8b9e', marginBottom: '6px', fontWeight: '600' }}>{label}</p>}
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

// ── Section header ──────────────────────────────────────────
const ChartCard = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div style={{
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px', padding: '22px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', margin: 0 }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// ── Position badge ──────────────────────────────────────────
function PositionBadge({ pos, prev }: { pos: number; prev?: number }) {
  const posStr = pos.toFixed(1);
  if (prev === undefined) {
    return <span style={{ color: '#c4c4d4', fontWeight: '600', fontSize: '13px' }}>{posStr}</span>;
  }
  const diff = prev - pos; // positive = improved
  const absStr = Math.abs(diff).toFixed(1);
  if (Math.abs(diff) < 0.1) {
    return <span style={{ color: '#c4c4d4', fontWeight: '600', fontSize: '13px' }}>{posStr}</span>;
  }
  const color = diff > 0 ? '#00FFD4' : '#EF4444';
  const arrow = diff > 0 ? '▲' : '▼';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ color: '#c4c4d4', fontWeight: '600', fontSize: '13px' }}>{posStr}</span>
      <span style={{ fontSize: '10px', color, fontWeight: '600' }}>{arrow}{absStr}</span>
    </div>
  );
}

const AXIS_STYLE = { fill: '#64748b', fontSize: 11, fontFamily: 'Inter, sans-serif' };
const GRID_STYLE = { stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '0' };

export default function SEOSection({ slug, startDate, endDate }: Props) {
  const [data, setData] = useState<GSCData | null>(null);
  const [prevData, setPrevData] = useState<GSCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'clicks' | 'impressions'>('clicks');

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true); setError(false);
    const safe = (raw: any) =>
      raw && Array.isArray(raw.daily)
        ? raw
        : { daily: [], queries: [], pages: [], summary: { totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0 } };
    try {
      const prev = getPreviousPeriod(startDate, endDate);
      const [curr, prv] = await Promise.all([
        fetch(`/api/search-console/${slug}?start_date=${startDate}&end_date=${endDate}`).then(r => r.json()).then(safe),
        fetch(`/api/search-console/${slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()).then(safe),
      ]);
      setData(curr); setPrevData(prv);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [slug, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SkeletonCard height="h-72" />
      <SkeletonCard height="h-64" />
      <SkeletonCard height="h-48" />
    </div>
  );
  if (error) return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#64748b' }}>
      Failed to load search data — try refreshing
    </div>
  );

  const empty = !data || data.daily.length === 0;

  // Chart data
  const chartData = (data?.daily || []).map(r => ({
    date: (r.date?.toString().split('T')[0] || '').slice(5),
    clicks: r.clicks,
    impressions: r.impressions,
  }));

  // Keyword summary stats
  const { totalClicks = 0, totalImpressions = 0, avgCtr = 0, avgPosition = 0 } = data?.summary || {};

  // Previous query position map
  const prevQueryMap = new Map<string, number>();
  for (const q of prevData?.queries || []) prevQueryMap.set(q.query, q.position);

  // CTR distribution for bar chart
  const ctrBuckets = [
    { label: '0–1%', count: 0 },
    { label: '1–3%', count: 0 },
    { label: '3–5%', count: 0 },
    { label: '5–10%', count: 0 },
    { label: '10%+', count: 0 },
  ];
  for (const q of data?.queries || []) {
    const ctr = q.ctr * 100;
    if (ctr < 1) ctrBuckets[0].count++;
    else if (ctr < 3) ctrBuckets[1].count++;
    else if (ctr < 5) ctrBuckets[2].count++;
    else if (ctr < 10) ctrBuckets[3].count++;
    else ctrBuckets[4].count++;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Summary KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Clicks', value: totalClicks.toLocaleString(), color: '#0ea5e9' },
          { label: 'Impressions', value: totalImpressions.toLocaleString(), color: '#926BD9' },
          { label: 'Avg CTR', value: (avgCtr * 100).toFixed(1) + '%', color: '#00FFD4' },
          { label: 'Avg Position', value: avgPosition ? '#' + avgPosition.toFixed(1) : '—', color: '#F59E0B' },
        ].map(item => (
          <div key={item.label} style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px', padding: '16px',
          }}>
            <p style={{ fontSize: '11px', color: '#6b6b7e', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{item.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* ── Clicks / Impressions chart ── */}
      <ChartCard
        title="Search Performance"
        action={
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['clicks', 'impressions'] as const).map(m => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                style={{
                  padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '500', outline: 'none',
                  background: activeMetric === m ? (m === 'clicks' ? 'rgba(14,165,233,0.18)' : 'rgba(147,107,218,0.18)') : 'transparent',
                  color: activeMetric === m ? (m === 'clicks' ? '#0ea5e9' : '#926BD9') : '#8b8b9e',
                  transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        }
      >
        {empty ? (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '40px 0' }}>
            No search data yet — add GSC Site URL in Settings to sync.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gscClicksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gscImpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#926BD9" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#926BD9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              {activeMetric === 'clicks' ? (
                <Area type="monotone" dataKey="clicks" stroke="#0ea5e9" strokeWidth={2} fill="url(#gscClicksGrad)" dot={false} name="Clicks" />
              ) : (
                <Area type="monotone" dataKey="impressions" stroke="#926BD9" strokeWidth={2} fill="url(#gscImpGrad)" dot={false} name="Impressions" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Two-col: Top Keywords + CTR Distribution ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>

        {/* Top Keywords table */}
        <ChartCard title="Top Keywords">
          {(data?.queries || []).length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '32px 0' }}>No keyword data for this period</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Keyword', 'Position', 'Clicks', 'Impressions', 'CTR'].map(h => (
                      <th key={h} style={{
                        padding: '0 8px 12px',
                        textAlign: h === 'Keyword' ? 'left' : 'right',
                        fontSize: '10px', fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: '#6b6b7e',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.queries || []).slice(0, 15).map((q, i) => {
                    const prev = prevQueryMap.get(q.query);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}>
                        <td style={{ padding: '11px 8px', color: '#FFFFFF', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {q.query}
                        </td>
                        <td style={{ padding: '11px 8px', textAlign: 'right' }}>
                          <PositionBadge pos={q.position} prev={prev} />
                        </td>
                        <td style={{ padding: '11px 8px', textAlign: 'right', color: '#0ea5e9', fontWeight: '600' }}>{q.clicks.toLocaleString()}</td>
                        <td style={{ padding: '11px 8px', textAlign: 'right', color: '#8b8b9e' }}>{q.impressions.toLocaleString()}</td>
                        <td style={{ padding: '11px 8px', textAlign: 'right', color: '#8b8b9e' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <div style={{
                              height: '3px', width: `${Math.min(60, q.ctr * 100 * 4)}px`,
                              background: `rgba(0,255,212,${Math.min(1, q.ctr * 5)})`,
                              borderRadius: '2px', flexShrink: 0,
                            }} />
                            {(q.ctr * 100).toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* CTR Distribution */}
        <ChartCard title="CTR Distribution">
          {empty ? (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '32px 0' }}>No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ctrBuckets} barSize={28}>
                <CartesianGrid {...GRID_STYLE} vertical={false} />
                <XAxis dataKey="label" tick={{ ...AXIS_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Keywords" radius={[4, 4, 0, 0]}
                  fill="url(#ctrBarGrad)"
                />
                <defs>
                  <linearGradient id="ctrBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FFD4" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#00FFD4" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Top Pages ── */}
      <ChartCard title="Top Pages by Search">
        {(data?.pages || []).length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '32px 0' }}>No page data for this period</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Page URL', 'Clicks', 'Impressions', 'Avg Position', 'CTR'].map(h => (
                    <th key={h} style={{
                      padding: '0 8px 12px',
                      textAlign: h === 'Page URL' ? 'left' : 'right',
                      fontSize: '10px', fontWeight: '600',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: '#6b6b7e',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.pages || []).slice(0, 10).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '11px 8px', color: '#FFFFFF', fontFamily: 'monospace', fontSize: '12px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.page}
                    </td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: '#0ea5e9', fontWeight: '600' }}>{p.clicks.toLocaleString()}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: '#8b8b9e' }}>{p.impressions.toLocaleString()}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: '#c4c4d4' }}>{p.position.toFixed(1)}</td>
                    <td style={{ padding: '11px 8px', textAlign: 'right', color: '#8b8b9e' }}>{(p.ctr * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
