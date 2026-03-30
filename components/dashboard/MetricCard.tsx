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
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-24 mb-3" />
        <div className="h-8 bg-slate-700 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-20 mb-4" />
        <div className="h-10 bg-slate-700 rounded" />
      </div>
    );
  }

  const trend = getTrend(value, previousValue, format);
  const sparkPoints = sparklineData.map((v, i) => ({ v }));

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
      <p className="text-sm text-slate-400 mb-2">{title}</p>

      {value === null ? (
        <div>
          <p className="text-3xl font-bold text-white mb-1">—</p>
          <Link
            href="/settings/clients"
            className="text-xs text-[#0ea5e9] hover:underline"
          >
            Connect in Settings
          </Link>
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold text-white mb-1">
            {formatValue(value, format)}
          </p>
          {trend !== null && (
            <div className={`flex items-center gap-1 text-xs mb-2 ${trend.isGood ? 'text-[#10b981]' : 'text-red-400'}`}>
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
                    stroke="#0ea5e9"
                    strokeWidth={1.5}
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
