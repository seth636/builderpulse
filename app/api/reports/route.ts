export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const reports = await prisma.report.findMany({
      where: { client_id: parseInt(clientId) },
      select: {
        id: true,
        client_id: true,
        period_start: true,
        period_end: true,
        period_label: true,
        status: true,
        sent_at: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { period_start: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
