import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: parseInt(params.id) },
      select: {
        id: true,
        client_id: true,
        period_start: true,
        period_end: true,
        period_label: true,
        status: true,
        ai_summary: true,
        ai_recommendations: true,
        sent_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('GET /api/reports/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.report.delete({ where: { id: parseInt(params.id) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/reports/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
