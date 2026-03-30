'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

type Props = {
  data: any;
  loading?: boolean;
};

export default function PortalAdsSection({ data, loading }: Props) {
  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', height: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
    );
  }

  if (!data || !data.ads?.length) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>No ads data available for this period.</p>
      </div>
    );
  }

  const summary = data.summary || {};
  const ads = data.ads || [];

  // Group by campaign
  const campaignMap: Record<string, { spend: number; impressions: number; clicks: number; conversions: number }> = {};
  for (const a of ads) {
    const name = a.campaign_name || 'Unknown';
    if (!campaignMap[name]) campaignMap[name] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    campaignMap[name].spend += a.spend;
    campaignMap[name].impressions += a.impressions;
    campaignMap[name].clicks += a.clicks;
    campaignMap[name].conversions += a.conversions;
  }
  const campaigns = Object.entries(campaignMap)
    .map(([name, v]) => ({ name, ...v, cpl: v.conversions > 0 ? v.spend / v.conversions : 0 }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  // Daily spend chart
  const dailyMap: Record<string, number> = {};
  for (const a of ads) {
    const date = a.date ? new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    dailyMap[date] = (dailyMap[date] || 0) + a.spend;
  }
  const chartData = Object.entries(dailyMap).map(([date, spend]) => ({ date, spend })).slice(-30);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Spend', value: summary.totalSpend != null ? '$' + summary.totalSpend.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—' },
          { label: 'Total Clicks', value: summary.totalClicks?.toLocaleString() ?? '—' },
          { label: 'Leads (Conv.)', value: summary.totalConversions?.toLocaleString() ?? '—' },
          { label: 'Avg CPL', value: summary.totalConversions > 0 ? '$' + (summary.totalSpend / summary.totalConversions).toFixed(0) : '—' },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Spend chart */}
      {chartData.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Daily Spend</p>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => '$' + v} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => '$' + Number(v).toFixed(2)} />
                <Bar dataKey="spend" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Spend" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Campaigns table */}
      {campaigns.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Campaigns</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Campaign', 'Spend', 'Clicks', 'Leads', 'CPL'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Campaign' ? 'left' : 'right', padding: '8px 0', color: '#9ca3af', fontWeight: '500', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 0', color: '#374151', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#111827', fontWeight: '600' }}>${c.spend.toFixed(0)}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#6b7280' }}>{c.clicks.toLocaleString()}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#6b7280' }}>{c.conversions}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#111827' }}>{c.conversions > 0 ? '$' + c.cpl.toFixed(0) : '—'}</td>
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
