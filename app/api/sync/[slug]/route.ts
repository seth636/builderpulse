import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { pullGA4Data } from '@/lib/integrations/ga4';
import { pullGSCData } from '@/lib/integrations/gsc';
import { pullMetaAds } from '@/lib/integrations/meta-ads';
import { pullGHLData } from '@/lib/integrations/ghl';
import { pullGoogleReviews } from '@/lib/integrations/google-reviews';

const prisma = new PrismaClient();

function getDateRange(daysBack: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const integration = (body as any).integration as string | undefined; // 'ga4'|'gsc'|'meta'|'ghl'|'reviews'
  const bodyGhlApiKey = (body as any).ghl_api_key as string | undefined; // allow passing key in body

  const { startDate, endDate } = getDateRange(30);
  const results: Record<string, any> = {};

  const runGA4 = !integration || integration === 'ga4';
  const runGSC = !integration || integration === 'gsc';
  const runMeta = !integration || integration === 'meta';
  const runGHL = !integration || integration === 'ghl';
  const runReviews = !integration || integration === 'reviews';

  if (runGA4 && client.ga4_property_id) {
    results.ga4 = await pullGA4Data(client.id, client.ga4_property_id, startDate, endDate).catch(e => ({ success: false, error: e.message }));
  }
  if (runGSC && client.gsc_site_url) {
    results.gsc = await pullGSCData(client.id, client.gsc_site_url, startDate, endDate).catch(e => ({ success: false, error: e.message }));
  }
  if (runMeta && client.meta_ad_account_id) {
    results.meta = await pullMetaAds(client.id, client.meta_ad_account_id, startDate, endDate).catch(e => ({ success: false, error: e.message }));
  }
  if (runGHL && client.ghl_location_id) {
    const ghlKey = bodyGhlApiKey || (client as any).ghl_api_key || process.env.GHL_API_KEY;
    results.ghl = await pullGHLData(client.id, client.ghl_location_id, startDate, endDate, ghlKey).catch(e => ({ success: false, error: e.message }));
  }
  if (runReviews && client.ghl_location_id) {
    results.reviews = await pullGoogleReviews(client.id, client.ghl_location_id).catch(e => ({ success: false, error: e.message }));
  }

  return NextResponse.json(results);
}
