export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { pullGA4Data } from '@/lib/integrations/ga4';
import { pullGSCData } from '@/lib/integrations/gsc';
import { pullMetaAds } from '@/lib/integrations/meta-ads';
import { pullGHLData } from '@/lib/integrations/ghl';
import { pullGoogleReviews } from '@/lib/integrations/google-reviews';

const prisma = new PrismaClient();

function getDateRange(daysBack: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clients = await prisma.client.findMany();
  const results = { pulled: 0, failed: 0, errors: [] as string[] };
  const { startDate, endDate } = getDateRange(7);

  for (const client of clients) {
    let clientSuccess = true;

    // GA4
    if (client.ga4_property_id) {
      try {
        const result = await pullGA4Data(client.id, client.ga4_property_id, startDate, endDate);
        if (!result.success) {
          clientSuccess = false;
          results.errors.push(`[GA4] ${client.name}: ${result.error}`);
          console.error(`[CRON] GA4 failed for ${client.name}: ${result.error}`);
        } else {
          console.log(`[CRON] GA4 success for ${client.name}: ${result.rowsInserted} rows`);
        }
      } catch (e: any) {
        clientSuccess = false;
        results.errors.push(`[GA4] ${client.name}: ${e.message}`);
      }
    }

    // GSC
    if (client.gsc_site_url) {
      try {
        const result = await pullGSCData(client.id, client.gsc_site_url, startDate, endDate);
        if (!result.success) {
          clientSuccess = false;
          results.errors.push(`[GSC] ${client.name}: ${result.error}`);
          console.error(`[CRON] GSC failed for ${client.name}: ${result.error}`);
        } else {
          console.log(`[CRON] GSC success for ${client.name}: ${result.rowsInserted} rows`);
        }
      } catch (e: any) {
        clientSuccess = false;
        results.errors.push(`[GSC] ${client.name}: ${e.message}`);
      }
    }

    // Meta Ads
    if (client.meta_ad_account_id) {
      try {
        const result = await pullMetaAds(client.id, client.meta_ad_account_id, startDate, endDate);
        if (!result.success) {
          results.errors.push(`[Meta] ${client.name}: ${result.error}`);
          console.error(`[CRON] Meta failed for ${client.name}: ${result.error}`);
        } else {
          console.log(`[CRON] Meta success for ${client.name}: ${result.rowsInserted} rows`);
        }
      } catch (e: any) {
        results.errors.push(`[Meta] ${client.name}: ${e.message}`);
      }
    }

    // GHL
    if (client.ghl_location_id) {
      try {
        const ghlKey = client.ghl_api_key || process.env.GHL_API_KEY;
        const result = await pullGHLData(client.id, client.ghl_location_id, startDate, endDate, ghlKey);
        if (!result.success) {
          results.errors.push(`[GHL] ${client.name}: ${result.error}`);
          console.error(`[CRON] GHL failed for ${client.name}: ${result.error}`);
        } else {
          console.log(`[CRON] GHL success for ${client.name}: ${result.leadsInserted} leads, ${result.appointmentsInserted} appts`);
        }
      } catch (e: any) {
        results.errors.push(`[GHL] ${client.name}: ${e.message}`);
      }
    }

    // Google Reviews (via GHL)
    if (client.ghl_location_id) {
      try {
        const ghlKey = client.ghl_api_key || process.env.GHL_API_KEY;
        const result = await pullGoogleReviews(client.id, client.ghl_location_id, ghlKey);
        if (!result.success) {
          results.errors.push(`[Reviews] ${client.name}: ${result.error}`);
          console.error(`[CRON] Reviews failed for ${client.name}: ${result.error}`);
        } else {
          console.log(`[CRON] Reviews success for ${client.name}: ${result.rowsInserted} rows`);
        }
      } catch (e: any) {
        results.errors.push(`[Reviews] ${client.name}: ${e.message}`);
      }
    }

    if (clientSuccess) results.pulled++;
    else results.failed++;
  }

  return NextResponse.json(results);
}
// Mon Mar 30 14:35:45 PDT 2026
