'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

type Props = {
  data: any;
  loading?: boolean;
};

const SOURCE_COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

export default function PortalTrafficSection({ data, loading }: Props) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', height: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
        ))}
      </div>
    );
  }

  if (!data || !data.daily?.length) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>No traffic data available for this period.</p>
      </div>
    );
  }

  const daily = data.daily || [];
  const sources = data.sources || [];
  const topPages = data.pages || [];
  const summary = data.summary || {};

  // Aggregate sources for pie
  const sourceMap: Record<string, number> = {};
  for (const s of sources) {
    const key = s.medium || s.source || 'Other';
    sourceMap[key] = (sourceMap[key] || 0) + s.sessions;
  }
  const pieData = Object.entries(sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  const chartData = daily.map((d: any) => ({
    date: d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    sessions: d.sessions,
    users: d.total_users,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Sessions', value: summary.totalSessions?.toLocaleString() ?? '—' },
          { label: 'Total Users', value: summary.totalUsers?.toLocaleString() ?? '—' },
          { label: 'Bounce Rate', value: summary.avgBounceRate != null ? summary.avgBounceRate.toFixed(1) + '%' : '—' },
          { label: 'Conversions', value: summary.totalConversions?.toLocaleString() ?? '—' },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions chart */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Sessions Over Time</p>
        <div style={{ height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="sessions" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Sessions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Traffic sources pie */}
        {pieData.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Traffic Sources</p>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {pieData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top pages */}
        {topPages.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Top Pages</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 0', color: '#9ca3af', fontWeight: '500', fontSize: '12px' }}>Page</th>
                    <th style={{ textAlign: 'right', padding: '6px 0', color: '#9ca3af', fontWeight: '500', fontSize: '12px' }}>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.slice(0, 8).map((p: any) => (
                    <tr key={p.page_path} style={{ borderTop: '1px solid #f8fafc' }}>
                      <td style={{ padding: '8px 0', color: '#374151', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.page_path}
                      </td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: '#111827', fontWeight: '600' }}>
                        {p.page_views.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
