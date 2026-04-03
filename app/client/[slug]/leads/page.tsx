'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';
import DateRangePicker, { DateRange, getDateRange } from '@/components/dashboard/DateRangePicker';
import SkeletonCard from '@/components/dashboard/SkeletonCard';

const LeadsSection = dynamic(() => import('@/components/dashboard/LeadsSection'), {
  ssr: false,
  loading: () => <SkeletonCard height="h-48" />,
});

export default function LeadsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [clientName, setClientName] = useState('');
  const [hasGHL, setHasGHL] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('last30'));

  useEffect(() => {
    fetch(`/api/clients/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.name) setClientName(d.name);
        if (d?.ghl_location_id) setHasGHL(true);
      })
      .catch(() => {});
  }, [slug]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <ClientSidebar clientName={clientName || '...'} clientSlug={slug} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <TopBar title={clientName ? `${clientName} — Leads` : 'Leads'} />
        <div style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <DateRangePicker onChange={setDateRange} />
          </div>
          <LeadsSection
            slug={slug}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            hasGHL={hasGHL}
          />
        </div>
      </div>
    </div>
  );
}
