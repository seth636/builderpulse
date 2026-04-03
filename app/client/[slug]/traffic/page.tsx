'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';
import DateRangePicker, { DateRange, getDateRange } from '@/components/dashboard/DateRangePicker';
import SkeletonCard from '@/components/dashboard/SkeletonCard';

const TrafficSection = dynamic(() => import('@/components/dashboard/TrafficSection'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SkeletonCard height="h-72" />
      <SkeletonCard height="h-64" />
    </div>
  ),
});

export default function TrafficPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [clientName, setClientName] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('last30'));

  useEffect(() => {
    fetch(`/api/clients/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name) setClientName(d.name); })
      .catch(() => {});
  }, [slug]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <ClientSidebar clientName={clientName || '...'} clientSlug={slug} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <TopBar title={clientName ? `${clientName} — Traffic` : 'Traffic'} />
        <div style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <DateRangePicker onChange={setDateRange} />
          </div>
          <TrafficSection
            slug={slug}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </div>
      </div>
    </div>
  );
}
