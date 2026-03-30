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
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface AnalyticsCardProps {
  clientSlug: string;
  hasGA4: boolean;
}

const DATE_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

const SOURCE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1623] border border-white/10 rounded-lg px-3 py-2 text-xs">
        <p className="text-white/60 mb-1">{formatDate(label)}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="text-white font-medium">{p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCard({ clientSlug, hasGA4 }: AnalyticsCardProps) {
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
        `/api/analytics/${clientSlug}?start_date=${startDate}&end_date=${endDate}`
      );
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasGA4) {
      setLoading(false);
      return;
    }
    fetchData(selectedRange);
  }, [clientSlug, hasGA4, selectedRange]);

  if (!hasGA4) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 col-span-1 md:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
        <p className="text-muted text-sm mb-4">GA4 traffic and user metrics</p>
        <div className="bg-background/50 rounded-lg p-8 text-center">
          <p className="text-muted text-sm">Not connected — add GA4 Property ID in Settings</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 col-span-1 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Analytics</h3>
            <p className="text-muted text-sm">GA4 traffic and user metrics</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
          <div className="h-40 bg-white/5 rounded animate-pulse" />
          <div className="h-24 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data || data.daily.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 col-span-1 md:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Analytics</h3>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Connected</span>
        </div>
        <p className="text-muted text-sm mb-4">GA4 traffic and user metrics</p>
        <div className="bg-background/50 rounded-lg p-8 text-center">
          <p className="text-muted text-sm">Connected — no data yet. Click Sync in Settings.</p>
        </div>
      </div>
    );
  }

  const chartData = data.daily.map((d: any) => ({
    date: d.date,
    Sessions: d.sessions,
    Users: d.active_users,
  }));

  const sourcesData = (data.sources || [])
    .slice(0, 5)
    .map((s: any) => ({ name: s.channel, value: s.sessions }));

  return (
    <div className="bg-card border border-border rounded-xl p-6 col-span-1 md:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Analytics</h3>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Connected</span>
          </div>
          <p className="text-muted text-sm">GA4 traffic and user metrics</p>
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
          { label: 'Sessions', value: data.summary.totalSessions.toLocaleString() },
          { label: 'Users', value: data.summary.totalUsers.toLocaleString() },
          { label: 'Bounce Rate', value: (data.summary.avgBounceRate * 100).toFixed(1) + '%' },
          { label: 'Conversions', value: data.summary.totalConversions.toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-background/50 rounded-lg px-3 py-2">
            <p className="text-white/50 text-xs mb-0.5">{stat.label}</p>
            <p className="text-white font-semibold text-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions line chart */}
      <div className="mb-5">
        <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">Sessions Over Time</p>
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
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Sessions"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1' }}
            />
            <Line
              type="monotone"
              dataKey="Users"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              activeDot={{ r: 4, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Traffic sources */}
      {sourcesData.length > 0 && (
        <div>
          <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">Traffic Sources</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart
              data={sourcesData}
              layout="vertical"
              margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-[#0f1623] border border-white/10 rounded-lg px-3 py-2 text-xs">
                      <p className="text-white">
                        {payload[0].payload.name}:{' '}
                        <span className="font-medium">{payload[0].value?.toLocaleString()} sessions</span>
                      </p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {sourcesData.map((_: any, i: number) => (
                  <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
