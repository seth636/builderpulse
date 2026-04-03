'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';
import SkeletonCard from '@/components/dashboard/SkeletonCard';

const ReviewsSection = dynamic(() => import('@/components/dashboard/ReviewsSection'), {
  ssr: false,
  loading: () => <SkeletonCard height="h-48" />,
});

export default function ReviewsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [clientName, setClientName] = useState('');
  const [hasGHL, setHasGHL] = useState(false);

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
        <TopBar title={clientName ? `${clientName} — Reviews` : 'Reviews'} />
        <div style={{ padding: '32px' }}>
          <ReviewsSection slug={slug} hasGHL={hasGHL} />
        </div>
      </div>
    </div>
  );
}
