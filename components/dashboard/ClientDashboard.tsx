'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DateRangePicker, { DateRange, getDateRange, getPreviousPeriod } from './DateRangePicker';
const MetricCard = dynamic(() => import('./MetricCard'), { ssr: false, loading: () => <div className="bp-card animate-pulse h-32" /> });
import SkeletonCard from './SkeletonCard';

const TrafficSection = dynamic(() => import('./TrafficSection'), { ssr: false, loading: () => <div className="space-y-6"><SkeletonCard height="h-64" /><SkeletonCard height="h-64" /></div> });
const SEOSection = dynamic(() => import('./SEOSection'), { ssr: false, loading: () => <div className="space-y-6"><SkeletonCard height="h-64" /><SkeletonCard height="h-64" /></div> });
const AdsSection = dynamic(() => import('./AdsSection'), { ssr: false, loading: () => <SkeletonCard height="h-48" /> });
const LeadsSection = dynamic(() => import('./LeadsSection'), { ssr: false, loading: () => <SkeletonCard height="h-48" /> });
const ReviewsSection = dynamic(() => import('./ReviewsSection'), { ssr: false, loading: () => <SkeletonCard height="h-48" /> });

function getHealthScoreColor(score: number): string {
  if (score >= 90) return '#00FFD4';
  if (score >= 70) return '#926BD9';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}
function getHealthScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'Critical';
}

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

  // AI intelligence state
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [insights, setInsights] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<number | null>(null);

  // Load AI data on mount - graceful handling if tables don't exist yet
  useEffect(() => {
    fetch(`/api/clients/${client.slug}/insights?month=${currentMonth}`)
      .then(r => r.ok ? r.json() : { insights: [] })
      .then(d => setInsights(Array.isArray(d.insights) ? d.insights : []))
      .catch(() => setInsights([]));
    fetch(`/api/alerts?clientId=${client.id}&isResolved=false`)
      .then(r => r.ok ? r.json() : { alerts: [] })
      .then(d => setAlerts(Array.isArray(d.alerts) ? d.alerts : []))
      .catch(() => setAlerts([]));
    fetch(`/api/clients/${client.slug}/health`)
      .then(r => r.ok ? r.json() : { score: null })
      .then(d => { if (d.score != null) setHealthScore(d.score); })
      .catch(() => {});
  }, [client.slug, client.id, currentMonth]);

  const handleGenerateInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.slug}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth }),
      });
      if (!res.ok) {
        setInsights([]);
        setInsightsLoading(false);
        return;
      }
      const data = await res.json();
      setInsights(Array.isArray(data?.insights) ? data.insights : []);
    } catch { setInsights([]); }
    setInsightsLoading(false);
  };

  const resolveAlert = async (alertId: number | undefined) => {
    if (alertId == null) return;
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true }),
      });
      setAlerts(prev => (prev || []).filter(a => a?.id !== alertId));
    } catch { /* ignore */ }
  };

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
    const safeGA4 = (raw: any) =>
      raw && raw.summary ? raw : { summary: { totalSessions: 0 }, daily: [] };
    if (client.ga4_property_id) {
      setAnalyticsLoading(true);
      try {
        const [curr, prevA] = await Promise.all([
          fetch(`/api/analytics/${client.slug}?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`).then(r => r.json()).then(safeGA4),
          fetch(`/api/analytics/${client.slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()).then(safeGA4),
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
      {/* Health Score + AI header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {healthScore != null && Number.isFinite(healthScore) && (
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(147, 107, 218, 0.15)" strokeWidth="3"/>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={getHealthScoreColor(healthScore)} strokeWidth="3" strokeDasharray={`${Math.max(0, Math.min(100, healthScore))}, 100`}/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">{Math.round(healthScore)}</span>
              </div>
              <div>
                <div className="text-white text-sm font-semibold">Health Score</div>
                <div className="text-xs" style={{ color: getHealthScoreColor(healthScore) }}>{getHealthScoreLabel(healthScore)}</div>
              </div>
            </div>
          )}
        </div>
        <Link href={`/client/${client.slug}/recommendations`} style={{ fontSize: '13px', padding: '8px 16px', background: 'rgba(147, 107, 218, 0.1)', color: '#FFFFFF', borderRadius: '8px', border: '1px solid rgba(147, 107, 218, 0.2)', textDecoration: 'none', transition: 'all 0.2s ease' }}>
          View Recommendations
        </Link>
      </div>

      {/* Active Alerts */}
      {(alerts || []).filter(a => a && !a.is_resolved).length > 0 && (
        <div className="bg-red-900/10 border border-red-800 rounded-xl p-4 mb-6">
          <h3 className="text-red-400 font-semibold mb-3 text-sm">⚠ Active Alerts ({(alerts || []).filter(a => a && !a.is_resolved).length})</h3>
          {(alerts || []).filter(a => a && !a.is_resolved).slice(0, 5).map((alert: any) => (
            <div key={alert?.id ?? Math.random()} className="flex justify-between items-start py-2 border-b border-red-900/30 last:border-0">
              <div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded mr-2 ${alert?.severity === 'critical' ? 'bg-red-800 text-red-200' : 'bg-amber-800 text-amber-200'}`}>
                  {(alert?.severity ?? 'warning').toUpperCase()}
                </span>
                <span className="text-white text-sm font-medium">{alert?.title ?? 'Alert'}</span>
                <p className="text-gray-400 text-xs mt-0.5">{alert?.description ?? ''}</p>
              </div>
              <button onClick={() => resolveAlert(alert?.id)} className="text-xs text-gray-500 hover:text-white ml-4 flex-shrink-0">Resolve</button>
            </div>
          ))}
        </div>
      )}

      {/* AI Insights Card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(147, 107, 218, 0.08) 0%, rgba(13, 17, 23, 0.95) 50%, rgba(0, 0, 0, 0.98) 100%)', border: '1px solid rgba(147, 107, 218, 0.15)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold text-base">AI Insights — {currentMonth}</h2>
          <button onClick={handleGenerateInsights} disabled={insightsLoading} className="btn-teal text-sm disabled:opacity-50">
            {insightsLoading ? 'Generating...' : insights.length > 0 ? 'Regenerate' : 'Generate Insights'}
          </button>
        </div>
        {(insights || []).length === 0 ? (
          <p className="text-gray-400 text-sm">No insights yet. Click "Generate Insights" to analyze this month's performance.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(insights || []).map((insight: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border ${insight?.type === 'positive' ? 'bg-green-900/20 border-green-800' : insight?.type === 'negative' ? 'bg-red-900/20 border-red-800' : 'bg-blue-900/20 border-blue-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{insight?.type === 'positive' ? '✅' : insight?.type === 'negative' ? '🚨' : 'ℹ️'}</span>
                  <span className="font-semibold text-sm text-white">{insight?.title ?? 'Insight'}</span>
                </div>
                <p className="text-gray-300 text-sm">{insight?.body ?? ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div id="overview" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">{client.name}</h2>
          {client.website_url && (
            <a href={client.website_url} target="_blank" rel="noopener noreferrer" style={{ color: '#00FFD4', fontSize: '14px', textDecoration: 'none' }}>
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
