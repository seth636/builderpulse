'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import SkeletonCard from './SkeletonCard';

type Props = { slug: string; startDate: string; endDate: string; hasMetaAccount: boolean };

type Campaign = {
  campaign_name: string; status: string; spend: number; impressions: number;
  clicks: number; ctr: number; conversions: number; cost_per_conv: number;
};
type AdsData = {
  campaigns: Campaign[];
  daily: { date: string; spend: number }[];
  summary: { totalSpend: number; totalClicks: number; totalImpressions: number; totalConversions: number; avgCPC: number; avgCostPerLead: number; avgCTR: number };
};

export default function AdsSection({ slug, startDate, endDate, hasMetaAccount }: Props) {
  const [data, setData] = useState<AdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true); setError(false);
    try {
      const res = await fetch(`/api/ads/${slug}?start_date=${startDate}&end_date=${endDate}`);
      setData(await res.json());
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [slug, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!hasMetaAccount) return (
    <div className="bp-card text-center">
      <p className="text-slate-400 text-sm">No ad data yet. Add Meta Ad Account ID in Settings.</p>
    </div>
  );

  if (loading) return <div className="space-y-6"><SkeletonCard height="h-24" /><SkeletonCard height="h-64" /><SkeletonCard height="h-48" /></div>;
  if (error) return <div className="bp-card text-slate-400 text-center">Failed to load — try refreshing</div>;

  const s = data?.summary;
  const noData = !data || data.campaigns.length === 0;

  if (noData) return (
    <div className="bp-card text-center">
      <p className="text-slate-400 text-sm">No ad data for this period</p>
    </div>
  );

  const metaTokenExpired = (data as any)?.error?.includes('token expired');
  if (metaTokenExpired) return (
    <div className="bp-card text-center">
      <p className="text-amber-400 text-sm">Meta token expired — regenerate in Settings</p>
    </div>
  );

  const chartData = (data?.daily || []).map(r => ({ ...r, date: r.date.slice(5) }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Ad Spend', value: `$${(s?.totalSpend || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Leads from Ads', value: (s?.totalConversions || 0).toLocaleString() },
          { label: 'Cost Per Lead', value: s?.avgCostPerLead ? `$${s.avgCostPerLead.toFixed(2)}` : '—' },
          { label: 'Click-Through Rate', value: `${(s?.avgCTR || 0).toFixed(2)}%` },
        ].map((card, i) => (
          <div key={i} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Spend over time */}
      <div className="bp-card">
        <h3 className="text-white font-semibold mb-4">Ad Spend Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, border: '1px solid' }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Spend']} />
            <Bar dataKey="spend" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign table */}
      <div className="bp-card">
        <h3 className="text-white font-semibold mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-left border-b border-border-light">
              <th className="pb-3 pr-4 text-axis-label font-medium uppercase">Campaign</th>
              <th className="pb-3 pr-4 text-right text-axis-label font-medium uppercase">Spend</th>
              <th className="pb-3 pr-4 text-right text-axis-label font-medium uppercase">Impressions</th>
              <th className="pb-3 pr-4 text-right text-axis-label font-medium uppercase">Clicks</th>
              <th className="pb-3 pr-4 text-right text-axis-label font-medium uppercase">CTR</th>
              <th className="pb-3 pr-4 text-right text-axis-label font-medium uppercase">Conv.</th>
              <th className="pb-3 text-right text-axis-label font-medium uppercase">Cost/Conv</th>
            </tr></thead>
            <tbody>
              {(data?.campaigns || []).map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.03] transition-colors border-b border-border-light last:border-0">
                  <td className="py-3 px-2 text-white truncate max-w-[180px]">{c.campaign_name}</td>
                  <td className="py-3 px-2 text-right text-slate-300">${c.spend.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{c.impressions.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{c.clicks.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{c.ctr.toFixed(2)}%</td>
                  <td className="py-3 px-2 text-right text-slate-300">{c.conversions}</td>
                  <td className="py-3 px-2 text-right text-slate-300">{c.conversions > 0 ? `$${c.cost_per_conv.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
