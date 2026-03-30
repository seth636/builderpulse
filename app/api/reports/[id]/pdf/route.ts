import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = await prisma.report.findUnique({
      where: { id: parseInt(params.id) },
      select: { report_html: true, period_label: true },
    });

    if (!report || !report.report_html) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const printScript = `<script>window.onload=function(){setTimeout(function(){window.print();},800);}</script>`;
    const html = report.report_html.replace('</body>', printScript + '</body>');

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('GET /api/reports/[id]/pdf error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
