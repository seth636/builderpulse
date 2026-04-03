export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getClickUpWeeklySummary } from '@/lib/integrations/clickup';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const integration = await prisma.clientIntegration.findUnique({
    where: { client_id_provider: { client_id: client.id, provider: 'clickup' } },
  });

  const connected = !!integration;
  const weeklySummary = connected ? await getClickUpWeeklySummary(client.id) : [];

  // Current week stats
  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() - day + (day === 0 ? -6 : 1));
  weekStart.setUTCHours(0, 0, 0, 0);

  const thisWeekTasks = await prisma.clickUpTask.findMany({
    where: { client_id: client.id, week_start: { gte: weekStart } },
  });

  const completedThisWeek = thisWeekTasks.filter((t) => t.status_type === 'closed').length;
  const inProgressThisWeek = thisWeekTasks.filter((t) => t.status_type === 'in_progress').length;
  const openThisWeek = thisWeekTasks.filter((t) => t.status_type === 'open').length;
  const totalThisWeek = thisWeekTasks.length;
  const completionRate = totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;

  return NextResponse.json({
    connected,
    summary: {
      completedThisWeek,
      inProgressThisWeek,
      openThisWeek,
      totalThisWeek,
      completionRate,
    },
    weeklySummary,
  });
}
