import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Pull rankings from GSC metrics (gsc_metrics table stores per query/page/date rows).
 * We aggregate by query → avg position over last 30 days, then upsert today's ranking.
 */
export async function updateRankingsFromGSC(clientId: number): Promise<void> {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client?.gsc_site_url) return;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const gscData = await prisma.gscMetric.findMany({
    where: { client_id: clientId, date: { gte: since } },
  });

  if (gscData.length === 0) return;

  // Aggregate by query → average position, total clicks
  const queryMap = new Map<string, { positions: number[]; clicks: number }>();
  for (const row of gscData) {
    if (!row.query || !row.position) continue;
    const entry = queryMap.get(row.query) || { positions: [], clicks: 0 };
    entry.positions.push(row.position);
    entry.clicks += row.clicks;
    queryMap.set(row.query, entry);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const [keyword, data] of queryMap.entries()) {
    const avgPosition = Math.round(
      data.positions.reduce((a, b) => a + b, 0) / data.positions.length
    );

    // Check if record already exists for today
    const existing = await prisma.seoRanking.findFirst({
      where: { client_id: clientId, keyword, date: today },
    });

    if (existing) {
      await prisma.seoRanking.update({
        where: { id: existing.id },
        data: { position: avgPosition },
      });
    } else {
      await prisma.seoRanking.create({
        data: {
          client_id: clientId,
          keyword,
          position: avgPosition,
          date: today,
        },
      });
    }
  }
}

export async function getKeywordHistory(clientId: number, keyword: string, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.seoRanking.findMany({
    where: { client_id: clientId, keyword, date: { gte: since } },
    orderBy: { date: 'asc' },
  });
}

export async function getLatestRankings(clientId: number) {
  // Get the most recent entry per keyword
  const allRankings = await prisma.seoRanking.findMany({
    where: { client_id: clientId },
    orderBy: { date: 'desc' },
  });

  // Deduplicate — keep latest per keyword
  const seen = new Set<string>();
  const latest: typeof allRankings = [];
  for (const r of allRankings) {
    if (!seen.has(r.keyword)) {
      seen.add(r.keyword);
      latest.push(r);
    }
  }

  // Attach previous position for change calculation
  const result = await Promise.all(
    latest.map(async (r) => {
      const prev = await prisma.seoRanking.findFirst({
        where: {
          client_id: clientId,
          keyword: r.keyword,
          date: { lt: r.date },
        },
        orderBy: { date: 'desc' },
      });

      // Best position (lowest number)
      const best = await prisma.seoRanking.findFirst({
        where: { client_id: clientId, keyword: r.keyword },
        orderBy: { position: 'asc' },
      });

      return {
        ...r,
        previousPosition: prev?.position ?? null,
        bestPosition: best?.position ?? r.position,
      };
    })
  );

  return result;
}
