import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

  const rows = await prisma.metaAd.findMany({
    where: {
      client_id: client.id,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    orderBy: { date: 'asc' },
  });

  // Aggregate by campaign
  const campaignMap = new Map<string, {
    campaign_name: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    days: number;
  }>();

  for (const row of rows) {
    const key = row.campaign_name;
    const existing = campaignMap.get(key) || { campaign_name: key, spend: 0, impressions: 0, clicks: 0, conversions: 0, days: 0 };
    existing.spend += row.spend;
    existing.impressions += row.impressions;
    existing.clicks += row.clicks;
    existing.conversions += row.conversions;
    existing.days++;
    campaignMap.set(key, existing);
  }

  const campaigns = [...campaignMap.values()].map(c => ({
    ...c,
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
    cost_per_conv: c.conversions > 0 ? c.spend / c.conversions : 0,
    status: 'ACTIVE',
  })).sort((a, b) => b.spend - a.spend);

  // Daily spend for chart
  const dailyMap = new Map<string, number>();
  for (const row of rows) {
    const key = row.date.toISOString().split('T')[0];
    dailyMap.set(key, (dailyMap.get(key) || 0) + row.spend);
  }
  const daily = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, spend]) => ({ date, spend }));

  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);

  const summary = {
    totalSpend,
    totalClicks,
    totalImpressions,
    totalConversions,
    avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
    avgCostPerLead: totalConversions > 0 ? totalSpend / totalConversions : 0,
    avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
  };

  return NextResponse.json({ campaigns, daily, summary });
}
