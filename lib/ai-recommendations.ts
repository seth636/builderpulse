import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'seo' | 'ads' | 'content' | 'crm' | 'reputation' | 'website';
  title: string;
  body: string;
  metricReference: string;
  done?: boolean;
  dismissed?: boolean;
}

export async function generateRecommendations(clientId: number, month: string): Promise<Recommendation[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return [];

  const [year, mon] = month.split('-').map(Number);
  const periodStart = new Date(year, mon - 1, 1);
  const periodEnd = new Date(year, mon, 0);

  const [ga4, gsc, meta, ghl, reviews, audit, rankings] = await Promise.all([
    prisma.ga4Metric.findMany({ where: { client_id: clientId, date: { gte: periodStart, lte: periodEnd } } }),
    prisma.gscMetric.findMany({ where: { client_id: clientId, date: { gte: periodStart, lte: periodEnd } } }),
    prisma.metaAd.findMany({ where: { client_id: clientId, date: { gte: periodStart, lte: periodEnd } } }).catch(() => []),
    prisma.ghlLead.findMany({ where: { client_id: clientId, created_date: { gte: periodStart, lte: periodEnd } } }).catch(() => []),
    prisma.googleReview.findMany({ where: { client_id: clientId, review_date: { gte: periodStart, lte: periodEnd } } }).catch(() => []),
    prisma.siteAudit.findFirst({ where: { client_id: clientId }, orderBy: { date: 'desc' } }).catch(() => null),
    prisma.seoRanking.findMany({ where: { client_id: clientId }, orderBy: { date: 'desc' }, take: 20 }).catch(() => []),
  ]);

  const summary = {
    sessions: ga4.reduce((s, r) => s + r.sessions, 0),
    bounceRate: ga4.length > 0 ? (ga4.reduce((s, r) => s + r.bounce_rate, 0) / ga4.length).toFixed(1) : 'N/A',
    clicks: gsc.reduce((s, r) => s + r.clicks, 0),
    avgPosition: gsc.length > 0 ? (gsc.reduce((s, r) => s + r.position, 0) / gsc.length).toFixed(1) : 'N/A',
    adSpend: meta.reduce((s, r) => s + r.spend, 0).toFixed(2),
    adLeads: meta.reduce((s, r) => s + r.conversions, 0),
    newLeads: ghl.length,
    avgRating: reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 'N/A',
    siteHealth: audit?.overall_score || 'N/A',
    criticalIssues: audit?.errors_count || 0,
    top10Keywords: rankings.filter((r) => r.position <= 10).length,
  };

  const prompt = `You are a senior marketing strategist at Home Builder Marketers. Based on this client's data, generate 5-8 specific marketing recommendations.

Each recommendation must:
- Be a concrete action the team can take this month
- Reference the specific data that triggered it
- Include expected impact if possible
- Be prioritized as high/medium/low

Categories: SEO, Advertising, Content, CRM/Sales, Reputation, Website

Client: ${client.name}
Website: ${client.website_url || 'N/A'}
Month: ${month}

Data:
${JSON.stringify(summary, null, 2)}

Return as a valid JSON array ONLY (no markdown, no explanation):
[{ "priority": "high|medium|low", "category": "seo|ads|content|crm|reputation|website", "title": "short action title", "body": "detailed recommendation", "metricReference": "the data point that triggered this" }]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const json = await res.json();
    const text: string = json.content?.[0]?.text || '[]';
    const match = text.match(/\[[\s\S]*\]/);
    const recs: Recommendation[] = match ? JSON.parse(match[0]) : [];

    try {
      await prisma.aiRecommendation.upsert({
        where: { client_id_month: { client_id: clientId, month } },
        update: { recommendations_json: recs as any, generated_at: new Date() },
        create: { client_id: clientId, month, recommendations_json: recs as any },
      });
    } catch (saveError) {
      // Table may not exist yet - still return recommendations
      console.error('Failed to save recommendations (table may not exist):', saveError);
    }

    return recs;
  } catch (e) {
    console.error('generateRecommendations error:', e);
    return [];
  }
}

export async function getRecommendations(clientId: number, month: string): Promise<Recommendation[]> {
  try {
    const record = await prisma.aiRecommendation.findUnique({
      where: { client_id_month: { client_id: clientId, month } },
    });
    return (record?.recommendations_json as unknown as Recommendation[]) || [];
  } catch (error) {
    // Table may not exist yet
    console.error('Failed to get recommendations (table may not exist):', error);
    return [];
  }
}
