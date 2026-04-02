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

    const metaAppId = process.env.META_APP_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!metaAppId) {
      return NextResponse.json(
        { error: 'Meta OAuth is not configured' },
        { status: 500 }
      );
    }

    // Build state parameter
    const state = Buffer.from(
      JSON.stringify({ clientSlug, provider: 'meta' })
    ).toString('base64');

    // Meta OAuth scopes
    const scopes = ['ads_read', 'ads_management', 'read_insights'].join(',');

    const redirectUri = `${appUrl}/api/auth/meta/callback`;

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', metaAppId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Meta OAuth initiate error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Meta OAuth' },
      { status: 500 }
    );
  }
}
