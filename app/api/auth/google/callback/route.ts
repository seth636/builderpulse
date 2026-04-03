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
      console.error('Google OAuth error:', error);
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

    // Exchange code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/client/${clientSlug}/connections?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, scope } = tokens;

    // Get user info
    let email = null;
    try {
      const userInfoRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        email = userInfo.email;
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
          provider: 'google',
        },
      },
      create: {
        client_id: client.id,
        provider: 'google',
        account_name: email,
        access_token,
        refresh_token: refresh_token || null,
        token_expiry: tokenExpiry,
        scope: scope || null,
      },
      update: {
        account_name: email,
        access_token,
        refresh_token: refresh_token || null,
        token_expiry: tokenExpiry,
        scope: scope || null,
      },
    });

    // Trigger immediate data pull in background (don't await — let redirect happen fast)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${appUrl}/api/clients/${clientSlug}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google' }),
    }).catch((e) => console.error('[Google connect] Background sync failed:', e));

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/client/${clientSlug}/connections?connected=google`
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`
    );
  }
}
