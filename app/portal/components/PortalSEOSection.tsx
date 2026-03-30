'use client';

import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type Props = {
  data: any;
  loading?: boolean;
};

export default function PortalSEOSection({ data, loading }: Props) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', height: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', height: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
      </div>
    );
  }

  if (!data || !data.metrics?.length) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>No SEO data available for this period.</p>
      </div>
    );
  }

  const summary = data.summary || {};
  const metrics = data.metrics || [];

  // Build daily chart data (aggregate by date)
  const byDate: Record<string, { clicks: number; impressions: number; date: string }> = {};
  for (const m of metrics) {
    const date = m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    if (!byDate[date]) byDate[date] = { clicks: 0, impressions: 0, date };
    byDate[date].clicks += m.clicks;
    byDate[date].impressions += m.impressions;
  }
  const chartData = Object.values(byDate).slice(0, 90);

  // Top keywords
  const kwMap: Record<string, { clicks: number; impressions: number; position: number; count: number }> = {};
  for (const m of metrics) {
    if (!m.query) continue;
    if (!kwMap[m.query]) kwMap[m.query] = { clicks: 0, impressions: 0, position: 0, count: 0 };
    kwMap[m.query].clicks += m.clicks;
    kwMap[m.query].impressions += m.impressions;
    kwMap[m.query].position += m.position;
    kwMap[m.query].count++;
  }
  const keywords = Object.entries(kwMap)
    .map(([query, v]) => ({ query, clicks: v.clicks, impressions: v.impressions, position: v.count > 0 ? v.position / v.count : 0 }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Clicks', value: summary.totalClicks?.toLocaleString() ?? '—' },
          { label: 'Impressions', value: summary.totalImpressions?.toLocaleString() ?? '—' },
          { label: 'Avg Position', value: summary.avgPosition != null ? '#' + summary.avgPosition.toFixed(1) : '—' },
          { label: 'Avg CTR', value: summary.avgCtr != null ? (summary.avgCtr * 100).toFixed(1) + '%' : '—' },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Clicks & Impressions</p>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Clicks" />
                <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Impressions" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Keywords table */}
      {keywords.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Top Keywords</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Keyword', 'Clicks', 'Impressions', 'Position'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Keyword' ? 'left' : 'right', padding: '8px 0', color: '#9ca3af', fontWeight: '500', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 0', color: '#374151' }}>{kw.query}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#111827', fontWeight: '600' }}>{kw.clicks}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#6b7280' }}>{kw.impressions}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#111827', fontWeight: '600' }}>#{kw.position.toFixed(1)}</td>
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
