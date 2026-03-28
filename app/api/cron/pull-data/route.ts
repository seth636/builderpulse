import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { pullGA4Data } from "@/lib/integrations/ga4";
import { pullGSCData } from "@/lib/integrations/gsc";

const prisma = new PrismaClient();

function getDateRange(daysBack: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { ga4_property_id: { not: null } },
        { gsc_site_url: { not: null } },
      ],
    },
  });

  const results = { pulled: 0, failed: 0, errors: [] as string[] };
  const { startDate, endDate } = getDateRange(7);

  for (const client of clients) {
    let clientSuccess = true;

    if (client.ga4_property_id) {
      const result = await pullGA4Data(client.id, client.ga4_property_id, startDate, endDate);
      if (!result.success) {
        clientSuccess = false;
        results.errors.push(`[GA4] ${client.name}: ${result.error}`);
        console.error(`[CRON] GA4 failed for ${client.name}: ${result.error}`);
      } else {
        console.log(`[CRON] GA4 success for ${client.name}: ${result.rowsInserted} rows`);
      }
    }

    if (client.gsc_site_url) {
      const result = await pullGSCData(client.id, client.gsc_site_url, startDate, endDate);
      if (!result.success) {
        clientSuccess = false;
        results.errors.push(`[GSC] ${client.name}: ${result.error}`);
        console.error(`[CRON] GSC failed for ${client.name}: ${result.error}`);
      } else {
        console.log(`[CRON] GSC success for ${client.name}: ${result.rowsInserted} rows`);
      }
    }

    if (clientSuccess) results.pulled++;
    else results.failed++;
  }

  return NextResponse.json(results);
}
