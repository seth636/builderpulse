export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.isRead !== undefined) data.is_read = body.isRead;
  if (body.isResolved !== undefined) data.is_resolved = body.isResolved;

  try {
    const alert = await prisma.anomalyAlert.update({
      where: { id: parseInt(params.id) },
      data,
    });
    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Alert not found or table not ready' }, { status: 404 });
  }
}
