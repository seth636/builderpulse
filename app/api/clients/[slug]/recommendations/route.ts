import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { generateRecommendations, getRecommendations } from '@/lib/ai-recommendations';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const month = req.nextUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7);
  
  try {
    const recommendations = await getRecommendations(client.id, month);
    return NextResponse.json({ recommendations });
  } catch (error) {
    // Table may not exist yet - return graceful empty response
    console.error('Recommendations fetch error (table may not exist):', error);
    return NextResponse.json({ recommendations: [] });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const month = body.month || new Date().toISOString().slice(0, 7);

  try {
    const recommendations = await generateRecommendations(client.id, month);
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Recommendations generation error:', error);
    return NextResponse.json({ recommendations: [], error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
