export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { pullGA4Data } from '@/lib/integrations/ga4';
import { pullGSCData } from '@/lib/integrations/gsc';
import { pullMetaAds } from '@/lib/integrations/meta-ads';
import { pullGHLData } from '@/lib/integrations/ghl';
import { pullGoogleReviews } from '@/lib/integrations/google-reviews';
import { pullClickUpData } from '@/lib/integrations/clickup';

const prisma = new PrismaClient();

function getDateRange(daysBack: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

// POST /api/clients/[slug]/sync
// Triggers an immediate data pull for a single client.
// Accepts optional body: { provider: 'google' | 'ghl' | 'meta' | 'all' }
// Defaults to 'all' if no provider is specified.
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { slug: params.slug },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    let provider = 'all';
    try {
      const body = await req.json();
      if (body?.provider) provider = body.provider;
    } catch {
      // no body — default to all
    }

    const { startDate, endDate } = getDateRange(30); // pull 30 days on first connect
    const results: Record<string, any> = {};

    const runGoogle = provider === 'all' || provider === 'google';
    const runGHL = provider === 'all' || provider === 'ghl';
    const runMeta = provider === 'all' || provider === 'meta';
    const runClickUp = provider === 'all' || provider === 'clickup';

    // GA4
    if (runGoogle && client.ga4_property_id) {
      try {
        const r = await pullGA4Data(client.id, client.ga4_property_id, startDate, endDate);
        results.ga4 = r;
      } catch (e: any) {
        results.ga4 = { success: false, error: e.message };
      }
    }

    // GSC
    if (runGoogle && client.gsc_site_url) {
      try {
        const r = await pullGSCData(client.id, client.gsc_site_url, startDate, endDate);
        results.gsc = r;
      } catch (e: any) {
        results.gsc = { success: false, error: e.message };
      }
    }

    // Meta Ads
    if (runMeta && client.meta_ad_account_id) {
      try {
        const r = await pullMetaAds(client.id, client.meta_ad_account_id, startDate, endDate);
        results.meta = r;
      } catch (e: any) {
        results.meta = { success: false, error: e.message };
      }
    }

    // GHL
    if (runGHL && client.ghl_location_id) {
      try {
        const ghlKey = client.ghl_api_key || process.env.GHL_API_KEY;
        const r = await pullGHLData(client.id, client.ghl_location_id, startDate, endDate, ghlKey);
        results.ghl = r;
      } catch (e: any) {
        results.ghl = { success: false, error: e.message };
      }
    }

    // Google Reviews (via GHL)
    if (runGHL && client.ghl_location_id) {
      try {
        const ghlKey = client.ghl_api_key || process.env.GHL_API_KEY;
        const r = await pullGoogleReviews(client.id, client.ghl_location_id, ghlKey);
        results.reviews = r;
      } catch (e: any) {
        results.reviews = { success: false, error: e.message };
      }
    }

    // ClickUp
    if (runClickUp) {
      try {
        const cuIntegration = await prisma.clientIntegration.findUnique({
          where: { client_id_provider: { client_id: client.id, provider: 'clickup' } },
        });
        if (cuIntegration?.access_token) {
          const r = await pullClickUpData(client.id, cuIntegration.access_token, 30);
          results.clickup = r;
        }
      } catch (e: any) {
        results.clickup = { success: false, error: e.message };
      }
    }

    return NextResponse.json({ client: client.name, provider, results });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
