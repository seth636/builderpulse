import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { generateInsights, getInsights } from '@/lib/ai-insights';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const month = req.nextUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const insights = await getInsights(client.id, month);
  return NextResponse.json({ insights });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const month = body.month || new Date().toISOString().slice(0, 7);

  const insights = await generateInsights(client.id, month);
  return NextResponse.json({ insights });
}
