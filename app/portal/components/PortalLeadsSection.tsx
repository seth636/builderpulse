'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';

type Props = {
  data: any;
  loading?: boolean;
};

const SOURCE_COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

export default function PortalLeadsSection({ data, loading }: Props) {
  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', height: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
    );
  }

  if (!data || (!data.leads?.length && !data.appointments?.length)) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>No leads data available for this period.</p>
      </div>
    );
  }

  const leads = data.leads || [];
  const appointments = data.appointments || [];
  const summary = data.summary || {};

  // Lead sources
  const sourceMap: Record<string, number> = {};
  for (const l of leads) {
    const src = l.source || 'Unknown';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  }
  const pieData = Object.entries(sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'New Leads', value: leads.length.toLocaleString() },
          { label: 'Appointments', value: appointments.length.toLocaleString() },
        ].map(item => (
          <div key={item.label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Sources pie */}
        {pieData.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Lead Sources</p>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(props: any) => `${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {pieData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent leads */}
        {leads.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>Recent Leads</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leads.slice(0, 6).map((l: any) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc', paddingBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{l.name}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>{l.source || 'Unknown source'}</p>
                  </div>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {l.created_date ? new Date(l.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
