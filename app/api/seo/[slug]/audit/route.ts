import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { runSiteAudit } from '@/lib/integrations/site-audit';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  if (!client.website_url) {
    return NextResponse.json({ error: 'No website URL configured for this client' }, { status: 400 });
  }

  try {
    const result = await runSiteAudit(client.id, client.website_url);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[SiteAudit] Error:', err);
    return NextResponse.json({ error: 'Audit failed: ' + err.message }, { status: 500 });
  }
}
