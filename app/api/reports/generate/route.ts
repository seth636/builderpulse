export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateReport } from '@/lib/report-generator';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, periodStart, periodEnd } = body;

    if (!clientId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'clientId, periodStart, and periodEnd are required' },
        { status: 400 }
      );
    }

    const reportId = await generateReport(
      parseInt(clientId),
      new Date(periodStart),
      new Date(periodEnd)
    );

    return NextResponse.json({ reportId });
  } catch (error: any) {
    console.error('POST /api/reports/generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
