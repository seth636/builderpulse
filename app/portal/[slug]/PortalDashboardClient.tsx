'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PortalHeader, { getDateRange, DateRangeOption } from '../components/PortalHeader';
import PortalMetricCard from '../components/PortalMetricCard';
import PortalTrafficSection from '../components/PortalTrafficSection';
import PortalSEOSection from '../components/PortalSEOSection';
import PortalAdsSection from '../components/PortalAdsSection';
import PortalLeadsSection from '../components/PortalLeadsSection';
import PortalReviewsSection from '../components/PortalReviewsSection';

type Props = {
  slug: string;
  clientName: string;
  clientWebsite: string | null;
  hasGA4: boolean;
  hasGSC: boolean;
  hasMeta: boolean;
  hasGHL: boolean;
  tokenParam: string | null;
  accessMethod: 'token' | 'session' | 'admin';
};

export default function PortalDashboardClient({
  slug,
  clientName,
  clientWebsite,
  hasGA4,
  hasGSC,
  hasMeta,
  hasGHL,
  tokenParam,
}: Props) {
  const defaultRange = getDateRange('last30');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (sd: string, ed: string) => {
    setLoading(true);
    try {
      const tokenQS = tokenParam ? `&token=${tokenParam}` : '';
      const res = await fetch(`/api/portal/${slug}/data?start_date=${sd}&end_date=${ed}${tokenQS}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [slug, tokenParam]);

  useEffect(() => {
    fetchData(startDate, endDate);
  }, [fetchData, startDate, endDate]);

  const handleDateRangeChange = (sd: string, ed: string) => {
    setStartDate(sd);
    setEndDate(ed);
  };

  // Summaries
  const ga4Summary = data?.ga4?.summary;
  const gscSummary = data?.gsc?.summary;
  const ghlSummary = data?.ghl?.summary;
  const reviewsSummary = data?.reviews?.summary;

  const hasGA4Data = hasGA4 && ga4Summary && ga4Summary.totalSessions > 0;
  const hasGSCData = hasGSC && gscSummary;
  const hasMetaData = hasMeta && data?.meta?.summary;
  const hasGHLData = hasGHL && (ghlSummary?.newLeads > 0 || ghlSummary?.appointments > 0);
  const hasReviewsData = data?.reviews?.items?.length > 0;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PortalHeader
        clientName={clientName}
        slug={slug}
        onDateRangeChange={handleDateRangeChange}
      />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Client name + website */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{clientName}</h1>
          {clientWebsite && (
            <a
              href={clientWebsite}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '14px', color: '#0ea5e9', textDecoration: 'none' }}
            >
              {clientWebsite}
            </a>
          )}
        </div>

        {/* Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}>
          <PortalMetricCard
            title="Website Sessions"
            value={hasGA4 ? (ga4Summary?.totalSessions ?? null) : null}
            format="number"
            sparklineData={(data?.ga4?.daily || []).map((r: any) => r.sessions)}
            loading={loading && hasGA4}
            notAvailable={!hasGA4}
          />
          <PortalMetricCard
            title="Total Leads"
            value={hasGHL ? (ghlSummary?.newLeads ?? null) : null}
            format="number"
            loading={loading && hasGHL}
            notAvailable={!hasGHL}
          />
          <PortalMetricCard
            title="Avg Search Position"
            value={hasGSC ? (gscSummary?.avgPosition ?? null) : null}
            format="position"
            loading={loading && hasGSC}
            notAvailable={!hasGSC}
          />
          <PortalMetricCard
            title="Avg Google Rating"
            value={reviewsSummary?.averageRating ?? null}
            format="rating"
            loading={loading}
            notAvailable={!hasReviewsData && !loading}
          />
        </div>

        {/* Traffic */}
        {(hasGA4 || loading) && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
              Website Traffic
            </h2>
            <PortalTrafficSection
              data={data?.ga4}
              loading={loading}
            />
          </section>
        )}

        {/* SEO */}
        {(hasGSC || loading) && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
              SEO Performance
            </h2>
            <PortalSEOSection
              data={data?.gsc}
              loading={loading}
            />
          </section>
        )}

        {/* Ads */}
        {(hasMeta || loading) && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
              Advertising
            </h2>
            <PortalAdsSection
              data={data?.meta}
              loading={loading}
            />
          </section>
        )}

        {/* Leads */}
        {(hasGHL || loading) && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
              Leads & CRM
            </h2>
            <PortalLeadsSection
              data={data?.ghl}
              loading={loading}
            />
          </section>
        )}

        {/* Reviews */}
        {(hasReviewsData || loading) && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
              Reviews
            </h2>
            <PortalReviewsSection
              data={data?.reviews}
              loading={loading}
            />
          </section>
        )}

        {/* Reports link */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Monthly Reports</h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>View and download your monthly marketing reports</p>
          </div>
          <Link
            href={`/portal/${slug}/reports`}
            style={{
              backgroundColor: '#0ea5e9',
              color: 'white',
              textDecoration: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              flexShrink: 0,
            }}
          >
            View Reports →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e5e7eb',
        padding: '20px 24px',
        textAlign: 'center',
        marginTop: '32px',
      }}>
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>
          Powered by{' '}
          <a
            href="https://homebuildermarketers.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '500' }}
          >
            Home Builder Marketers
          </a>
        </p>
      </footer>
    </div>
  );
}
