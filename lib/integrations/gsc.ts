import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getAuthClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");
  const credentials = JSON.parse(serviceAccountJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

export async function pullGSCData(
  clientId: number,
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; error?: string; rowsInserted?: number }> {
  try {
    const auth = getAuthClient();
    const searchConsole = google.searchconsole({ version: "v1", auth });

    const response = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query", "page", "date"],
        rowLimit: 1000,
      },
    });

    let rowsInserted = 0;
    const rows = response.data.rows || [];
    for (const row of rows) {
      const keys = row.keys || [];
      const query = keys[0] || "";
      const page = keys[1] || "";
      const dateStr = keys[2] || "";
      const date = dateStr ? new Date(dateStr) : new Date();

      await prisma.gscMetric.upsert({
        where: {
          client_id_date_query_page: {
            client_id: clientId,
            date: date,
            query: query,
            page: page,
          },
        },
        update: {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
        create: {
          client_id: clientId,
          date: date,
          query: query,
          page: page,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
      });
      rowsInserted++;
    }

    return { success: true, rowsInserted };
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error(`[GSC] Error for client ${clientId}: ${message}`);
    return { success: false, error: message };
  }
}
