import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GHL_BASE = 'https://services.leadconnectorhq.com';

export async function pullGoogleReviews(
  clientId: number,
  locationId: string,
  clientApiKey?: string
): Promise<{ success: boolean; rowsInserted: number; error?: string }> {
  const apiKey = clientApiKey || process.env.GHL_API_KEY;
  if (!apiKey) {
    return { success: false, rowsInserted: 0, error: 'GHL_API_KEY not set' };
  }

  try {
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      'Location-Id': locationId,
    };

    // Try GHL reviews endpoint
    const res = await fetch(
      `${GHL_BASE}/reputation/review?locationId=${locationId}&limit=100`,
      { headers }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, rowsInserted: 0, error: (body as any)?.message || `HTTP ${res.status}` };
    }

    const data = await res.json();
    const reviews: any[] = data.reviews || data.data || [];
    let rowsInserted = 0;

    for (const review of reviews) {
      const reviewId = review.reviewId || review.id || `${locationId}-${review.reviewerName}-${review.createTime}`;
      const existing = await prisma.googleReview.findFirst({
        where: { review_id: reviewId },
      });

      const reviewData = {
        client_id: clientId,
        review_id: reviewId,
        author_name: review.reviewerName || review.reviewer?.displayName || 'Anonymous',
        rating: parseInt(review.rating || review.starRating || '5'),
        text: review.comment || review.reviewReply?.comment || review.review || null,
        review_date: new Date(review.createTime || review.reviewDate || Date.now()),
        reply_text: review.reviewReply?.comment || null,
        reply_date: review.reviewReply?.updateTime ? new Date(review.reviewReply.updateTime) : null,
      };

      if (existing) {
        await prisma.googleReview.update({ where: { id: existing.id }, data: reviewData });
      } else {
        await prisma.googleReview.create({ data: reviewData });
        rowsInserted++;
      }
    }

    return { success: true, rowsInserted };
  } catch (err: any) {
    return { success: false, rowsInserted: 0, error: err?.message || 'Unknown error' };
  }
}
