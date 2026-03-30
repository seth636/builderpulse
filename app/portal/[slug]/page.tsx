import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PortalDashboardClient from './PortalDashboardClient';

const prisma = new PrismaClient();

function getPortalSessionFromCookies(cookieStore: ReturnType<typeof cookies>) {
  const cookie = cookieStore.get('portal_session');
  if (!cookie) return null;
  try {
    return JSON.parse(Buffer.from(cookie.value, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { token?: string };
}) {
  const cookieStore = cookies();
  const tokenParam = searchParams.token;

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });

  if (!client) {
    redirect('/portal/login');
  }

  // Check auth
  let authorized = false;
  let accessMethod: 'token' | 'session' | 'admin' = 'token';

  // 1. Token
  if (tokenParam && client.portal_enabled && client.portal_token === tokenParam) {
    authorized = true;
    accessMethod = 'token';
  }

  // 2. Portal session
  const portalSession = getPortalSessionFromCookies(cookieStore);
  if (!authorized && portalSession?.role === 'client' && portalSession?.clientId === client.id) {
    authorized = true;
    accessMethod = 'session';
  }

  // 3. Admin/PM NextAuth session
  const nextAuthSession = await getServerSession(authOptions);
  if (!authorized && nextAuthSession && ['admin', 'pm'].includes((nextAuthSession.user as any).role || '')) {
    authorized = true;
    accessMethod = 'admin';
  }

  if (!authorized) {
    redirect(`/portal/login?redirect=/portal/${params.slug}${tokenParam ? `?token=${tokenParam}` : ''}`);
  }

  return (
    <PortalDashboardClient
      slug={params.slug}
      clientName={client.name}
      clientWebsite={client.website_url || null}
      hasGA4={!!client.ga4_property_id}
      hasGSC={!!client.gsc_site_url}
      hasMeta={!!client.meta_ad_account_id}
      hasGHL={!!client.ghl_location_id}
      tokenParam={tokenParam || null}
      accessMethod={accessMethod}
    />
  );
}
