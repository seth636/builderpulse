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
      console.error('GHL OAuth error:', error);
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
    const tokenUrl = 'https://services.leadconnectorhq.com/oauth/token';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/ghl/callback`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!,
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
    const { access_token, refresh_token, expires_in, scope, locationId } = tokens;

    // Get location name
    let locationName = null;
    if (locationId) {
      try {
        const locationRes = await fetch(
          `https://services.leadconnectorhq.com/locations/${locationId}`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              Version: '2021-07-28',
            },
          }
        );
        if (locationRes.ok) {
          const locationData = await locationRes.json();
          locationName = locationData.location?.name || locationData.name || null;
        }
      } catch (err) {
        console.error('Failed to fetch location name:', err);
      }
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
          provider: 'ghl',
        },
      },
      create: {
        client_id: client.id,
        provider: 'ghl',
        account_name: locationName,
        access_token,
        refresh_token: refresh_token || null,
        token_expiry: tokenExpiry,
        scope: scope || null,
      },
      update: {
        account_name: locationName,
        access_token,
        refresh_token: refresh_token || null,
        token_expiry: tokenExpiry,
        scope: scope || null,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/client/${clientSlug}/connections?connected=ghl`
    );
  } catch (error) {
    console.error('GHL OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`
    );
  }
}
