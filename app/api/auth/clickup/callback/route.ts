export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`
      );
    }

    let stateData: { clientSlug: string; provider: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_state`
      );
    }

    const { clientSlug } = stateData;

    const client = await prisma.client.findUnique({ where: { slug: clientSlug } });
    if (!client) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=client_not_found`
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/clickup/callback`;

    // Exchange code for token
    const tokenRes = await fetch('https://api.clickup.com/api/v2/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.CLICKUP_CLIENT_ID,
        client_secret: process.env.CLICKUP_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('ClickUp token exchange failed:', errBody);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/client/${clientSlug}/connections?error=token_exchange_failed`
      );
    }

    const { access_token } = await tokenRes.json();

    // Get workspace info for account_name
    let accountName: string | null = null;
    try {
      const userRes = await fetch('https://api.clickup.com/api/v2/user', {
        headers: { Authorization: access_token },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        accountName = userData.user?.username || userData.user?.email || null;
      }
    } catch { /* graceful */ }

    // Upsert integration
    await prisma.clientIntegration.upsert({
      where: { client_id_provider: { client_id: client.id, provider: 'clickup' } },
      create: {
        client_id: client.id,
        provider: 'clickup',
        account_name: accountName,
        access_token,
        refresh_token: null,
        token_expiry: null,
        scope: null,
      },
      update: {
        account_name: accountName,
        access_token,
      },
    });

    // Trigger immediate data pull in background
    fetch(`${appUrl}/api/clients/${clientSlug}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'clickup' }),
    }).catch((e) => console.error('[ClickUp connect] Background sync failed:', e));

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/client/${clientSlug}/connections?connected=clickup`
    );
  } catch (error) {
    console.error('ClickUp OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`
    );
  }
}
