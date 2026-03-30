'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import SkeletonCard from './SkeletonCard';
import { getPreviousPeriod } from './DateRangePicker';

type Props = {
  slug: string;
  startDate: string;
  endDate: string;
};

type DailyRow = { date: string; clicks: number; impressions: number };
type QueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
type PageRow = { page: string; clicks: number; impressions: number; ctr: number; position: number };
type GSCData = {
  daily: DailyRow[];
  queries: QueryRow[];
  pages: PageRow[];
  summary: { totalClicks: number; totalImpressions: number; avgCtr: number; avgPosition: number };
};

export default function SEOSection({ slug, startDate, endDate }: Props) {
  const [data, setData] = useState<GSCData | null>(null);
  const [prevData, setPrevData] = useState<GSCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(false);
    try {
      const [curr, prev] = await Promise.all([
        fetch(`/api/search-console/${slug}?start_date=${startDate}&end_date=${endDate}`).then(r => r.json()),
        (() => {
          const p = getPreviousPeriod(startDate, endDate);
          return fetch(`/api/search-console/${slug}?start_date=${p.start}&end_date=${p.end}`).then(r => r.json());
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
      <SkeletonCard height="h-64" />
      <SkeletonCard height="h-48" />
    </div>
  );

  if (error) return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 text-slate-400 text-center">
      Failed to load — try refreshing
    </div>
  );

  const noGSC = !data || data.daily.length === 0;

  // Clicks + Impressions chart
  const chartData = (data?.daily || []).map(r => ({
    date: r.date?.toString().split('T')[0]?.slice(5) || '',
    clicks: r.clicks,
    impressions: r.impressions,
  }));

  // Previous period query map for position change
  const prevQueryMap = new Map<string, number>();
  for (const q of prevData?.queries || []) {
    prevQueryMap.set(q.query, q.position);
  }

  return (
    <div className="space-y-6">
      {/* Clicks + Impressions chart */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Clicks & Impressions Over Time</h3>
        {noGSC ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No search data yet. Add GSC Site URL in Settings and sync.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis yAxisId="clicks" orientation="left" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis yAxisId="impressions" orientation="right" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Line yAxisId="clicks" type="monotone" dataKey="clicks" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Clicks" />
              <Line yAxisId="impressions" type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Impressions" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Keywords */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Top Keywords</h3>
        {(data?.queries || []).length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No search data yet. Add GSC Site URL in Settings and sync.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="pb-3 pr-4">Keyword</th>
                  <th className="pb-3 pr-4 text-right">Position</th>
                  <th className="pb-3 pr-4 text-right">Change</th>
                  <th className="pb-3 pr-4 text-right">Clicks</th>
                  <th className="pb-3 pr-4 text-right">Impressions</th>
                  <th className="pb-3 text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {(data?.queries || []).slice(0, 20).map((q, i) => {
                  const prevPos = prevQueryMap.get(q.query);
                  let changeEl = <span className="text-slate-500">—</span>;
                  if (prevPos !== undefined) {
                    const diff = prevPos - q.position; // positive = improved (position number went down)
                    if (Math.abs(diff) >= 0.1) {
                      const improved = diff > 0;
                      changeEl = (
                        <span className={improved ? 'text-[#10b981]' : 'text-red-400'}>
                          {improved ? '↓' : '↑'} {Math.abs(diff).toFixed(1)}
                        </span>
                      );
                    } else {
                      changeEl = <span className="text-slate-500">—</span>;
                    }
                  }
                  return (
                    <tr key={i} className={`${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#1e293b]'} hover:bg-[#334155] transition-colors`}>
                      <td className="py-2 px-2 text-slate-300 truncate max-w-[200px]">{q.query}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{q.position.toFixed(1)}</td>
                      <td className="py-2 px-2 text-right">{changeEl}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{q.clicks.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{q.impressions.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{(q.ctr * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Pages by Search */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Top Pages by Search</h3>
        {(data?.pages || []).length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No data for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th className="pb-3 pr-4">Page URL</th>
                  <th className="pb-3 pr-4 text-right">Clicks</th>
                  <th className="pb-3 pr-4 text-right">Impressions</th>
                  <th className="pb-3 pr-4 text-right">Avg Position</th>
                  <th className="pb-3 text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pages || []).slice(0, 10).map((p, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#1e293b]'} hover:bg-[#334155] transition-colors`}>
                    <td className="py-2 px-2 text-slate-300 font-mono text-xs truncate max-w-[280px]">{p.page}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{p.clicks.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{p.impressions.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{p.position.toFixed(1)}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{(p.ctr * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
