'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DateRangePicker, { DateRange, getDateRange, getPreviousPeriod } from './DateRangePicker';
import MetricCard from './MetricCard';
import TrafficSection from './TrafficSection';
import SEOSection from './SEOSection';
import AdsSection from './AdsSection';
import LeadsSection from './LeadsSection';
import ReviewsSection from './ReviewsSection';

type Client = {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  ga4_property_id: string | null;
  gsc_site_url: string | null;
  meta_ad_account_id: string | null;
  ghl_location_id: string | null;
};

type Props = { client: Client };

export default function ClientDashboard({ client }: Props) {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('last30'));

  // Analytics summary
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsSummary, setAnalyticsSummary] = useState<{ totalSessions: number; sparkline: number[]; prevSessions: number } | null>(null);

  // GSC summary
  const [gscLoading, setGscLoading] = useState(true);
  const [gscSummary, setGscSummary] = useState<{ avgPosition: number; sparkline: number[]; prevPosition: number } | null>(null);

  // Leads summary
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsSummary, setLeadsSummary] = useState<{ count: number; prevCount: number } | null>(null);

  // Reviews summary
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsSummary, setReviewsSummary] = useState<{ totalReviews: number; avgRating: number } | null>(null);

  const fetchSummaries = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    const prev = getPreviousPeriod(dateRange.startDate, dateRange.endDate);

    // GA4
    if (client.ga4_property_id) {
      setAnalyticsLoading(true);
      try {
        const [curr, prevA] = await Promise.all([
          fetch(`/api/analytics/${client.slug}?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`).then(r => r.json()),
          fetch(`/api/analytics/${client.slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()),
        ]);
        setAnalyticsSummary({
          totalSessions: curr.summary?.totalSessions ?? 0,
          sparkline: (curr.daily || []).map((r: any) => r.sessions),
          prevSessions: prevA.summary?.totalSessions ?? 0,
        });
      } catch { setAnalyticsSummary(null); }
      finally { setAnalyticsLoading(false); }
    } else { setAnalyticsLoading(false); }

    // GSC
    if (client.gsc_site_url) {
      setGscLoading(true);
      try {
        const [curr, prevG] = await Promise.all([
          fetch(`/api/search-console/${client.slug}?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`).then(r => r.json()),
          fetch(`/api/search-console/${client.slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()),
        ]);
        const pos = curr.summary?.avgPosition ?? null;
        if (pos !== null) {
          setGscSummary({ avgPosition: pos, sparkline: (curr.daily || []).map((r: any) => r.clicks), prevPosition: prevG.summary?.avgPosition ?? 0 });
        } else { setGscSummary(null); }
      } catch { setGscSummary(null); }
      finally { setGscLoading(false); }
    } else { setGscLoading(false); }

    // Leads
    if (client.ghl_location_id) {
      setLeadsLoading(true);
      try {
        const [curr, prevL] = await Promise.all([
          fetch(`/api/leads/${client.slug}?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`).then(r => r.json()),
          fetch(`/api/leads/${client.slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()),
        ]);
        setLeadsSummary({ count: curr.summary?.newLeads ?? 0, prevCount: prevL.summary?.newLeads ?? 0 });
      } catch { setLeadsSummary(null); }
      finally { setLeadsLoading(false); }
    } else { setLeadsLoading(false); }

    // Reviews
    if (client.ghl_location_id) {
      setReviewsLoading(true);
      try {
        const res = await fetch(`/api/reviews/${client.slug}`).then(r => r.json());
        setReviewsSummary({ totalReviews: res.summary?.totalReviews ?? 0, avgRating: res.summary?.averageRating ?? 0 });
      } catch { setReviewsSummary(null); }
      finally { setReviewsLoading(false); }
    } else { setReviewsLoading(false); }
  }, [client.slug, client.ga4_property_id, client.gsc_site_url, client.ghl_location_id, dateRange.startDate, dateRange.endDate]);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  return (
    <div>
      {/* Header */}
      <div id="overview" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">{client.name}</h2>
          {client.website_url && (
            <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-[#0ea5e9] text-sm hover:underline">
              {client.website_url}
            </a>
          )}
        </div>
        <DateRangePicker onChange={setDateRange} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <MetricCard
          title="Sessions"
          value={client.ga4_property_id ? (analyticsSummary?.totalSessions ?? (analyticsLoading ? null : 0)) : null}
          previousValue={analyticsSummary?.prevSessions ?? null}
          format="number"
          sparklineData={analyticsSummary?.sparkline}
          loading={analyticsLoading && !!client.ga4_property_id}
        />
        <MetricCard
          title="Total Leads"
          value={client.ghl_location_id ? (leadsSummary?.count ?? (leadsLoading ? null : 0)) : null}
          previousValue={leadsSummary?.prevCount ?? null}
          format="number"
          loading={leadsLoading && !!client.ghl_location_id}
        />
        <MetricCard
          title="Avg Google Position"
          value={client.gsc_site_url ? (gscSummary?.avgPosition ?? (gscLoading ? null : null)) : null}
          previousValue={gscSummary?.prevPosition ?? null}
          format="position"
          sparklineData={gscSummary?.sparkline}
          loading={gscLoading && !!client.gsc_site_url}
        />
        <MetricCard
          title="Google Reviews"
          value={client.ghl_location_id ? (reviewsSummary?.totalReviews ?? (reviewsLoading ? null : null)) : null}
          previousValue={null}
          format="number"
          loading={reviewsLoading && !!client.ghl_location_id}
        />
      </div>

      {/* Section 1 — Traffic */}
      <section id="traffic" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Website Traffic</h2>
        <TrafficSection slug={client.slug} startDate={dateRange.startDate} endDate={dateRange.endDate} />
      </section>

      {/* Section 2 — SEO */}
      <section id="seo" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">SEO Performance</h2>
          <div className="flex gap-2">
            <Link href={`/client/${client.slug}/seo/keywords`} className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-border">
              View Keywords
            </Link>
            <Link href={`/client/${client.slug}/seo/audit`} className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-border">
              Run Audit
            </Link>
            <Link href={`/client/${client.slug}/seo/backlinks`} className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-border">
              View Backlinks
            </Link>
          </div>
        </div>
        <SEOSection slug={client.slug} startDate={dateRange.startDate} endDate={dateRange.endDate} />
      </section>

      {/* Section 3 — Ads */}
      <section id="ads" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Advertising</h2>
        <AdsSection
          slug={client.slug}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          hasMetaAccount={!!client.meta_ad_account_id}
        />
      </section>

      {/* Section 4 — Leads */}
      <section id="leads" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Leads & CRM</h2>
        <LeadsSection
          slug={client.slug}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          hasGHL={!!client.ghl_location_id}
        />
      </section>

      {/* Section 5 — Reviews */}
      <section id="reviews" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Reviews</h2>
        <ReviewsSection slug={client.slug} hasGHL={!!client.ghl_location_id} />
      </section>
    </div>
  );
}
