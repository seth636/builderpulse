import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function getPortalSession(request: NextRequest) {
  const cookie = request.cookies.get('portal_session');
  if (!cookie) return null;
  try {
    const data = JSON.parse(Buffer.from(cookie.value, 'base64').toString('utf8'));
    return data;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow portal login
  if (pathname === '/portal/login') {
    return NextResponse.next();
  }

  // Always allow API routes (they do their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Portal routes: /portal/[slug] and /portal/[slug]/reports
  const portalMatch = pathname.match(/^\/portal\/([^\/]+)(\/.*)?$/);
  if (portalMatch) {
    const slug = portalMatch[1];
    const token = request.nextUrl.searchParams.get('token');
    const portalSession = getPortalSession(request);
    const nextAuthToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Admin/PM session can preview portal
    if (nextAuthToken && ['admin', 'pm'].includes((nextAuthToken as any).role || '')) {
      return NextResponse.next();
    }

    // Client session must match slug
    if (portalSession && portalSession.role === 'client') {
      if (portalSession.clientSlug === slug) {
        return NextResponse.next();
      } else {
        return NextResponse.redirect(new URL(`/portal/${portalSession.clientSlug}`, request.url));
      }
    }

    // Token in URL — validate via API call not possible in middleware without DB
    // We'll allow through with token and let the page validate it server-side
    if (token) {
      return NextResponse.next();
    }

    // No auth — redirect to login
    const loginUrl = new URL('/portal/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin/PM routes from client users
  const adminRoutes = ['/dashboard', '/client', '/settings', '/report'];
  const isAdminRoute = adminRoutes.some(r => pathname.startsWith(r));
  if (isAdminRoute) {
    const portalSession = getPortalSession(request);
    if (portalSession && portalSession.role === 'client' && portalSession.clientSlug) {
      return NextResponse.redirect(new URL(`/portal/${portalSession.clientSlug}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/dashboard/:path*',
    '/client/:path*',
    '/settings/:path*',
    '/report/:path*',
  ],
};
