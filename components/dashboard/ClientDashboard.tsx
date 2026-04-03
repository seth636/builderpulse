'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DateRangePicker, { DateRange, getDateRange, getPreviousPeriod } from './DateRangePicker';
const MetricCard = dynamic(() => import('./MetricCard'), { ssr: false, loading: () => <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', height: '130px', animation: 'pulse 1.5s infinite' }} /> });
import SkeletonCard from './SkeletonCard';

const TrafficSection = dynamic(() => import('./TrafficSection'), { ssr: false, loading: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><SkeletonCard height="h-72" /><SkeletonCard height="h-64" /></div> });
const SEOSection = dynamic(() => import('./SEOSection'), { ssr: false, loading: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><SkeletonCard height="h-72" /><SkeletonCard height="h-64" /></div> });
const AdsSection = dynamic(() => import('./AdsSection'), { ssr: false, loading: () => <SkeletonCard height="h-48" /> });
const LeadsSection = dynamic(() => import('./LeadsSection'), { ssr: false, loading: () => <SkeletonCard height="h-48" /> });
const ReviewsSection = dynamic(() => import('./ReviewsSection'), { ssr: false, loading: () => <SkeletonCard height="h-48" /> });

function getHealthColor(score: number) {
  if (score >= 90) return '#00FFD4';
  if (score >= 70) return '#926BD9';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}
function getHealthLabel(score: number) {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'Critical';
}

type Client = {
  id: number; name: string; slug: string; website_url: string | null;
  ga4_property_id: string | null; gsc_site_url: string | null;
  meta_ad_account_id: string | null; ghl_location_id: string | null;
};

export default function ClientDashboard({ client }: { client: Client }) {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('last30'));

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [insights, setInsights] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<number | null>(null);

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth }),
      });
      const data = await res.json();
      setInsights(Array.isArray(data?.insights) ? data.insights : []);
    } catch { setInsights([]); }
    setInsightsLoading(false);
  };

  const resolveAlert = async (alertId: number | undefined) => {
    if (alertId == null) return;
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true }),
      });
      setAlerts(prev => prev.filter(a => a?.id !== alertId));
    } catch { }
  };

  // Analytics summary
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsSummary, setAnalyticsSummary] = useState<{ totalSessions: number; sparkline: number[]; prevSessions: number } | null>(null);
  const [gscLoading, setGscLoading] = useState(true);
  const [gscSummary, setGscSummary] = useState<{ avgPosition: number; sparkline: number[]; prevPosition: number } | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsSummary, setLeadsSummary] = useState<{ count: number; prevCount: number } | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsSummary, setReviewsSummary] = useState<{ totalReviews: number; avgRating: number } | null>(null);
  const [clickupLoading, setClickupLoading] = useState(true);
  const [clickupSummary, setClickupSummary] = useState<{ completedThisWeek: number; completionRate: number } | null>(null);

  const fetchSummaries = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    const prev = getPreviousPeriod(dateRange.startDate, dateRange.endDate);

    const safeGA4 = (raw: any) => raw && raw.summary ? raw : { summary: { totalSessions: 0 }, daily: [] };

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

    if (client.gsc_site_url) {
      setGscLoading(true);
      try {
        const [curr, prevG] = await Promise.all([
          fetch(`/api/search-console/${client.slug}?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`).then(r => r.json()),
          fetch(`/api/search-console/${client.slug}?start_date=${prev.start}&end_date=${prev.end}`).then(r => r.json()),
        ]);
        const pos = curr.summary?.avgPosition ?? null;
        if (pos !== null) setGscSummary({ avgPosition: pos, sparkline: (curr.daily || []).map((r: any) => r.clicks), prevPosition: prevG.summary?.avgPosition ?? 0 });
        else setGscSummary(null);
      } catch { setGscSummary(null); }
      finally { setGscLoading(false); }
    } else { setGscLoading(false); }

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

    if (client.ghl_location_id) {
      setReviewsLoading(true);
      try {
        const res = await fetch(`/api/reviews/${client.slug}`).then(r => r.json());
        setReviewsSummary({ totalReviews: res.summary?.totalReviews ?? 0, avgRating: res.summary?.averageRating ?? 0 });
      } catch { setReviewsSummary(null); }
      finally { setReviewsLoading(false); }
    } else { setReviewsLoading(false); }

    // ClickUp
    setClickupLoading(true);
    try {
      const res = await fetch(`/api/clickup/${client.slug}`).then(r => r.json());
      if (res.connected && res.summary) {
        setClickupSummary({ completedThisWeek: res.summary.completedThisWeek, completionRate: res.summary.completionRate });
      } else {
        setClickupSummary(null);
      }
    } catch { setClickupSummary(null); }
    finally { setClickupLoading(false); }
  }, [client.slug, client.ga4_property_id, client.gsc_site_url, client.ghl_location_id, dateRange.startDate, dateRange.endDate]);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  const activeAlerts = (alerts || []).filter(a => a && !a.is_resolved);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Client Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: '20px', flexWrap: 'wrap', marginBottom: '24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px', padding: '22px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {healthScore != null && Number.isFinite(healthScore) && (
            <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '60px', height: '60px', transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="rgba(147,107,218,0.15)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={getHealthColor(healthScore)} strokeWidth="3"
                  strokeDasharray={`${Math.max(0, Math.min(100, healthScore))}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)', fontWeight: '700', fontSize: '13px',
              }}>{Math.round(healthScore)}</span>
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px' }}>{client.name}</h2>
            {client.website_url && (
              <a href={client.website_url} target="_blank" rel="noopener noreferrer"
                style={{ color: '#00FFD4', fontSize: '13px', textDecoration: 'none' }}>
                {client.website_url}
              </a>
            )}
            {healthScore != null && (
              <div style={{ marginTop: '4px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '600',
                  color: getHealthColor(healthScore),
                  background: `${getHealthColor(healthScore)}15`,
                  padding: '2px 9px', borderRadius: '999px',
                }}>
                  {getHealthLabel(healthScore)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <DateRangePicker onChange={setDateRange} />
          <Link href={`/client/${client.slug}/recommendations`}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              background: 'rgba(147,107,218,0.1)', color: 'var(--text-primary)',
              border: '1px solid rgba(147,107,218,0.2)',
              fontSize: '13px', fontWeight: '500', textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
            Recommendations
          </Link>
        </div>
      </div>

      {/* ── Active Alerts ── */}
      {activeAlerts.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '14px', padding: '18px 20px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF444480' }} />
            <h3 style={{ color: '#EF4444', fontWeight: '600', fontSize: '13px', margin: 0 }}>
              Active Alerts ({activeAlerts.length})
            </h3>
          </div>
          {activeAlerts.slice(0, 5).map((alert: any) => (
            <div key={alert?.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '10px 0', borderBottom: '1px solid rgba(239,68,68,0.12)',
            }}>
              <div>
                <span style={{
                  fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px',
                  marginRight: '8px',
                  background: alert?.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                  color: alert?.severity === 'critical' ? '#f87171' : '#fbbf24',
                }}>
                  {(alert?.severity ?? 'warning').toUpperCase()}
                </span>
                <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500' }}>{alert?.title}</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>{alert?.description}</p>
              </div>
              <button onClick={() => resolveAlert(alert?.id)}
                style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: '16px', padding: '4px 8px', borderRadius: '6px' }}>
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <MetricCard
          title="Sessions"
          value={client.ga4_property_id ? (analyticsSummary?.totalSessions ?? (analyticsLoading ? null : 0)) : null}
          previousValue={analyticsSummary?.prevSessions ?? null}
          format="number"
          sparklineData={analyticsSummary?.sparkline}
          loading={analyticsLoading && !!client.ga4_property_id}
          accentColor="#0ea5e9"
        />
        <MetricCard
          title="Total Leads"
          value={client.ghl_location_id ? (leadsSummary?.count ?? (leadsLoading ? null : 0)) : null}
          previousValue={leadsSummary?.prevCount ?? null}
          format="number"
          loading={leadsLoading && !!client.ghl_location_id}
          accentColor="#00FFD4"
        />
        <MetricCard
          title="Avg Google Position"
          value={client.gsc_site_url ? (gscSummary?.avgPosition ?? (gscLoading ? null : null)) : null}
          previousValue={gscSummary?.prevPosition ?? null}
          format="position"
          sparklineData={gscSummary?.sparkline}
          loading={gscLoading && !!client.gsc_site_url}
          accentColor="#F59E0B"
        />
        <MetricCard
          title="Google Reviews"
          value={client.ghl_location_id ? (reviewsSummary?.totalReviews ?? (reviewsLoading ? null : null)) : null}
          previousValue={null}
          format="number"
          loading={reviewsLoading && !!client.ghl_location_id}
          accentColor="#926BD9"
        />
        <MetricCard
          title="Tasks Completed (Week)"
          value={clickupSummary ? clickupSummary.completedThisWeek : null}
          previousValue={null}
          format="number"
          loading={clickupLoading}
          accentColor="#7B68EE"
          subtitle={clickupSummary ? `${clickupSummary.completionRate}% completion rate` : undefined}
        />
      </div>

      {/* ── AI Insights ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(147,107,218,0.07) 0%, rgba(0,0,0,0) 60%)',
        border: '1px solid rgba(147,107,218,0.14)', borderRadius: '16px',
        padding: '22px', marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px', margin: 0 }}>
            AI Insights — {currentMonth}
          </h2>
          <button
            onClick={handleGenerateInsights}
            disabled={insightsLoading}
            style={{
              padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #926BD9, #00FFD4)',
              color: '#000', fontWeight: '700', fontSize: '12px',
              opacity: insightsLoading ? 0.5 : 1,
            }}
          >
            {insightsLoading ? 'Generating...' : insights.length > 0 ? 'Regenerate' : 'Generate Insights'}
          </button>
        </div>
        {insights.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            No insights yet — click "Generate Insights" to analyze this month's performance.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {insights.map((insight: any, i: number) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: '10px',
                background: insight?.type === 'positive' ? 'rgba(16,185,129,0.08)' : insight?.type === 'negative' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
                border: `1px solid ${insight?.type === 'positive' ? 'rgba(16,185,129,0.2)' : insight?.type === 'negative' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>
                    {insight?.type === 'positive' ? '✅' : insight?.type === 'negative' ? '🚨' : 'ℹ️'}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '13px' }}>{insight?.title}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>{insight?.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Traffic Section ── */}
      <section id="traffic" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Website Traffic</h2>
        </div>
        <TrafficSection slug={client.slug} startDate={dateRange.startDate} endDate={dateRange.endDate} />
      </section>

      {/* ── SEO Section ── */}
      <section id="seo" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>SEO Performance</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { href: `/client/${client.slug}/seo/keywords`, label: 'Keywords' },
              { href: `/client/${client.slug}/seo/audit`, label: 'Audit' },
              { href: `/client/${client.slug}/seo/backlinks`, label: 'Backlinks' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '500',
                background: 'var(--bg-card)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', textDecoration: 'none',
                transition: 'all 0.15s',
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <SEOSection slug={client.slug} startDate={dateRange.startDate} endDate={dateRange.endDate} />
      </section>

      {/* ── Ads Section ── */}
      <section id="ads" style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Advertising</h2>
        <AdsSection slug={client.slug} startDate={dateRange.startDate} endDate={dateRange.endDate} hasMetaAccount={!!client.meta_ad_account_id} />
      </section>

      {/* ── Leads Section ── */}
      <section id="leads" style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Leads & CRM</h2>
        <LeadsSection slug={client.slug} startDate={dateRange.startDate} endDate={dateRange.endDate} hasGHL={!!client.ghl_location_id} />
      </section>

      {/* ── Reviews Section ── */}
      <section id="reviews" style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Reviews</h2>
        <ReviewsSection slug={client.slug} hasGHL={!!client.ghl_location_id} />
      </section>
    </div>
  );
}
