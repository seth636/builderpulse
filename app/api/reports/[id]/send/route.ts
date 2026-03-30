import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_UiaDYEhh_9kUMBq5B4AfQm9NUAi94BfBm';
const APP_URL = 'https://builderpulse-app-production.up.railway.app';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: parseInt(params.id) },
      include: { client: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Determine recipient email
    const toEmail = (report.client as any).report_email || (report.client as any).email;
    if (!toEmail) {
      return NextResponse.json(
        { error: 'No email address configured for this client. Set report_email in client settings.' },
        { status: 400 }
      );
    }

    // Build email body — first paragraph of AI summary + CTA
    const firstParagraph = report.ai_summary
      ? report.ai_summary.split('\n\n')[0].trim()
      : `Your ${report.period_label} marketing performance report is ready.`;

    const viewUrl = `${APP_URL}/report/${report.id}/view`;

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
      <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a">${report.client.name}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b">${report.period_label} Marketing Performance Report</p>
      <p style="margin:0 0 24px;line-height:1.7;color:#334155;font-size:15px">${firstParagraph}</p>
      <a href="${viewUrl}" style="display:inline-block;background:#14b8a6;color:white;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none">View Full Report →</a>
    </div>
    <div style="padding:24px 40px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">Home Builder Marketers | Monthly Performance Report</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Home Builder Marketers <onboarding@resend.dev>',
        to: [toEmail],
        subject: `${report.client.name} — ${report.period_label} Marketing Performance Report`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend error:', errBody);
      return NextResponse.json(
        { error: `Failed to send email: ${errBody}` },
        { status: 500 }
      );
    }

    // Update status
    await prisma.report.update({
      where: { id: report.id },
      data: { status: 'sent', sent_at: new Date() },
    });

    return NextResponse.json({ success: true, sentTo: toEmail });
  } catch (error: any) {
    console.error('POST /api/reports/[id]/send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
