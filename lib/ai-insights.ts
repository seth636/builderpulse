import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  body: string;
}

export async function generateInsights(clientId: number, month: string): Promise<Insight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return [];

  const [year, mon] = month.split('-').map(Number);
  const periodStart = new Date(year, mon - 1, 1);
  const periodEnd = new Date(year, mon, 0);

  const prevStart = new Date(year, mon - 2, 1);
  const prevEnd = new Date(year, mon - 1, 0);

  const [ga4, gsc, meta, ghl, reviews, seoAudit] = await Promise.all([
    prisma.ga4Metric.findMany({ where: { client_id: clientId, date: { gte: periodStart, lte: periodEnd } } }),
    prisma.gscMetric.findMany({ where: { client_id: clientId, date: { gte: periodStart, lte: periodEnd } } }),
    prisma.metaAd.findMany({ where: { client_id: clientId, date: { gte: periodStart, lte: periodEnd } } }).catch(() => []),
    prisma.ghlLead.findMany({ where: { client_id: clientId, created_date: { gte: periodStart, lte: periodEnd } } }).catch(() => []),
    prisma.googleReview.findMany({ where: { client_id: clientId, review_date: { gte: periodStart, lte: periodEnd } } }).catch(() => []),
    prisma.siteAudit.findFirst({ where: { client_id: clientId }, orderBy: { date: 'desc' } }).catch(() => null),
  ]);

  const [ga4Prev, gscPrev] = await Promise.all([
    prisma.ga4Metric.findMany({ where: { client_id: clientId, date: { gte: prevStart, lte: prevEnd } } }),
    prisma.gscMetric.findMany({ where: { client_id: clientId, date: { gte: prevStart, lte: prevEnd } } }),
  ]);

  const sessions = ga4.reduce((s, r) => s + r.sessions, 0);
  const sessionsPrev = ga4Prev.reduce((s, r) => s + r.sessions, 0);
  const clicks = gsc.reduce((s, r) => s + r.clicks, 0);
  const clicksPrev = gscPrev.reduce((s, r) => s + r.clicks, 0);
  const bounceRate = ga4.length > 0 ? ga4.reduce((s, r) => s + r.bounce_rate, 0) / ga4.length : 0;
  const avgPosition = gsc.length > 0 ? gsc.reduce((s, r) => s + r.position, 0) / gsc.length : 0;
  const metaSpend = meta.reduce((s, r) => s + r.spend, 0);
  const metaLeads = meta.reduce((s, r) => s + r.conversions, 0);
  const newLeads = ghl.length;
  const newReviews = reviews.length;
  const avgRating = newReviews > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / newReviews : 0;

  const dataStr = JSON.stringify({
    sessions,
    sessionsPrev,
    sessionChange: sessionsPrev > 0 ? Math.round(((sessions - sessionsPrev) / sessionsPrev) * 100) : 0,
    clicks,
    clicksPrev,
    clickChange: clicksPrev > 0 ? Math.round(((clicks - clicksPrev) / clicksPrev) * 100) : 0,
    bounceRate: bounceRate.toFixed(1),
    avgPosition: avgPosition.toFixed(1),
    metaSpend: metaSpend.toFixed(2),
    metaLeads,
    metaCPL: metaLeads > 0 ? (metaSpend / metaLeads).toFixed(2) : 'N/A',
    newLeads,
    newReviews,
    avgRating: avgRating.toFixed(1),
    siteHealthScore: seoAudit?.overall_score || null,
  }, null, 2);

  const prompt = `You are an AI marketing analyst at Home Builder Marketers. Analyze this client's data and provide exactly 5 insights. Each insight must:
- Reference a specific metric with the actual number
- Compare to previous month where possible
- End with a one-sentence recommendation
- Be 2-3 sentences max

Tone: direct, specific, actionable. Not generic. Not fluffy.

Client: ${client.name}
Website: ${client.website_url || 'N/A'}
Month: ${month}

Data:
${dataStr}

Return as a valid JSON array ONLY (no markdown, no explanation):
[{ "type": "positive|negative|neutral", "title": "short title", "body": "the insight text" }]`;

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const json = await res.json();
    const text: string = json.content?.[0]?.text || '[]';
    const match = text.match(/\[[\s\S]*\]/);
    const insights: Insight[] = match ? JSON.parse(match[0]) : [];

    try {
      await prisma.aiInsight.upsert({
        where: { client_id_month: { client_id: clientId, month } },
        update: { insights_json: insights as any, generated_at: new Date() },
        create: { client_id: clientId, month, insights_json: insights as any },
      });
    } catch (saveError) {
      // Table may not exist yet - still return insights
      console.error('Failed to save insights (table may not exist):', saveError);
    }

    return insights;
  } catch (e) {
    console.error('generateInsights error:', e);
    return [];
  }
}

export async function getInsights(clientId: number, month: string): Promise<Insight[]> {
  try {
    const record = await prisma.aiInsight.findUnique({
      where: { client_id_month: { client_id: clientId, month } },
    });
    return (record?.insights_json as unknown as Insight[]) || [];
  } catch (error) {
    // Table may not exist yet
    console.error('Failed to get insights (table may not exist):', error);
    return [];
  }
}
