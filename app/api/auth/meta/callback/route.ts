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
      console.error('Meta OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`
      );
    }

    // Decode state
    let stateData: { clientSlug: string; provider: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (err) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_state`
      );
    }

    const { clientSlug } = stateData;

    // Look up client
    const client = await prisma.client.findUnique({
      where: { slug: clientSlug },
    });

    if (!client) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=client_not_found`
      );
    }

    // Exchange code for access token
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/meta/callback`;

    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', process.env.META_APP_ID!);
    tokenUrl.searchParams.set('client_secret', process.env.META_APP_SECRET!);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/client/${clientSlug}/connections?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, expires_in } = tokens;

    // Get account name
    let accountName = null;
    try {
      const userInfoRes = await fetch(
        `https://graph.facebook.com/me?fields=name,email&access_token=${access_token}`
      );
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        accountName = userInfo.email || userInfo.name || null;
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }

    // Calculate token expiry
    const tokenExpiry = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    // Upsert integration
    await prisma.clientIntegration.upsert({
      where: {
        client_id_provider: {
          client_id: client.id,
          provider: 'meta',
        },
      },
      create: {
        client_id: client.id,
        provider: 'meta',
        account_name: accountName,
        access_token,
        refresh_token: null,
        token_expiry: tokenExpiry,
        scope: null,
      },
      update: {
        account_name: accountName,
        access_token,
        token_expiry: tokenExpiry,
      },
    });

    // Trigger immediate data pull in background
    const appUrlMeta = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${appUrlMeta}/api/clients/${clientSlug}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'meta' }),
    }).catch((e) => console.error('[Meta connect] Background sync failed:', e));

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/client/${clientSlug}/connections?connected=meta`
    );
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`
    );
  }
}
