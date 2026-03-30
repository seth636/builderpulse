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

function getHealthScoreColorPortal(score: number): string {
  if (score >= 90) return '#16a34a';
  if (score >= 70) return '#0ea5e9';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}
function getHealthScoreLabelPortal(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'Critical';
}

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

  // AI intelligence for portal
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [portalInsights, setPortalInsights] = useState<any[]>([]);
  const [portalHealthScore, setPortalHealthScore] = useState<number | null>(null);
  const [portalRecs, setPortalRecs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/clients/${slug}/insights?month=${currentMonth}`)
      .then(r => r.ok ? r.json() : { insights: [] })
      .then(d => setPortalInsights(Array.isArray(d?.insights) ? d.insights : []))
      .catch(() => setPortalInsights([]));
    fetch(`/api/clients/${slug}/health`)
      .then(r => r.ok ? r.json() : { score: null })
      .then(d => { if (d?.score != null && Number.isFinite(d.score)) setPortalHealthScore(d.score); })
      .catch(() => {});
    fetch(`/api/clients/${slug}/recommendations?month=${currentMonth}`)
      .then(r => r.ok ? r.json() : { recommendations: [] })
      .then(d => setPortalRecs((Array.isArray(d?.recommendations) ? d.recommendations : []).slice(0, 3)))
      .catch(() => setPortalRecs([]));
  }, [slug, currentMonth]);

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

        {/* Health Score */}
        {portalHealthScore != null && Number.isFinite(portalHealthScore) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '20px' }}>
            <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '64px', height: '64px', transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={getHealthScoreColorPortal(portalHealthScore)} strokeWidth="3" strokeDasharray={`${Math.max(0, Math.min(100, portalHealthScore))}, 100`}/>
              </svg>
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px', color: '#111827' }}>{Math.round(portalHealthScore)}</span>
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>Client Health Score</p>
              <p style={{ fontSize: '14px', color: getHealthScoreColorPortal(portalHealthScore), fontWeight: '500' }}>{getHealthScoreLabelPortal(portalHealthScore)}</p>
            </div>
          </div>
        )}

        {/* AI Insights (read-only) */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>AI Insights — {currentMonth}</h2>
          {(portalInsights || []).length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px', color: '#6b7280', fontSize: '14px' }}>
              No insights available yet. Check back after your next data sync.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {(portalInsights || []).map((insight: any, i: number) => {
                if (!insight) return null;
                const insightType = insight?.type ?? 'neutral';
                return (
                  <div key={i} style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: `1px solid ${insightType === 'positive' ? '#166534' : insightType === 'negative' ? '#991b1b' : '#1e40af'}30`,
                    backgroundColor: insightType === 'positive' ? '#f0fdf4' : insightType === 'negative' ? '#fef2f2' : '#eff6ff',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span>{insightType === 'positive' ? '✅' : insightType === 'negative' ? '⚠️' : 'ℹ️'}</span>
                      <strong style={{ fontSize: '13px', color: '#111827' }}>{insight?.title ?? 'Insight'}</strong>
                    </div>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5' }}>{insight?.body ?? ''}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top 3 Recommendations (read-only) */}
        {(portalRecs || []).length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>This Month's Focus Areas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(portalRecs || []).map((rec: any, i: number) => {
                if (!rec) return null;
                const priority = rec?.priority ?? 'medium';
                const category = rec?.category ?? 'other';
                return (
                  <div key={i} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: priority === 'high' ? '#fee2e2' : priority === 'medium' ? '#fef9c3' : '#dcfce7', color: priority === 'high' ? '#b91c1c' : priority === 'medium' ? '#92400e' : '#166534', textTransform: 'uppercase' as const }}>{priority}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#6b7280', textTransform: 'uppercase' as const }}>{category}</span>
                      <strong style={{ fontSize: '14px', color: '#111827' }}>{rec?.title ?? 'Recommendation'}</strong>
                    </div>
                    <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: '1.5' }}>{rec?.body ?? ''}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

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

        {/* SEO Tools (Phase 7) — show only if data exists */}
        {!loading && data?.seo?.hasData && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
              SEO Tools
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {data?.seo?.latestAudit && (
                <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Site Health</p>
                  <p style={{
                    fontSize: '24px', fontWeight: '700',
                    color: data.seo.latestAudit.overall_score >= 80 ? '#10b981' : data.seo.latestAudit.overall_score >= 50 ? '#f59e0b' : '#ef4444',
                  }}>
                    {data.seo.latestAudit.overall_score}/100
                  </p>
                </div>
              )}
              {data?.seo?.referringDomains !== undefined && (
                <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Referring Domains</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>{data.seo.referringDomains}</p>
                </div>
              )}
            </div>

            {Array.isArray(data?.seo?.topKeywords) && data.seo.topKeywords.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Top Keyword Rankings</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', color: '#6b7280', fontWeight: '500', paddingBottom: '8px', paddingRight: '12px' }}>Keyword</th>
                      <th style={{ textAlign: 'right', color: '#6b7280', fontWeight: '500', paddingBottom: '8px' }}>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.seo.topKeywords || []).map((kw: any, i: number) => {
                      if (!kw) return null;
                      const position = kw?.position ?? 999;
                      return (
                        <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px 8px 0', color: '#374151', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw?.keyword ?? 'Unknown'}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: position <= 10 ? '#10b981' : position <= 20 ? '#6366f1' : '#6b7280' }}>
                            #{position}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
