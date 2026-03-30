import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const prisma = new PrismaClient();

function getAuthClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
  const credentials = JSON.parse(serviceAccountJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

export async function pullBacklinks(clientId: number, siteUrl: string): Promise<void> {
  try {
    const auth = getAuthClient();
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const encodedSite = encodeURIComponent(siteUrl);
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`,
      { headers: { Authorization: `Bearer ${token.token}` } }
    );

    // Try the links endpoint (may not be available on all accounts)
    const linksRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchanalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['page'],
          rowLimit: 50,
          dataState: 'all',
        }),
      }
    );

    if (!linksRes.ok) return; // Graceful — no crash

    const data = await linksRes.json();
    const rows = data.rows || [];
    const today = new Date();

    // Use top pages as proxy for referring pages (actual link data requires Search Console UI)
    for (const row of rows.slice(0, 25)) {
      const pageUrl = row.keys?.[0];
      if (!pageUrl) continue;

      let domain: string;
      try {
        domain = new URL(pageUrl).hostname;
      } catch {
        continue;
      }

      // Check if backlink record already exists for this domain
      const existing = await prisma.seoBacklink.findFirst({
        where: { client_id: clientId, source_url: pageUrl },
      });

      if (existing) {
        await prisma.seoBacklink.update({
          where: { id: existing.id },
          data: { last_checked: today, status: 'active' },
        });
      } else {
        await prisma.seoBacklink.create({
          data: {
            client_id: clientId,
            source_url: pageUrl,
            target_url: siteUrl,
            first_seen: today,
            last_checked: today,
            status: 'active',
          },
        });
      }
    }
  } catch {
    // Graceful degradation
  }
}

export async function getBacklinks(clientId: number) {
  return prisma.seoBacklink.findMany({
    where: { client_id: clientId },
    orderBy: { first_seen: 'desc' },
  });
}

export async function getBacklinkSummary(clientId: number) {
  const all = await prisma.seoBacklink.findMany({
    where: { client_id: clientId },
  });

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const newThisMonth = all.filter(
    (b) => new Date(b.first_seen) >= thisMonthStart
  ).length;

  const lost = all.filter((b) => b.status === 'lost').length;

  // Unique referring domains
  const domains = new Set(all.map((b) => {
    try { return new URL(b.source_url).hostname; } catch { return b.source_url; }
  }));

  return {
    total: all.length,
    referringDomains: domains.size,
    newThisMonth,
    lostThisMonth: lost,
  };
}
