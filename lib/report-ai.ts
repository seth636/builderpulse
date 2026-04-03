export interface ReportData {
  clientName: string;
  month: string;
  ga4?: {
    sessions: number;
    sessionsPrevMonth: number;
    users: number;
    bounceRate: number;
    avgSessionDuration: number;
    topPages: { page: string; sessions: number }[];
    sources: { source: string; sessions: number }[];
    dailySessions: { date: string; sessions: number }[];
  };
  gsc?: {
    clicks: number;
    clicksPrevMonth: number;
    impressions: number;
    avgPosition: number;
    topKeywords: { keyword: string; clicks: number; position: number }[];
    topPages: { page: string; clicks: number }[];
  };
  meta?: {
    spend: number;
    leads: number;
    cpl: number;
    ctr: number;
    campaigns: { name: string; spend: number; leads: number; cpl: number }[];
    dailySpend: { date: string; spend: number }[];
  };
  ghl?: {
    newLeads: number;
    appointments: number;
    sources: { source: string; count: number }[];
    recentLeads: { name: string; source: string; status: string; date: string }[];
  };
  reviews?: {
    avgRating: number;
    totalReviews: number;
    newReviews: number;
    recentReviews: { rating: number; text: string; date: string; replied: boolean }[];
  };
}

export interface AISummaryResult {
  summary: string;
  recommendations: string;
}

export async function generateReportSummary(data: ReportData): Promise<AISummaryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { summary: 'AI summary unavailable for this period.', recommendations: '' };

  const pct = (a: number, b: number) =>
    b > 0 ? `${Math.round(((a - b) / b) * 100)}%` : 'N/A';

  const prompt = `You are a marketing analyst at Home Builder Marketers writing a monthly performance report for ${data.clientName}, a custom home builder client.

Here is their data for ${data.month}:
${data.ga4 ? `- Website: ${data.ga4.sessions} sessions (${pct(data.ga4.sessions, data.ga4.sessionsPrevMonth)} vs last month), ${data.ga4.bounceRate.toFixed(1)}% bounce rate` : '- Website: No data'}
${data.gsc ? `- SEO: ${data.gsc.clicks} clicks, avg position ${data.gsc.avgPosition.toFixed(1)}, top keyword "${data.gsc.topKeywords[0]?.keyword || 'N/A'}" at position ${data.gsc.topKeywords[0]?.position?.toFixed(1) || 'N/A'}` : '- SEO: No data'}
${data.meta ? `- Ads: $${data.meta.spend.toFixed(2)} spent, ${data.meta.leads} leads, $${data.meta.cpl.toFixed(2)} cost per lead` : '- Ads: No data'}
${data.ghl ? `- Leads: ${data.ghl.newLeads} new leads, ${data.ghl.appointments} appointments booked` : '- Leads: No data'}
${data.reviews ? `- Reviews: ${data.reviews.avgRating.toFixed(1)} stars, ${data.reviews.newReviews} new reviews this month` : '- Reviews: No data'}

Write two sections:

EXECUTIVE SUMMARY: 3-4 paragraphs summarizing performance. Be specific with numbers. Highlight the biggest win, the biggest concern, and what to focus on next month. Professional tone.

RECOMMENDATIONS: 3-5 specific, actionable bullet points based on the data. Each recommendation should reference a specific metric and suggest a concrete action.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    const text: string = json.content?.[0]?.text || '';
    const parts = text.split(/RECOMMENDATIONS[:\s]*/i);
    const summaryRaw = parts[0].replace(/EXECUTIVE SUMMARY[:\s]*/i, '').trim();
    return { summary: summaryRaw, recommendations: parts[1]?.trim() || '' };
  } catch {
    return { summary: 'AI summary unavailable for this period.', recommendations: '' };
  }
}
