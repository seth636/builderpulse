'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';
import DateRangePicker, { DateRange, getDateRange } from '@/components/dashboard/DateRangePicker';
import SkeletonCard from '@/components/dashboard/SkeletonCard';

const AdsSection = dynamic(() => import('@/components/dashboard/AdsSection'), {
  ssr: false,
  loading: () => <SkeletonCard height="h-48" />,
});

export default function AdsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [clientName, setClientName] = useState('');
  const [hasMetaAccount, setHasMetaAccount] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('last30'));

  useEffect(() => {
    fetch(`/api/clients/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.name) setClientName(d.name); if (d?.meta_ad_account_id) setHasMetaAccount(true); })
      .catch(() => {});
  }, [slug]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <ClientSidebar clientName={clientName || '...'} clientSlug={slug} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <TopBar title={clientName ? `${clientName} — Ads` : 'Ads'} />
        <div style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <DateRangePicker onChange={setDateRange} />
          </div>
          <AdsSection
            slug={slug}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            hasMetaAccount={hasMetaAccount}
          />
        </div>
      </div>
    </div>
  );
}
