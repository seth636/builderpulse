'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import SkeletonCard, { SkeletonRow } from './SkeletonCard';
import { getPreviousPeriod } from './DateRangePicker';

type Props = {
  slug: string;
  startDate: string;
  endDate: string;
};

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
  other: '#64748b',
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
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

type SortKey = 'page_views' | 'avg_time_on_page' | 'bounce_rate';

export default function TrafficSection({ slug, startDate, endDate }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [prevData, setPrevData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllPages, setShowAllPages] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('page_views');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(false);
    try {
      const safeAnalytics = (raw: any) =>
        raw && Array.isArray(raw.daily)
          ? raw
          : { daily: [], summary: { totalSessions: 0, totalUsers: 0, avgBounceRate: 0, totalConversions: 0 }, topPages: [], sources: [] };
      const [curr, prev] = await Promise.all([
        fetch(`/api/analytics/${slug}?start_date=${startDate}&end_date=${endDate}`).then(r => r.json()).then(safeAnalytics),
        (() => {
          const p = getPreviousPeriod(startDate, endDate);
          return fetch(`/api/analytics/${slug}?start_date=${p.start}&end_date=${p.end}`).then(r => r.json()).then(safeAnalytics);
        })(),
      ]);
      setData(curr);
      setPrevData(prev);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="space-y-6">
      <SkeletonCard height="h-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard height="h-64" />
        <SkeletonCard height="h-64" />
      </div>
      <SkeletonCard height="h-48" />
    </div>
  );

  if (error) return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 text-slate-400 text-center">
      Failed to load — try refreshing
    </div>
  );

  const noGA4 = !data || data.daily.length === 0;
  const noRange = data && data.daily.length === 0;

  // Sessions over time — merge current + prev
  const currentDates = new Map((data?.daily || []).map(r => [r.date?.toString().split('T')[0] || '', r.sessions]));
  const prevDates = new Map((prevData?.daily || []).map(r => [r.date?.toString().split('T')[0] || '', r.sessions]));
  const allDates = Array.from(new Set([...currentDates.keys(), ...prevDates.keys()])).sort();
  const sessionChartData = data?.daily.map(r => ({
    date: r.date?.toString().split('T')[0]?.slice(5) || '',
    current: r.sessions,
  })) || [];

  // Source aggregation
  const sourceAgg = new Map<string, { name: string; sessions: number; conversions: number }>();
  for (const s of data?.sources || []) {
    const cat = classifySource(s.source, s.medium);
    const existing = sourceAgg.get(cat) || { name: cat.charAt(0).toUpperCase() + cat.slice(1), sessions: 0, conversions: 0 };
    existing.sessions += s.sessions;
    existing.conversions += s.conversions;
    sourceAgg.set(cat, existing);
  }
  const pieData = Array.from(sourceAgg.values()).sort((a, b) => b.sessions - a.sessions);
  const totalSessions = pieData.reduce((s, r) => s + r.sessions, 0);

  // Pages
  const pages = [...(data?.topPages || [])].sort((a, b) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });
  const visiblePages = showAllPages ? pages.slice(0, 50) : pages.slice(0, 10);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span> : null;

  return (
    <div className="space-y-6">
      {/* Sessions over time */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Sessions Over Time</h3>
        {noGA4 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No analytics data yet. Add GA4 Property ID in Settings and sync.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={sessionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#0ea5e9' }}
              />
              <Line type="monotone" dataKey="current" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Sessions" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Source + Pages grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic by source donut */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Traffic by Source</h3>
          {pieData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No data for this period</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="sessions" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[entry.name.toLowerCase()] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                    formatter={(val: any) => [typeof val === 'number' ? val.toLocaleString() : String(val), 'Sessions']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[entry.name.toLowerCase()] || '#64748b' }} />
                      <span className="text-slate-300">{entry.name}</span>
                    </div>
                    <span className="text-slate-400">
                      {totalSessions > 0 ? ((entry.sessions / totalSessions) * 100).toFixed(1) : 0}% · {entry.sessions.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Sources table */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Top Sources</h3>
          {(data?.sources || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No data for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="pb-3 pr-4">Source / Medium</th>
                    <th className="pb-3 pr-4 text-right">Sessions</th>
                    <th className="pb-3 pr-4 text-right">Conv.</th>
                    <th className="pb-3 text-right">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.sources || []).slice(0, 10).map((s, i) => {
                    const convRate = s.sessions > 0 ? (s.conversions / s.sessions) * 100 : 0;
                    return (
                      <tr key={i} className={`${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#1e293b]'} hover:bg-[#334155] transition-colors`}>
                        <td className="py-2 px-2 text-slate-300 truncate max-w-[140px]">{s.source} / {s.medium}</td>
                        <td className="py-2 px-2 text-right text-slate-300">{s.sessions.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right text-slate-300">{s.conversions.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right text-slate-300">{convRate.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Top Pages table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Top Pages</h3>
        {pages.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No page data for this period</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="pb-3 pr-4">Page Path</th>
                    <th className="pb-3 pr-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('page_views')}>
                      Page Views <SortIcon k="page_views" />
                    </th>
                    <th className="pb-3 pr-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('avg_time_on_page')}>
                      Avg Time <SortIcon k="avg_time_on_page" />
                    </th>
                    <th className="pb-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('bounce_rate')}>
                      Bounce Rate <SortIcon k="bounce_rate" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePages.map((p, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#1e293b]'} hover:bg-[#334155] transition-colors`}>
                      <td className="py-2 px-2 text-slate-300 font-mono text-xs truncate max-w-[280px]">{p.page_path}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{(p.page_views || 0).toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{fmtDuration(p.avg_time_on_page || 0)}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{((p.bounce_rate || 0) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages.length > 10 && (
              <button
                onClick={() => setShowAllPages(v => !v)}
                className="mt-4 text-sm text-[#0ea5e9] hover:underline"
              >
                {showAllPages ? 'Show less' : `Show more (${pages.length - 10} more)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
