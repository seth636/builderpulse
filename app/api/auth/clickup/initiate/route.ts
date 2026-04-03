export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientSlug = searchParams.get('client_slug');

  if (!clientSlug) {
    return NextResponse.json({ error: 'client_slug required' }, { status: 400 });
  }

  const clientId = process.env.CLICKUP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'CLICKUP_CLIENT_ID not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/clickup/callback`;
  const state = Buffer.from(JSON.stringify({ clientSlug, provider: 'clickup' })).toString('base64');

  const authUrl = new URL('https://app.clickup.com/api');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
