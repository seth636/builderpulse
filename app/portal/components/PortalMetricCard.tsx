'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

type Format = 'number' | 'percentage' | 'position' | 'currency' | 'rating';

type Props = {
  title: string;
  value: number | null;
  previousValue?: number | null;
  format?: Format;
  sparklineData?: number[];
  loading?: boolean;
  notAvailable?: boolean;
};

function formatValue(val: number, format: Format): string {
  if (format === 'number') return val.toLocaleString();
  if (format === 'percentage') return val.toFixed(1) + '%';
  if (format === 'position') return '#' + val.toFixed(1);
  if (format === 'currency') return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (format === 'rating') return val.toFixed(1) + ' ★';
  return String(val);
}

function getTrend(value: number | null, previousValue: number | null | undefined, format: Format) {
  if (value === null || previousValue === null || previousValue === undefined || previousValue === 0) return null;
  const change = ((value - previousValue) / previousValue) * 100;
  const isPosition = format === 'position';
  const isGood = isPosition ? change < 0 : change > 0;
  return { change, isGood };
}

export default function PortalMetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  sparklineData = [],
  loading = false,
  notAvailable = false,
}: Props) {
  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: '20px',
      }}>
        <div style={{ height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px', width: '60%', marginBottom: '12px' }} />
        <div style={{ height: '32px', backgroundColor: '#f1f5f9', borderRadius: '4px', width: '40%', marginBottom: '8px' }} />
        <div style={{ height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px', width: '50%' }} />
      </div>
    );
  }

  if (notAvailable || value === null) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: '20px',
        opacity: 0.6,
      }}>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>{title}</p>
        <p style={{ fontSize: '24px', fontWeight: '700', color: '#d1d5db' }}>—</p>
        <p style={{ fontSize: '12px', color: '#d1d5db' }}>No data</p>
      </div>
    );
  }

  const trend = getTrend(value, previousValue, format);
  const sparkPoints = sparklineData.map((v, i) => ({ v }));

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      padding: '20px',
    }}>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>{title}</p>
      <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '4px', lineHeight: 1.2 }}>
        {formatValue(value, format)}
      </p>
      {trend !== null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: trend.isGood ? '#059669' : '#dc2626',
          marginBottom: '8px',
        }}>
          <span>{trend.isGood ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.change).toFixed(1)}% vs prev period</span>
        </div>
      )}
      {sparkPoints.length > 1 && (
        <div style={{ height: '40px', marginTop: '8px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkPoints}>
              <Line type="monotone" dataKey="v" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
