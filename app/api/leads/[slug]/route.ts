import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

  const [leads, appointments] = await Promise.all([
    prisma.ghlLead.findMany({
      where: {
        client_id: client.id,
        created_date: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') },
      },
      orderBy: { created_date: 'desc' },
    }),
    prisma.ghlAppointment.findMany({
      where: {
        client_id: client.id,
        appointment_date: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59Z') },
      },
      orderBy: { appointment_date: 'desc' },
    }),
  ]);

  const appointmentsBooked = appointments.length;
  const appointmentsCompleted = appointments.filter(a => a.status === 'attended' || a.status === 'completed' || a.status === 'showed').length;

  // Weekly buckets for chart
  const weeklyMap = new Map<string, number>();
  for (const lead of leads) {
    const d = new Date(lead.created_date);
    const week = new Date(d);
    week.setDate(d.getDate() - d.getDay()); // start of week
    const key = week.toISOString().split('T')[0];
    weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
  }
  const weekly = [...weeklyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([week, count]) => ({ week, count }));

  // Source breakdown
  const sourceMap = new Map<string, number>();
  for (const lead of leads) {
    const src = lead.source || 'unknown';
    sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
  }
  const sources = [...sourceMap.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  // Pipeline breakdown
  const pipeline = { new: 0, contacted: 0, qualified: 0, closed: 0 };
  for (const lead of leads) {
    const s = (lead.status || '').toLowerCase();
    if (s.includes('new') || s === '') pipeline.new++;
    else if (s.includes('contact')) pipeline.contacted++;
    else if (s.includes('qualif')) pipeline.qualified++;
    else if (s.includes('clos') || s.includes('won') || s.includes('lost')) pipeline.closed++;
    else pipeline.new++;
  }

  const summary = {
    newLeads: leads.length,
    appointmentsBooked,
    appointmentsCompleted,
    leadToApptRate: leads.length > 0 ? (appointmentsBooked / leads.length) * 100 : 0,
    pipelineBreakdown: pipeline,
  };

  return NextResponse.json({
    leads: leads.slice(0, 20),
    appointments: appointments.slice(0, 20),
    weekly,
    sources,
    summary,
  });
}
