'use client';

import { useState, useEffect, useCallback } from 'react';
import DateRangePicker, { DateRange, getDateRange, getPreviousPeriod } from './DateRangePicker';
import MetricCard from './MetricCard';
import TrafficSection from './TrafficSection';
import SEOSection from './SEOSection';

type Client = {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  ga4_property_id: string | null;
  gsc_site_url: string | null;
};

type Props = {
  client: Client;
};

export default function ClientDashboard({ client }: Props) {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('last30'));

  // Analytics summary state
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    totalSessions: number;
    sparkline: number[];
    prevSessions: number;
  } | null>(null);

  // GSC summary state
  const [gscLoading, setGscLoading] = useState(true);
  const [gscSummary, setGscSummary] = useState<{
    avgPosition: number;
    sparkline: number[];
    prevPosition: number;
  } | null>(null);

  const fetchSummaries = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    const prev = getPreviousPeriod(dateRange.startDate, dateRange.endDate);

    // GA4 summary
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
    } catch {
      setAnalyticsSummary(null);
    } finally {
      setAnalyticsLoading(false);
    }

    // GSC summary
    setGscLoading(true);
    try {
      const [curr, prevG] = await Promise.all([
        fetch(`/api/search-console/${client.slug}?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`).then(r => r.json()),
        fetch(`/api/search-console/${client.slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()),
      ]);
      const pos = curr.summary?.avgPosition ?? null;
      const prevPos = prevG.summary?.avgPosition ?? null;
      setGscSummary(pos !== null ? {
        avgPosition: pos,
        sparkline: (curr.daily || []).map((r: any) => r.clicks),
        prevPosition: prevPos ?? 0,
      } : null);
    } catch {
      setGscSummary(null);
    } finally {
      setGscLoading(false);
    }
  }, [client.slug, dateRange.startDate, dateRange.endDate]);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  const hasGA4 = !!client.ga4_property_id;
  const hasGSC = !!client.gsc_site_url;

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
          value={hasGA4 ? (analyticsSummary?.totalSessions ?? (analyticsLoading ? null : 0)) : null}
          previousValue={analyticsSummary?.prevSessions ?? null}
          format="number"
          sparklineData={analyticsSummary?.sparkline}
          loading={analyticsLoading && hasGA4}
        />
        <MetricCard
          title="Total Leads"
          value={null}
          previousValue={null}
          format="number"
        />
        <MetricCard
          title="Avg Google Position"
          value={hasGSC ? (gscSummary?.avgPosition ?? (gscLoading ? null : null)) : null}
          previousValue={gscSummary?.prevPosition ?? null}
          format="position"
          sparklineData={gscSummary?.sparkline}
          loading={gscLoading && hasGSC}
        />
        <MetricCard
          title="Google Reviews"
          value={null}
          previousValue={null}
          format="number"
        />
      </div>

      {/* Section 1 — Traffic */}
      <section id="traffic" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Website Traffic</h2>
        <TrafficSection slug={client.slug} startDate={dateRange.startDate} endDate={dateRange.endDate} />
      </section>

      {/* Section 2 — SEO */}
      <section id="seo" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">SEO Performance</h2>
        <SEOSection slug={client.slug} startDate={dateRange.startDate} endDate={dateRange.endDate} />
      </section>

      {/* Section 3 — Ads (Phase 4 placeholder) */}
      <section id="ads" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Advertising</h2>
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm">Meta Ads — Coming in Phase 4</p>
        </div>
      </section>

      {/* Section 4 — Leads (Phase 4 placeholder) */}
      <section id="leads" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Leads & CRM</h2>
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm">GHL Leads & Appointments — Coming in Phase 4</p>
        </div>
      </section>

      {/* Section 5 — Reviews (Phase 4 placeholder) */}
      <section id="reviews" className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Reviews</h2>
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm">Google Reviews — Coming in Phase 4</p>
        </div>
      </section>
    </div>
  );
}
