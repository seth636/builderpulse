import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientSlug = searchParams.get('client_slug');

    if (!clientSlug) {
      return NextResponse.json(
        { error: 'client_slug is required' },
        { status: 400 }
      );
    }

    const ghlClientId = process.env.GHL_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!ghlClientId) {
      return NextResponse.json(
        { error: 'GHL OAuth is not configured' },
        { status: 500 }
      );
    }

    // Build state parameter
    const state = Buffer.from(
      JSON.stringify({ clientSlug, provider: 'ghl' })
    ).toString('base64');

    // GHL OAuth scopes
    const scopes = ['contacts.readonly', 'opportunities.readonly'].join(' ');

    const redirectUri = `${appUrl}/api/auth/ghl/callback`;

    const authUrl = new URL(
      'https://marketplace.gohighlevel.com/oauth/chooselocation'
    );
    authUrl.searchParams.set('client_id', ghlClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('GHL OAuth initiate error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate GHL OAuth' },
      { status: 500 }
    );
  }
}
