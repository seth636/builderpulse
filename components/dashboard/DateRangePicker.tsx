'use client';

import { useState, useEffect, useRef } from 'react';

export type DateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

export function getDateRange(preset: string): DateRange {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);

  switch (preset) {
    case 'last7': {
      const s = new Date(now); s.setDate(s.getDate() - 6);
      return { startDate: fmt(s), endDate: today, label: 'Last 7 days' };
    }
    case 'last30': {
      const s = new Date(now); s.setDate(s.getDate() - 29);
      return { startDate: fmt(s), endDate: today, label: 'Last 30 days' };
    }
    case 'last90': {
      const s = new Date(now); s.setDate(s.getDate() - 89);
      return { startDate: fmt(s), endDate: today, label: 'Last 90 days' };
    }
    case 'thisMonth': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: fmt(s), endDate: today, label: 'This month' };
    }
    case 'lastMonth': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: fmt(s), endDate: fmt(e), label: 'Last month' };
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
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { start: fmt(prevStart), end: fmt(prevEnd) };
}

const PRESETS = [
  { value: 'last7', label: 'Last 7D' },
  { value: 'last30', label: 'Last 30D' },
  { value: 'last90', label: 'Last 90D' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

type Props = { onChange: (range: DateRange) => void };

export default function DateRangePicker({ onChange }: Props) {
  const [preset, setPreset] = useState('last30');
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preset !== 'custom') onChange(getDateRange(preset));
  }, [preset]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowCustom(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyCustom = () => {
    if (customStart && customEnd) {
      onChange({ startDate: customStart, endDate: customEnd, label: 'Custom range' });
      setShowCustom(false);
    }
  };

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {/* Segment buttons */}
      <div style={{
        display: 'flex', gap: '2px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '9px', padding: '3px',
      }}>
        {PRESETS.map(p => {
          const active = preset === p.value;
          return (
            <button
              key={p.value}
              onClick={() => { setPreset(p.value); setShowCustom(false); }}
              style={{
                padding: '6px 13px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: active ? '600' : '400',
                color: active ? '#FFFFFF' : '#8b8b9e',
                background: active ? 'rgba(147,107,218,0.18)' : 'transparent',
                transition: 'all 0.15s ease',
                outline: 'none',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom range button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setPreset('custom'); setShowCustom(v => !v); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 13px', borderRadius: '8px',
            border: `1px solid ${preset === 'custom' ? 'rgba(147,107,218,0.4)' : 'rgba(255,255,255,0.09)'}`,
            background: preset === 'custom' ? 'rgba(147,107,218,0.12)' : 'rgba(255,255,255,0.03)',
            color: preset === 'custom' ? '#c4c4ff' : '#8b8b9e',
            fontSize: '12px', fontWeight: '500',
            cursor: 'pointer', outline: 'none', transition: 'all 0.15s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Custom
        </button>

        {showCustom && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            background: '#0d0d1a', border: '1px solid rgba(147,107,218,0.2)',
            borderRadius: '12px', padding: '16px', zIndex: 100,
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            minWidth: '280px',
          }}>
            <p style={{ fontSize: '11px', color: '#6b6b7e', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Custom Range
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#8b8b9e', display: 'block', marginBottom: '4px' }}>From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '7px', color: '#FFFFFF',
                    fontSize: '13px', padding: '8px 10px', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#8b8b9e', display: 'block', marginBottom: '4px' }}>To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '7px', color: '#FFFFFF',
                    fontSize: '13px', padding: '8px 10px', outline: 'none',
                  }}
                />
              </div>
            </div>
            <button
              onClick={applyCustom}
              disabled={!customStart || !customEnd}
              style={{
                width: '100%', padding: '9px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #926BD9, #00FFD4)',
                color: '#000', fontWeight: '700', fontSize: '13px',
                border: 'none', cursor: 'pointer', outline: 'none',
                opacity: (!customStart || !customEnd) ? 0.4 : 1,
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
