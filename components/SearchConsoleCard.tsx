'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SearchConsoleCardProps {
  clientSlug: string;
  hasGSC: boolean;
}

const DATE_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

const GSCTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1623] border border-white/10 rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-white/60">{formatDate(label)}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="text-white font-medium">{p.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SearchConsoleCard({ clientSlug, hasGSC }: SearchConsoleCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedRange, setSelectedRange] = useState(30);

  const fetchData = async (days: number) => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const res = await fetch(
        `/api/search-console/${clientSlug}?start_date=${startDate}&end_date=${endDate}`
      );
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch search console data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasGSC) {
      setLoading(false);
      return;
    }
    fetchData(selectedRange);
  }, [clientSlug, hasGSC, selectedRange]);

  if (!hasGSC) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 col-span-1 md:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-2">SEO / Search Console</h3>
        <p className="text-muted text-sm mb-4">Search performance metrics</p>
        <div className="bg-background/50 rounded-lg p-8 text-center">
          <p className="text-muted text-sm">Not connected — add GSC Site URL in Settings</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 col-span-1 md:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-4">SEO / Search Console</h3>
        <div className="space-y-3">
          <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
          <div className="h-40 bg-white/5 rounded animate-pulse" />
          <div className="h-32 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data || (!data.queries?.length)) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 col-span-1 md:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">SEO / Search Console</h3>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Connected</span>
        </div>
        <p className="text-muted text-sm mb-4">Search performance metrics</p>
        <div className="bg-background/50 rounded-lg p-8 text-center">
          <p className="text-muted text-sm">Connected — no data yet. Click Sync in Settings.</p>
        </div>
      </div>
    );
  }

  const chartData = (data.daily || []).map((d: any) => ({
    date: d.date,
    Clicks: d.clicks,
    Impressions: d.impressions,
  }));

  const topQueries = (data.queries || []).slice(0, 10);

  return (
    <div className="bg-card border border-border rounded-xl p-6 col-span-1 md:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">SEO / Search Console</h3>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Connected</span>
          </div>
          <p className="text-muted text-sm">Search performance metrics</p>
        </div>
        {/* Date range pills */}
        <div className="flex gap-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setSelectedRange(r.days)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedRange === r.days
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Clicks', value: (data.summary?.totalClicks ?? 0).toLocaleString() },
          { label: 'Impressions', value: (data.summary?.totalImpressions ?? 0).toLocaleString() },
          {
            label: 'Avg CTR',
            value: data.summary?.avgCtr
              ? (data.summary.avgCtr * 100).toFixed(1) + '%'
              : '—',
          },
          {
            label: 'Avg Position',
            value: data.summary?.avgPosition
              ? data.summary.avgPosition.toFixed(1)
              : '—',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-background/50 rounded-lg px-3 py-2">
            <p className="text-white/50 text-xs mb-0.5">{stat.label}</p>
            <p className="text-white font-semibold text-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Dual-axis line chart */}
      {chartData.length > 0 && (
        <div className="mb-5">
          <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">Clicks &amp; Impressions Over Time</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatNumber}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<GSCTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Clicks"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Impressions"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top keywords table */}
      {topQueries.length > 0 && (
        <div>
          <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">Top Keywords</p>
          <div className="overflow-hidden rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 border-b border-white/5">
                  <th className="text-left py-2 font-medium">Query</th>
                  <th className="text-right py-2 font-medium">Clicks</th>
                  <th className="text-right py-2 font-medium">Impr.</th>
                  <th className="text-right py-2 font-medium">CTR</th>
                  <th className="text-right py-2 font-medium">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.map((q: any, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2 text-white/80 max-w-[180px] truncate pr-2">{q.query || q.keyword}</td>
                    <td className="py-2 text-right text-white/70">{(q.clicks ?? 0).toLocaleString()}</td>
                    <td className="py-2 text-right text-white/50">{(q.impressions ?? 0).toLocaleString()}</td>
                    <td className="py-2 text-right text-white/50">
                      {q.ctr != null ? (q.ctr * 100).toFixed(1) + '%' : '—'}
                    </td>
                    <td className="py-2 text-right text-white/50">
                      {q.position != null ? q.position.toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
