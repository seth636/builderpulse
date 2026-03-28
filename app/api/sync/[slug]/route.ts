import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { pullGA4Data } from "@/lib/integrations/ga4";
import { pullGSCData } from "@/lib/integrations/gsc";

const prisma = new PrismaClient();

function getDateRange(daysBack: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { startDate, endDate } = getDateRange(7);
  const results = { ga4: null as any, gsc: null as any };

  if (client.ga4_property_id) {
    results.ga4 = await pullGA4Data(client.id, client.ga4_property_id, startDate, endDate);
  }
  if (client.gsc_site_url) {
    results.gsc = await pullGSCData(client.id, client.gsc_site_url, startDate, endDate);
  }

  return NextResponse.json(results);
}
