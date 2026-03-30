export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('GET /api/clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, website_url, pm_name, package: pkg, ga4_property_id, gsc_site_url, meta_ad_account_id, ghl_location_id, google_business_id, auto_send_reports, report_email } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);

    const client = await prisma.client.create({
      data: {
        name,
        slug,
        website_url: website_url || null,
        pm_name: pm_name || null,
        package: pkg || 'essentials',
        ga4_property_id: ga4_property_id || null,
        gsc_site_url: gsc_site_url || null,
        meta_ad_account_id: meta_ad_account_id || null,
        ghl_location_id: ghl_location_id || null,
        google_business_id: google_business_id || null,
        auto_send_reports: auto_send_reports ?? false,
        report_email: report_email || null,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
