export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getLatestRankings, getKeywordHistory } from '@/lib/integrations/rank-tracker';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword');
  const days = parseInt(searchParams.get('days') || '90');

  // Return history for a specific keyword
  if (keyword) {
    const history = await getKeywordHistory(client.id, keyword, days);
    return NextResponse.json({ history });
  }

  // Return all latest rankings
  const rankings = await getLatestRankings(client.id);
  return NextResponse.json({ rankings });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const body = await req.json();
  const keywords: string[] = (body.keywords || []).map((k: string) => k.trim()).filter(Boolean);

  if (keywords.length === 0) {
    return NextResponse.json({ error: 'No keywords provided' }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let added = 0;
  for (const keyword of keywords) {
    const existing = await prisma.seoRanking.findFirst({
      where: { client_id: client.id, keyword },
    });
    if (!existing) {
      await prisma.seoRanking.create({
        data: {
          client_id: client.id,
          keyword,
          position: 0, // placeholder until GSC sync
          date: today,
        },
      });
      added++;
    }
  }

  return NextResponse.json({ added, total: keywords.length });
}
