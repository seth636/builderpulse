'use client';

import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

type Format = 'number' | 'percentage' | 'position';

type Props = {
  title: string;
  value: number | null;
  previousValue: number | null;
  format: Format;
  sparklineData?: number[];
  loading?: boolean;
};

function formatValue(val: number, format: Format): string {
  if (format === 'number') return val.toLocaleString();
  if (format === 'percentage') return val.toFixed(1) + '%';
  if (format === 'position') return val.toFixed(1);
  return String(val);
}

function getTrend(value: number | null, previousValue: number | null, format: Format) {
  if (value === null || previousValue === null || previousValue === 0) return null;
  const change = ((value - previousValue) / previousValue) * 100;
  const isPosition = format === 'position';
  // For position: lower number = better, so negative change = green
  const isGood = isPosition ? change < 0 : change > 0;
  return { change, isGood };
}

export default function MetricCard({
  title,
  value,
  previousValue,
  format,
  sparklineData = [],
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div className="bp-card animate-pulse">
        <div className="h-4 bg-[rgba(147,107,218,0.15)] rounded w-24 mb-3" />
        <div className="h-8 bg-[rgba(147,107,218,0.15)] rounded w-32 mb-2" />
        <div className="h-3 bg-[rgba(147,107,218,0.15)] rounded w-20 mb-4" />
        <div className="h-10 bg-[rgba(147,107,218,0.15)] rounded" />
      </div>
    );
  }

  const trend = getTrend(value, previousValue, format);
  const sparkPoints = sparklineData.map((v, i) => ({ v }));

  return (
    <div className="bp-card card-fade-in">
      <p style={{
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#6b6b7e',
        marginBottom: '12px',
      }}>{title}</p>

      {value === null ? (
        <div>
          <p style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: '4px',
          }}>—</p>
          <Link
            href="/settings/clients"
            style={{
              fontSize: '12px',
              color: '#00FFD4',
              textDecoration: 'none',
            }}
          >
            Connect in Settings
          </Link>
        </div>
      ) : (
        <>
          <p style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: '4px',
          }} className="number-count-up">
            {formatValue(value, format)}
          </p>
          {trend !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              marginBottom: '8px',
              color: trend.isGood ? '#00FFD4' : '#EF4444',
            }}>
              <span>{trend.isGood ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.change).toFixed(1)}% vs prev period</span>
            </div>
          )}
          {sparkPoints.length > 1 && (
            <div className="h-10 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkPoints}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#926BD9"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
