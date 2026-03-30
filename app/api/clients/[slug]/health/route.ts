export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { calculateHealthScore, getLatestHealthScore } from '@/lib/client-health';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  try {
    // Return latest cached score if available
    const existing = await prisma.clientHealthScore.findFirst({
      where: { client_id: client.id },
      orderBy: { calculated_at: 'desc' },
    });

    if (existing) {
      return NextResponse.json({ score: existing.score, breakdown: existing.breakdown_json, calculatedAt: existing.calculated_at });
    }

    // Calculate fresh
    const score = await calculateHealthScore(client.id);
    const record = await prisma.clientHealthScore.findFirst({
      where: { client_id: client.id },
      orderBy: { calculated_at: 'desc' },
    });
    return NextResponse.json({ score, breakdown: record?.breakdown_json || {}, calculatedAt: record?.calculated_at });
  } catch (error) {
    // Table may not exist yet - return graceful empty response
    console.error('Health score error (table may not exist):', error);
    return NextResponse.json({ score: null, breakdown: {}, calculatedAt: null });
  }
}
