import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const BASE_URL = process.env.NEXTAUTH_URL || 'https://builderpulse-app-production.up.railway.app';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = parseInt(params.id);
    const token = uuidv4();

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        portal_token: token,
        portal_token_regen_at: new Date(),
      },
    });

    const portalUrl = `${BASE_URL}/portal/${client.slug}?token=${token}`;

    return NextResponse.json({ token, portalUrl });
  } catch (error) {
    console.error('POST /api/clients/[id]/portal-token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
