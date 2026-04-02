'use client';

import Link from 'next/link';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

type Format = 'number' | 'percentage' | 'position';

type Props = {
  title: string;
  value: number | null;
  previousValue: number | null;
  format: Format;
  sparklineData?: number[];
  loading?: boolean;
  icon?: React.ReactNode;
  accentColor?: string;
};

function formatValue(val: number, format: Format): string {
  if (format === 'number') {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 10_000) return (val / 1_000).toFixed(1) + 'K';
    return val.toLocaleString();
  }
  if (format === 'percentage') return val.toFixed(1) + '%';
  if (format === 'position') return '#' + val.toFixed(1);
  return String(val);
}

function getTrend(value: number | null, previousValue: number | null, format: Format) {
  if (value === null || previousValue === null || previousValue === 0) return null;
  const change = ((value - previousValue) / previousValue) * 100;
  const isPosition = format === 'position';
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
  accentColor = '#926BD9',
}: Props) {
  if (loading) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '20px',
        minHeight: '130px',
      }}>
        <div style={{ height: '10px', background: 'rgba(147,107,218,0.12)', borderRadius: '4px', width: '60%', marginBottom: '14px' }} />
        <div style={{ height: '32px', background: 'rgba(147,107,218,0.1)', borderRadius: '6px', width: '50%', marginBottom: '8px' }} />
        <div style={{ height: '8px', background: 'rgba(147,107,218,0.08)', borderRadius: '4px', width: '40%' }} />
      </div>
    );
  }

  const trend = getTrend(value, previousValue, format);
  const sparkPoints = sparklineData.map((v) => ({ v }));
  const trendColor = trend === null ? '#64748b' : trend.isGood ? '#00FFD4' : '#EF4444';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '20px',
      transition: 'border-color 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow accent top-right */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '80px', height: '80px',
        background: `radial-gradient(circle, ${accentColor}14 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Label */}
      <p style={{
        fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
        letterSpacing: '0.09em', color: '#6b6b7e', marginBottom: '10px',
      }}>
        {title}
      </p>

      {value === null ? (
        <div>
          <p style={{ fontSize: '30px', fontWeight: '700', color: '#3d3d52', marginBottom: '6px', lineHeight: 1 }}>—</p>
          <Link href="/settings/clients" style={{ fontSize: '12px', color: '#926BD9', textDecoration: 'none' }}>
            Connect data source
          </Link>
        </div>
      ) : (
        <>
          {/* Value */}
          <p style={{ fontSize: '30px', fontWeight: '700', color: '#FFFFFF', lineHeight: 1, marginBottom: '6px' }}>
            {formatValue(value, format)}
          </p>

          {/* Trend badge */}
          {trend !== null ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', fontWeight: '500', color: trendColor,
              background: `${trendColor}12`,
              padding: '3px 8px', borderRadius: '999px',
            }}>
              <span style={{ fontSize: '10px' }}>{trend.isGood ? '▲' : '▼'}</span>
              {Math.abs(trend.change).toFixed(1)}%
              <span style={{ color: '#64748b', fontWeight: '400' }}>vs prev</span>
            </div>
          ) : (
            <div style={{ height: '22px' }} />
          )}

          {/* Sparkline */}
          {sparkPoints.length > 2 && (
            <div style={{ height: '40px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkPoints}>
                  <defs>
                    <linearGradient id={`sg-${title.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone" dataKey="v"
                    stroke={accentColor} strokeWidth={1.5}
                    fill={`url(#sg-${title.replace(/\s/g,'')})`}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: '6px', fontSize: '11px', padding: '4px 8px' }}
                    itemStyle={{ color: accentColor }}
                    labelFormatter={() => ''}
                    formatter={(v: any) => [typeof v === 'number' ? v.toLocaleString() : v, '']}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
