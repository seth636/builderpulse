'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type DateRangeOption = 'last30' | 'last90' | 'last180' | 'thisYear';

type Props = {
  clientName: string;
  slug: string;
  onDateRangeChange?: (startDate: string, endDate: string, label: string) => void;
};

function getDateRange(option: DateRangeOption): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  
  if (option === 'last30') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate: start, endDate: end, label: 'Last 30 days' };
  }
  if (option === 'last90') {
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate: start, endDate: end, label: 'Last 3 months' };
  }
  if (option === 'last180') {
    const start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate: start, endDate: end, label: 'Last 6 months' };
  }
  if (option === 'thisYear') {
    const start = `${now.getFullYear()}-01-01`;
    return { startDate: start, endDate: end, label: 'This year' };
  }
  return { startDate: end, endDate: end, label: '' };
}

export { getDateRange };
export type { DateRangeOption };

export default function PortalHeader({ clientName, slug, onDateRangeChange }: Props) {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('last30');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleRangeChange = (range: DateRangeOption) => {
    setSelectedRange(range);
    if (onDateRangeChange) {
      const dr = getDateRange(range);
      onDateRangeChange(dr.startDate, dr.endDate, dr.label);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/portal/logout', { method: 'POST' });
    } catch {}
    router.push('/portal/login');
  };

  const options: { value: DateRangeOption; label: string }[] = [
    { value: 'last30', label: 'Last 30 days' },
    { value: 'last90', label: 'Last 3 months' },
    { value: 'last180', label: 'Last 6 months' },
    { value: 'thisYear', label: 'This year' },
  ];

  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '22px', fontWeight: '800', color: '#0ea5e9', letterSpacing: '-0.5px' }}>HBM</span>
          <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500', display: 'none' }} className="sm:block">
            Home Builder Marketers
          </span>
        </div>

        {/* Client Name */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{clientName}</span>
        </div>

        {/* Right: date range + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <select
            value={selectedRange}
            onChange={e => handleRangeChange(e.target.value as DateRangeOption)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '13px',
              color: '#374151',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              color: '#6b7280',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {loggingOut ? '...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </header>
  );
}
