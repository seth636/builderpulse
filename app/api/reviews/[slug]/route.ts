import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const allReviews = await prisma.googleReview.findMany({
    where: { client_id: client.id },
    orderBy: { review_date: 'desc' },
  });

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const reviewsThisMonth = allReviews.filter(r => r.review_date >= thisMonthStart).length;
  const fiveStarCount = allReviews.filter(r => r.rating === 5).length;
  const repliedCount = allReviews.filter(r => r.reply_text).length;
  const avgRating = allReviews.length > 0
    ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    : 0;
  const responseRate = allReviews.length > 0 ? (repliedCount / allReviews.length) * 100 : 0;

  // Monthly chart data
  const monthlyMap = new Map<string, number>();
  for (const review of allReviews) {
    const key = review.review_date.toISOString().slice(0, 7); // YYYY-MM
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }
  const monthly = [...monthlyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ month, count }));

  const summary = {
    totalReviews: allReviews.length,
    averageRating: avgRating,
    fiveStarCount,
    responseRate,
    reviewsThisMonth,
  };

  return NextResponse.json({
    reviews: allReviews.slice(0, 20),
    monthly,
    summary,
  });
}
