import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateReport } from '@/lib/report-generator';

const prisma = new PrismaClient();

const APP_URL = 'https://builderpulse-app-production.up.railway.app';
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_UiaDYEhh_9kUMBq5B4AfQm9NUAi94BfBm';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Previous month range
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const clients = await prisma.client.findMany();

  const results = { generated: 0, sent: 0, errors: [] as string[] };

  for (const client of clients) {
    try {
      // Check if there's any data for this client in the prev month
      const ga4Count = await prisma.ga4Metric.count({
        where: { client_id: client.id, date: { gte: periodStart, lte: periodEnd } },
      });
      const gscCount = await prisma.gscMetric.count({
        where: { client_id: client.id, date: { gte: periodStart, lte: periodEnd } },
      });
      const metaCount = await prisma.metaAd.count({
        where: { client_id: client.id, date: { gte: periodStart, lte: periodEnd } },
      });
      const ghlCount = await prisma.ghlLead.count({
        where: { client_id: client.id, created_date: { gte: periodStart, lte: periodEnd } },
      });

      const hasData = ga4Count > 0 || gscCount > 0 || metaCount > 0 || ghlCount > 0;
      if (!hasData) {
        console.log(`[CRON] Skipping ${client.name} — no data for period`);
        continue;
      }

      // Generate report
      const reportId = await generateReport(client.id, periodStart, periodEnd);
      results.generated++;
      console.log(`[CRON] Generated report ${reportId} for ${client.name}`);

      // Auto-send if enabled
      if ((client as any).auto_send_reports) {
        const toEmail = (client as any).report_email || null;
        if (!toEmail) {
          results.errors.push(`[Send] ${client.name}: no report_email configured`);
          continue;
        }

        const report = await prisma.report.findUnique({ where: { id: reportId } });
        if (!report) continue;

        const firstParagraph = report.ai_summary
          ? report.ai_summary.split('\n\n')[0].trim()
          : `Your ${report.period_label} marketing performance report is ready.`;

        const viewUrl = `${APP_URL}/report/${reportId}/view`;

        const emailHtml = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;background:#f8fafc;margin:0;padding:40px 20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden">
    <div style="background:#0f172a;padding:32px 40px;text-align:center">
      <div style="font-size:32px;font-weight:900;color:#14b8a6">HBM</div>
    </div>
    <div style="padding:40px">
      <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a">${client.name}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b">${report.period_label} Marketing Performance Report</p>
      <p style="margin:0 0 24px;line-height:1.7;color:#334155;font-size:15px">${firstParagraph}</p>
      <a href="${viewUrl}" style="display:inline-block;background:#14b8a6;color:white;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none">View Full Report →</a>
    </div>
  </div>
</body>
</html>`;

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Home Builder Marketers <onboarding@resend.dev>',
            to: [toEmail],
            subject: `${client.name} — ${report.period_label} Marketing Performance Report`,
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          await prisma.report.update({
            where: { id: reportId },
            data: { status: 'sent', sent_at: new Date() },
          });
          results.sent++;
          console.log(`[CRON] Auto-sent report for ${client.name} to ${toEmail}`);
        } else {
          const err = await resendRes.text();
          results.errors.push(`[Send] ${client.name}: ${err}`);
        }
      }
    } catch (e: any) {
      results.errors.push(`[Report] ${client.name}: ${e.message}`);
      console.error(`[CRON] Failed for ${client.name}:`, e);
    }
  }

  return NextResponse.json(results);
}
