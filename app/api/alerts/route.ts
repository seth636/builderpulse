export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const severity = searchParams.get('severity');
  const clientId = searchParams.get('clientId');
  const isRead = searchParams.get('isRead');
  const isResolved = searchParams.get('isResolved');

  const where: any = {};
  if (severity) where.severity = severity;
  if (clientId) where.client_id = parseInt(clientId);
  if (isRead !== null) where.is_read = isRead === 'true';
  if (isResolved !== null) where.is_resolved = isResolved === 'true';

  try {
    const alerts = await prisma.anomalyAlert.findMany({
      where,
      include: { client: { select: { id: true, name: true, slug: true } } },
      orderBy: { created_at: 'desc' },
      take: 200,
    });
    return NextResponse.json({ alerts });
  } catch (error) {
    // Table may not exist yet - return graceful empty response
    console.error('Alerts fetch error (table may not exist):', error);
    return NextResponse.json({ alerts: [] });
  }
}
