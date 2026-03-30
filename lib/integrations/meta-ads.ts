import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GRAPH_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function pullMetaAds(
  clientId: number,
  adAccountId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; rowsInserted: number; error?: string }> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return { success: false, rowsInserted: 0, error: 'META_ACCESS_TOKEN not set' };
  }

  try {
    const params = new URLSearchParams({
      access_token: token,
      fields: 'campaign_name,campaign_id,spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type,date_start',
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      level: 'campaign',
      time_increment: '1',
      limit: '500',
    });

    let url: string | null = `${BASE_URL}/${adAccountId}/insights?${params}`;
    let rowsInserted = 0;
    let retries = 0;

    while (url) {
      const res: Response = await fetch(url);

      if (res.status === 429 || res.status === 503) {
        if (retries >= 3) {
          return { success: false, rowsInserted, error: 'Rate limit exceeded after retries' };
        }
        retries++;
        await sleep(retries * 10000);
        continue;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const errMsg = (errBody as any)?.error?.message || `HTTP ${res.status}`;
        // Check for expired token
        const errCode = (errBody as any)?.error?.code;
        if (errCode === 190 || errCode === 102) {
          return { success: false, rowsInserted, error: 'Meta token expired — regenerate in Settings' };
        }
        return { success: false, rowsInserted, error: errMsg };
      }

      retries = 0;
      const data = await res.json();
      const rows: any[] = data.data || [];

      for (const row of rows) {
        const leadAction = row.actions?.find((a: any) => a.action_type === 'lead') ||
          row.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_lead');
        const conversions = leadAction ? parseInt(leadAction.value || '0') : 0;
        const costPerLead = conversions > 0 ? (parseFloat(row.spend || '0') / conversions) : null;

        await prisma.metaAd.upsert({
          where: {
            // No unique constraint in schema — use findFirst + create/update pattern
            id: -1, // force create path, we'll use a different approach
          },
          update: {},
          create: {
            client_id: clientId,
            date: new Date(row.date_start),
            campaign_name: row.campaign_name || 'Unknown Campaign',
            ad_set_name: row.campaign_id,
            impressions: parseInt(row.impressions || '0'),
            clicks: parseInt(row.clicks || '0'),
            spend: parseFloat(row.spend || '0'),
            conversions,
            cost_per_result: costPerLead,
          },
        }).catch(async () => {
          // Fallback: check existing and update
          const existing = await prisma.metaAd.findFirst({
            where: {
              client_id: clientId,
              date: new Date(row.date_start),
              campaign_name: row.campaign_name || 'Unknown Campaign',
            },
          });
          if (existing) {
            await prisma.metaAd.update({
              where: { id: existing.id },
              data: {
                impressions: parseInt(row.impressions || '0'),
                clicks: parseInt(row.clicks || '0'),
                spend: parseFloat(row.spend || '0'),
                conversions,
                cost_per_result: costPerLead,
              },
            });
          } else {
            await prisma.metaAd.create({
              data: {
                client_id: clientId,
                date: new Date(row.date_start),
                campaign_name: row.campaign_name || 'Unknown Campaign',
                ad_set_name: row.campaign_id,
                impressions: parseInt(row.impressions || '0'),
                clicks: parseInt(row.clicks || '0'),
                spend: parseFloat(row.spend || '0'),
                conversions,
                cost_per_result: costPerLead,
              },
            });
          }
        });
        rowsInserted++;
      }

      url = data.paging?.next || null;
    }

    return { success: true, rowsInserted };
  } catch (err: any) {
    return { success: false, rowsInserted: 0, error: err?.message || 'Unknown error' };
  }
}
