import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getAuthClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");
  const credentials = JSON.parse(serviceAccountJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}

export async function pullGA4Data(
  clientId: number,
  ga4PropertyId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; error?: string; rowsInserted?: number }> {
  try {
    const auth = getAuthClient();
    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    // --- DAILY METRICS ---
    const dailyReportResponse = await analyticsData.properties.runReport({
      property: `properties/${ga4PropertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "conversions" },
          { name: "screenPageViews" },
        ],
      },
    });
    const dailyReport = dailyReportResponse;

    let rowsInserted = 0;
    const rows = dailyReport.data.rows || [];
    for (const row of rows) {
      const dims = row.dimensionValues || [];
      const vals = row.metricValues || [];
      const dateStr = dims[0]?.value || "";
      const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));

      await prisma.ga4Metric.upsert({
        where: {
          client_id_date: {
            client_id: clientId,
            date: date,
          },
        },
        update: {
          sessions: parseInt(vals[0]?.value || "0"),
          total_users: parseInt(vals[1]?.value || "0"),
          new_users: parseInt(vals[2]?.value || "0"),
          bounce_rate: parseFloat(vals[3]?.value || "0"),
          avg_session_duration: parseFloat(vals[4]?.value || "0"),
          conversions: parseInt(vals[5]?.value || "0"),
          page_views: parseInt(vals[6]?.value || "0"),
        },
        create: {
          client_id: clientId,
          date: date,
          sessions: parseInt(vals[0]?.value || "0"),
          total_users: parseInt(vals[1]?.value || "0"),
          new_users: parseInt(vals[2]?.value || "0"),
          bounce_rate: parseFloat(vals[3]?.value || "0"),
          avg_session_duration: parseFloat(vals[4]?.value || "0"),
          conversions: parseInt(vals[5]?.value || "0"),
          page_views: parseInt(vals[6]?.value || "0"),
        },
      });
      rowsInserted++;
    }

    // --- TOP PAGES ---
    const pagesReport = await analyticsData.properties.runReport({
      property: `properties/${ga4PropertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
        limit: "50",
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      },
    });

    const pageRows = pagesReport.data.rows || [];
    for (const row of pageRows) {
      const dims = row.dimensionValues || [];
      const vals = row.metricValues || [];

      await prisma.ga4Page.upsert({
        where: {
          client_id_start_date_end_date_page_path: {
            client_id: clientId,
            start_date: startDate,
            end_date: endDate,
            page_path: dims[0]?.value || "",
          },
        },
        update: {
          page_views: parseInt(vals[0]?.value || "0"),
          avg_session_duration: parseFloat(vals[1]?.value || "0"),
          bounce_rate: parseFloat(vals[2]?.value || "0"),
        },
        create: {
          client_id: clientId,
          start_date: startDate,
          end_date: endDate,
          page_path: dims[0]?.value || "",
          page_views: parseInt(vals[0]?.value || "0"),
          avg_session_duration: parseFloat(vals[1]?.value || "0"),
          bounce_rate: parseFloat(vals[2]?.value || "0"),
        },
      });
    }

    // --- TRAFFIC SOURCES ---
    const sourcesReport = await analyticsData.properties.runReport({
      property: `properties/${ga4PropertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "sessions" }, { name: "conversions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      },
    });

    const sourceRows = sourcesReport.data.rows || [];
    for (const row of sourceRows) {
      const dims = row.dimensionValues || [];
      const vals = row.metricValues || [];

      await prisma.ga4Source.upsert({
        where: {
          client_id_start_date_end_date_source_medium: {
            client_id: clientId,
            start_date: startDate,
            end_date: endDate,
            source: dims[0]?.value || "",
            medium: dims[1]?.value || "",
          },
        },
        update: {
          sessions: parseInt(vals[0]?.value || "0"),
          conversions: parseInt(vals[1]?.value || "0"),
        },
        create: {
          client_id: clientId,
          start_date: startDate,
          end_date: endDate,
          source: dims[0]?.value || "",
          medium: dims[1]?.value || "",
          sessions: parseInt(vals[0]?.value || "0"),
          conversions: parseInt(vals[1]?.value || "0"),
        },
      });
    }

    return { success: true, rowsInserted };
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error(`[GA4] Error for client ${clientId}: ${message}`);
    return { success: false, error: message };
  }
}
