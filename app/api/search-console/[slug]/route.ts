export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date") || new Date(Date.now() - 30*24*60*60*1000).toISOString().split("T")[0];
  const endDate = searchParams.get("end_date") || new Date().toISOString().split("T")[0];

  const data = await prisma.gscMetric.findMany({
    where: {
      client_id: client.id,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
  });

  // Aggregate by query (top 50 by clicks)
  const queryMap = new Map<string, { query: string; clicks: number; impressions: number; ctr: number; position: number; count: number }>();
  const pageMap = new Map<string, { page: string; clicks: number; impressions: number; ctr: number; position: number; count: number }>();

  for (const row of data) {
    const q = queryMap.get(row.query) || { query: row.query, clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
    q.clicks += row.clicks; q.impressions += row.impressions; q.ctr += row.ctr; q.position += row.position; q.count++;
    queryMap.set(row.query, q);

    const p = pageMap.get(row.page) || { page: row.page, clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 };
    p.clicks += row.clicks; p.impressions += row.impressions; p.ctr += row.ctr; p.position += row.position; p.count++;
    pageMap.set(row.page, p);
  }

  const queries = [...queryMap.values()]
    .map(q => ({ ...q, ctr: q.ctr / q.count, position: q.position / q.count }))
    .sort((a, b) => b.clicks - a.clicks).slice(0, 50);

  const pages = [...pageMap.values()]
    .map(p => ({ ...p, ctr: p.ctr / p.count, position: p.position / p.count }))
    .sort((a, b) => b.clicks - a.clicks).slice(0, 50);

  const summary = data.length > 0 ? {
    totalClicks: data.reduce((s, r) => s + r.clicks, 0),
    totalImpressions: data.reduce((s, r) => s + r.impressions, 0),
    avgCtr: data.reduce((s, r) => s + r.ctr, 0) / data.length,
    avgPosition: data.reduce((s, r) => s + r.position, 0) / data.length,
  } : { totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0 };

  // Daily aggregation for chart
  const dailyMap = new Map<string, { date: string; clicks: number; impressions: number }>();
  for (const row of data) {
    const dateKey = row.date.toISOString().split('T')[0];
    const d = dailyMap.get(dateKey) || { date: dateKey, clicks: 0, impressions: 0 };
    d.clicks += row.clicks;
    d.impressions += row.impressions;
    dailyMap.set(dateKey, d);
  }
  const daily = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ queries, pages, summary, daily });
}
