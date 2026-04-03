export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { slug: params.slug } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const schedule = await (prisma as any).reportSchedule.findUnique({
      where: { client_id: client.id },
    });

    return NextResponse.json({ schedule: schedule || null });
  } catch (error) {
    console.error('GET report-schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await prisma.client.findUnique({ where: { slug: params.slug } });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const body = await req.json();
    const { enabled, recipient, dayOfWeek, hourUtc } = body;

    const schedule = await (prisma as any).reportSchedule.upsert({
      where: { client_id: client.id },
      update: {
        enabled: enabled ?? false,
        recipient: recipient || '',
        day_of_week: dayOfWeek ?? 1,
        hour_utc: hourUtc ?? 14,
      },
      create: {
        client_id: client.id,
        enabled: enabled ?? false,
        recipient: recipient || '',
        day_of_week: dayOfWeek ?? 1,
        hour_utc: hourUtc ?? 14,
      },
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('POST report-schedule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
