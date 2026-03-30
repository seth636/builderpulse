'use client';

import { useState, useEffect } from 'react';

export type DateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

export function getDateRange(preset: string): DateRange {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const today = fmt(now);

  switch (preset) {
    case 'last7': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { startDate: fmt(start), endDate: today, label: 'Last 7 days' };
    }
    case 'last30': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { startDate: fmt(start), endDate: today, label: 'Last 30 days' };
    }
    case 'last90': {
      const start = new Date(now);
      start.setDate(start.getDate() - 89);
      return { startDate: fmt(start), endDate: today, label: 'Last 90 days' };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: fmt(start), endDate: today, label: 'This month' };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: fmt(start), endDate: fmt(end), label: 'Last month' };
    }
    default:
      return { startDate: '', endDate: today, label: 'Custom range' };
  }
}

export function getPreviousPeriod(start: string, end: string): { start: string; end: string } {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const prevEnd = new Date(s);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { start: fmt(prevStart), end: fmt(prevEnd) };
}

const PRESETS = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];

type Props = {
  onChange: (range: DateRange) => void;
};

export default function DateRangePicker({ onChange }: Props) {
  const [preset, setPreset] = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (preset !== 'custom') {
      onChange(getDateRange(preset));
      setShowCustom(false);
    } else {
      setShowCustom(true);
    }
  }, [preset]);

  const applyCustom = () => {
    if (customStart && customEnd) {
      onChange({ startDate: customStart, endDate: customEnd, label: 'Custom range' });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
        className="bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#0ea5e9]"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-[#1e293b] border border-[#334155] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#0ea5e9]"
          />
          <button
            onClick={applyCustom}
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-sm rounded-lg px-3 py-2 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
