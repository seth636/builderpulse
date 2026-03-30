import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || 're_UiaDYEhh_9kUMBq5B4AfQm9NUAi94BfBm');
const BASE_URL = process.env.NEXTAUTH_URL || 'https://builderpulse-app-production.up.railway.app';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, customMessage } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.portal_token) {
      return NextResponse.json({ error: 'Portal token not generated. Please generate one first.' }, { status: 400 });
    }

    const portalUrl = `${BASE_URL}/portal/${client.slug}?token=${client.portal_token}`;

    const customSection = customMessage
      ? `<p style="margin: 16px 0; color: #374151; line-height: 1.6;">${customMessage}</p>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 40px 32px;">
      <p style="color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 8px;">Home Builder Marketers</p>
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; line-height: 1.3;">Your Marketing Dashboard is Ready</h1>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi there,</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        Your personalized marketing dashboard for <strong>${client.name}</strong> is now live. 
        You can view your real-time marketing performance — including website traffic, SEO rankings, ads performance, leads, and reviews — all in one place.
      </p>

      ${customSection}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${portalUrl}" 
           style="display: inline-block; background-color: #0ea5e9; color: white; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.3px;">
          View Your Dashboard →
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
        Or copy this link into your browser:
      </p>
      <p style="background: #f1f5f9; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #374151; word-break: break-all; margin: 0 0 24px;">
        ${portalUrl}
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
        Questions? Reply to this email or contact your account manager at 
        <a href="https://homebuildermarketers.com" style="color: #0ea5e9;">homebuildermarketers.com</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        © ${new Date().getFullYear()} Home Builder Marketers · 
        <a href="https://homebuildermarketers.com" style="color: #0ea5e9; text-decoration: none;">homebuildermarketers.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      from: 'Home Builder Marketers <onboarding@resend.dev>',
      to: email,
      subject: `Your Marketing Dashboard — ${client.name}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/clients/[id]/send-portal-link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
