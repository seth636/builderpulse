import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function calculateHealthScore(clientId: number): Promise<number> {
  let score = 0;
  const breakdown: Record<string, { score: number; weight: number; label: string }> = {};

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // 1. Website traffic trend (20%)
  try {
    const current = await prisma.ga4Metric.findMany({ where: { client_id: clientId, date: { gte: thisMonthStart } } });
    const prev = await prisma.ga4Metric.findMany({ where: { client_id: clientId, date: { gte: prevMonthStart, lte: prevMonthEnd } } });
    const currentSessions = current.reduce((s, r) => s + r.sessions, 0);
    const prevSessions = prev.reduce((s, r) => s + r.sessions, 0);

    let trafficScore = 50;
    if (prevSessions > 0) {
      const change = ((currentSessions - prevSessions) / prevSessions) * 100;
      if (change > 10) trafficScore = 100;
      else if (change > 0) trafficScore = 75;
      else if (change > -10) trafficScore = 50;
      else if (change > -30) trafficScore = 25;
      else trafficScore = 0;
    }
    breakdown.traffic = { score: trafficScore, weight: 20, label: 'Website Traffic' };
    score += (trafficScore * 20) / 100;
  } catch { /* ignore */ }

  // 2. SEO health (15%)
  try {
    const audit = await prisma.siteAudit.findFirst({ where: { client_id: clientId }, orderBy: { date: 'desc' } });
    const seoScore = audit?.overall_score || 50;
    breakdown.seoHealth = { score: seoScore, weight: 15, label: 'SEO Health' };
    score += (seoScore * 15) / 100;
  } catch { score += 7.5; }

  // 3. Keyword rankings (15%)
  try {
    const rankings = await prisma.seoRanking.findMany({ where: { client_id: clientId }, orderBy: { date: 'desc' }, take: 50 }).catch(() => []);
    const top10 = rankings.filter((r) => r.position <= 10).length;
    const total = rankings.length;
    const kwScore = total > 0 ? Math.round((top10 / total) * 100) : 50;
    breakdown.keywords = { score: kwScore, weight: 15, label: 'Keyword Rankings' };
    score += (kwScore * 15) / 100;
  } catch { score += 7.5; }

  // 4. Ad efficiency (15%)
  try {
    const ads = await prisma.metaAd.findMany({ where: { client_id: clientId, date: { gte: thisMonthStart } } }).catch(() => null);
    if (ads && ads.length > 0) {
      const spend = ads.reduce((s, r) => s + r.spend, 0);
      const leads = ads.reduce((s, r) => s + r.conversions, 0);
      const cpl = leads > 0 ? spend / leads : 999;
      const adScore = cpl <= 25 ? 100 : cpl <= 50 ? 75 : cpl <= 100 ? 50 : cpl <= 200 ? 25 : 0;
      breakdown.adEfficiency = { score: adScore, weight: 15, label: 'Ad Efficiency' };
      score += (adScore * 15) / 100;
    } else {
      score += 7.5;
    }
  } catch { score += 7.5; }

  // 5. Lead generation (15%)
  try {
    const currentLeads = await prisma.ghlLead.findMany({ where: { client_id: clientId, created_date: { gte: thisMonthStart } } }).catch(() => null);
    const prevLeads = await prisma.ghlLead.findMany({ where: { client_id: clientId, created_date: { gte: prevMonthStart, lte: prevMonthEnd } } }).catch(() => null);
    if (currentLeads !== null && prevLeads !== null) {
      const change = prevLeads.length > 0 ? ((currentLeads.length - prevLeads.length) / prevLeads.length) * 100 : 0;
      const leadScore = change > 20 ? 100 : change > 0 ? 75 : change > -20 ? 50 : 25;
      breakdown.leadGen = { score: leadScore, weight: 15, label: 'Lead Generation' };
      score += (leadScore * 15) / 100;
    } else { score += 7.5; }
  } catch { score += 7.5; }

  // 6. Review reputation (10%)
  try {
    const reviews = await prisma.googleReview.findMany({ where: { client_id: clientId } }).catch(() => null);
    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      const repScore = avgRating >= 4.5 ? 100 : avgRating >= 4 ? 75 : avgRating >= 3 ? 50 : 25;
      breakdown.reputation = { score: repScore, weight: 10, label: 'Review Reputation' };
      score += (repScore * 10) / 100;
    } else { score += 5; }
  } catch { score += 5; }

  // 7. Task completion (10%) — neutral
  score += 5;
  breakdown.taskCompletion = { score: 50, weight: 10, label: 'Task Completion' };

  const finalScore = Math.round(Math.min(100, Math.max(0, score)));

  await prisma.clientHealthScore.create({
    data: { client_id: clientId, score: finalScore, breakdown_json: breakdown as any },
  });

  return finalScore;
}

export async function getLatestHealthScore(clientId: number): Promise<number | null> {
  const record = await prisma.clientHealthScore.findFirst({
    where: { client_id: clientId },
    orderBy: { calculated_at: 'desc' },
  });
  return record?.score ?? null;
}

export function getHealthScoreColor(score: number): string {
  if (score >= 90) return '#16a34a';
  if (score >= 70) return '#0ea5e9';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function getHealthScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'Critical';
}
