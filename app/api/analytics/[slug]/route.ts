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

  const [daily, topPages, sources] = await Promise.all([
    prisma.ga4Metric.findMany({
      where: {
        client_id: client.id,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      orderBy: { date: "asc" },
    }),
    prisma.ga4Page.findMany({
      where: { client_id: client.id, start_date: startDate, end_date: endDate },
      orderBy: { page_views: "desc" },
      take: 50,
    }),
    prisma.ga4Source.findMany({
      where: { client_id: client.id, start_date: startDate, end_date: endDate },
      orderBy: { sessions: "desc" },
    }),
  ]);

  const summary = daily.length > 0 ? {
    totalSessions: daily.reduce((s, r) => s + r.sessions, 0),
    totalUsers: daily.reduce((s, r) => s + r.total_users, 0),
    avgBounceRate: daily.reduce((s, r) => s + r.bounce_rate, 0) / daily.length,
    totalConversions: daily.reduce((s, r) => s + r.conversions, 0),
  } : { totalSessions: 0, totalUsers: 0, avgBounceRate: 0, totalConversions: 0 };

  return NextResponse.json({ daily, summary, topPages, sources });
}
