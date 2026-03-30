import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkAnomalies(clientId: number): Promise<void> {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  async function createAlert(type: string, severity: string, title: string, description: string, data?: any) {
    const existing = await prisma.anomalyAlert.findFirst({
      where: {
        client_id: clientId,
        alert_type: type,
        created_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });
    if (existing) return;

    await prisma.anomalyAlert.create({
      data: {
        client_id: clientId,
        alert_type: type,
        severity,
        title,
        description,
        data_json: data || {},
      },
    });
  }

  try {
    // 1. Traffic anomalies
    const ga4Recent = await prisma.ga4Metric.findMany({
      where: { client_id: clientId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
    });

    if (ga4Recent.length > 7) {
      const allSessions = ga4Recent.map((r) => r.sessions);
      const avg30 = allSessions.slice(0, 30).reduce((a, b) => a + b, 0) / Math.min(allSessions.length, 30);
      const recent7avg = allSessions.slice(0, 7).reduce((a, b) => a + b, 0) / 7;

      if (avg30 > 10) {
        const dropPct = ((avg30 - recent7avg) / avg30) * 100;
        if (dropPct > 30) {
          await createAlert(
            'traffic_drop',
            'critical',
            'Traffic Drop Alert',
            `Sessions dropped ${dropPct.toFixed(0)}% vs 30-day average (${recent7avg.toFixed(0)}/day vs ${avg30.toFixed(0)}/day avg).`,
            { dropPct, recent7avg, avg30 }
          );
        }
        const spikePct = ((recent7avg - avg30) / avg30) * 100;
        if (spikePct > 50) {
          await createAlert(
            'traffic_spike',
            'warning',
            'Traffic Spike Detected',
            `Sessions spiked ${spikePct.toFixed(0)}% above 30-day average. Could be viral content or bot traffic.`,
            { spikePct, recent7avg, avg30 }
          );
        }
      }
    }

    // 2. Ranking drops
    const rankings = await prisma.seoRanking.findMany({
      where: { client_id: clientId, position: { lte: 20 } },
      orderBy: { date: 'desc' },
      take: 100,
    });

    // Group by keyword, get top 2 dates, check for drops
    const kwMap: Record<string, { position: number; date: Date }[]> = {};
    for (const r of rankings) {
      if (!kwMap[r.keyword]) kwMap[r.keyword] = [];
      kwMap[r.keyword].push({ position: r.position, date: r.date });
    }
    for (const [keyword, entries] of Object.entries(kwMap)) {
      if (entries.length >= 2) {
        const latest = entries[0];
        const prev = entries[1];
        if (latest.position - prev.position > 5) {
          await createAlert(
            'ranking_drop',
            'warning',
            `Ranking Drop: "${keyword}"`,
            `"${keyword}" dropped from position ${prev.position} to ${latest.position}.`,
            { keyword, from: prev.position, to: latest.position }
          );
        }
      }
    }

    // 3. Lead drought
    const recentLeads = await prisma.ghlLead.findMany({
      where: { client_id: clientId, created_date: { gte: sevenDaysAgo } },
    }).catch(() => null);

    if (recentLeads !== null && recentLeads.length === 0) {
      const prevLeads = await prisma.ghlLead.findMany({
        where: {
          client_id: clientId,
          created_date: {
            gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            lt: sevenDaysAgo,
          },
        },
      }).catch(() => null);

      if (prevLeads && prevLeads.length >= 2) {
        await createAlert(
          'lead_drought',
          'warning',
          'Lead Drought Alert',
          `No new leads in the last 7 days. Client averaged ${(prevLeads.length / 4).toFixed(1)} leads/week previously.`,
          { prevLeads: prevLeads.length }
        );
      }
    }

    // 4. Negative reviews
    const negativeReviews = await prisma.googleReview.findMany({
      where: { client_id: clientId, rating: { lte: 2 }, review_date: { gte: sevenDaysAgo } },
    }).catch(() => null);

    if (negativeReviews && negativeReviews.length > 0) {
      for (const review of negativeReviews) {
        await createAlert(
          'negative_review',
          'critical',
          'Negative Review Alert',
          `New ${review.rating}-star review received. Immediate response recommended.`,
          { rating: review.rating, reviewId: review.id }
        );
      }
    }

    // 5. Site health drop
    const audits = await prisma.siteAudit.findMany({
      where: { client_id: clientId },
      orderBy: { date: 'desc' },
      take: 2,
    }).catch(() => null);

    if (audits && audits.length === 2) {
      const scoreDrop = audits[1].overall_score - audits[0].overall_score;
      if (scoreDrop > 10) {
        await createAlert(
          'site_health_drop',
          'warning',
          'Site Health Score Dropped',
          `Site health score dropped from ${audits[1].overall_score} to ${audits[0].overall_score} (-${scoreDrop} points).`,
          { from: audits[1].overall_score, to: audits[0].overall_score }
        );
      }
    }

    // 6. Ad performance
    const recentAds = await prisma.metaAd.findMany({
      where: { client_id: clientId, date: { gte: threeDaysAgo } },
    }).catch(() => null);

    if (recentAds && recentAds.length > 0) {
      const totalSpend = recentAds.reduce((s, r) => s + r.spend, 0);
      const totalLeads = recentAds.reduce((s, r) => s + r.conversions, 0);
      if (totalSpend > 50 && totalLeads === 0) {
        await createAlert(
          'ad_performance',
          'critical',
          'Ad Performance Alert',
          `$${totalSpend.toFixed(2)} spent on ads in last 3 days with zero conversions.`,
          { spend: totalSpend, leads: 0 }
        );
      }
    }
  } catch (e) {
    console.error('checkAnomalies error:', e);
    // Graceful — never crash the cron
  }
}
