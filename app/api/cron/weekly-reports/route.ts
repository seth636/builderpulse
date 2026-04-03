export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_UiaDYEhh_9kUMBq5B4AfQm9NUAi94BfBm';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://builderpulse-app-production.up.railway.app';
const CRON_SECRET = 'builderpulse-cron-2026';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun,1=Mon...
  const hourUtc = now.getUTCHours();

  try {
    const schedules = await (prisma as any).reportSchedule.findMany({
      where: { enabled: true, day_of_week: dayOfWeek, hour_utc: hourUtc },
      include: { client: true },
    });

    const results: { clientId: number; status: string; error?: string }[] = [];

    for (const schedule of schedules) {
      try {
        const client = schedule.client;

        // Get latest report or generate one
        const latestReport = await prisma.report.findFirst({
          where: { client_id: client.id },
          orderBy: { created_at: 'desc' },
        });

        if (!latestReport) {
          results.push({ clientId: client.id, status: 'skipped', error: 'No reports found' });
          continue;
        }

        // Build email
        const firstParagraph = latestReport.ai_summary
          ? latestReport.ai_summary.split('\n\n')[0].trim()
          : `Your ${latestReport.period_label} marketing performance report is ready.`;

        const viewUrl = `${APP_URL}/report/${latestReport.id}/view`;

        const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f172a;padding:32px 40px;text-align:center">
      <div style="font-size:32px;font-weight:900;color:#14b8a6;letter-spacing:-1px">HBM</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.1em">Home Builder Marketers</div>
    </div>
    <div style="padding:40px">
      <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a">${client.name}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b">${latestReport.period_label} Marketing Performance Report</p>
      <p style="margin:0 0 24px;line-height:1.7;color:#334155;font-size:15px">${firstParagraph}</p>
      <a href="${viewUrl}" style="display:inline-block;background:#14b8a6;color:white;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none">View Full Report →</a>
    </div>
    <div style="padding:24px 40px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Home Builder Marketers | Monthly Performance Report</p>
    </div>
  </div>
</body>
</html>`;

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Home Builder Marketers <onboarding@resend.dev>',
            to: [schedule.recipient],
            subject: `${client.name} — ${latestReport.period_label} Marketing Performance Report`,
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          await prisma.report.update({ where: { id: latestReport.id }, data: { status: 'sent', sent_at: new Date() } });
          results.push({ clientId: client.id, status: 'sent' });
        } else {
          const err = await resendRes.text();
          results.push({ clientId: client.id, status: 'failed', error: err });
        }
      } catch (err: any) {
        results.push({ clientId: schedule.client_id, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({ processed: schedules.length, results });
  } catch (error: any) {
    console.error('Weekly reports cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
