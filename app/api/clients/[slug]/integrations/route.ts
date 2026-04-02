export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    // Look up client
    const client = await prisma.client.findUnique({
      where: { slug },
      include: {
        integrations: {
          select: {
            provider: true,
            account_name: true,
            created_at: true,
            // Don't expose tokens to frontend
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Transform to include connected status
    const integrations = client.integrations.map(integration => ({
      provider: integration.provider,
      account_name: integration.account_name,
      connected: true,
      created_at: integration.created_at.toISOString(),
    }));

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('GET /api/clients/[slug]/integrations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
