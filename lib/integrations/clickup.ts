import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function pullClickUpData(
  clientId: number,
  accessToken: string,
  daysBack = 30
): Promise<{ success: boolean; tasksUpserted?: number; error?: string }> {
  try {
    // 1. Get all workspaces (teams) for this token
    const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
      headers: { Authorization: accessToken },
    });

    if (!teamsRes.ok) {
      return { success: false, error: `ClickUp teams fetch failed: ${teamsRes.status}` };
    }

    const teamsData = await teamsRes.json();
    const teams: any[] = teamsData.teams || [];

    if (teams.length === 0) {
      return { success: false, error: 'No ClickUp workspaces found for this token' };
    }

    const sinceMs = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    let totalUpserted = 0;

    for (const team of teams) {
      // 2. Get all spaces in the team
      const spacesRes = await fetch(
        `https://api.clickup.com/api/v2/team/${team.id}/space?archived=false`,
        { headers: { Authorization: accessToken } }
      );
      if (!spacesRes.ok) continue;

      const spacesData = await spacesRes.json();
      const spaces: any[] = spacesData.spaces || [];

      for (const space of spaces) {
        // 3. Get all lists in the space (via folders + folderless)
        const [foldersRes, folderlessRes] = await Promise.all([
          fetch(`https://api.clickup.com/api/v2/space/${space.id}/folder?archived=false`, {
            headers: { Authorization: accessToken },
          }),
          fetch(`https://api.clickup.com/api/v2/space/${space.id}/list?archived=false`, {
            headers: { Authorization: accessToken },
          }),
        ]);

        const allLists: any[] = [];

        if (foldersRes.ok) {
          const foldersData = await foldersRes.json();
          for (const folder of foldersData.folders || []) {
            const listsRes = await fetch(
              `https://api.clickup.com/api/v2/folder/${folder.id}/list?archived=false`,
              { headers: { Authorization: accessToken } }
            );
            if (listsRes.ok) {
              const listsData = await listsRes.json();
              allLists.push(...(listsData.lists || []));
            }
          }
        }

        if (folderlessRes.ok) {
          const folderlessData = await folderlessRes.json();
          allLists.push(...(folderlessData.lists || []));
        }

        // 4. Pull tasks from each list updated in last N days
        for (const list of allLists) {
          let page = 0;
          while (true) {
            const tasksRes = await fetch(
              `https://api.clickup.com/api/v2/list/${list.id}/task?` +
                new URLSearchParams({
                  include_closed: 'true',
                  date_updated_gt: sinceMs.toString(),
                  page: page.toString(),
                  subtasks: 'true',
                }),
              { headers: { Authorization: accessToken } }
            );

            if (!tasksRes.ok) break;

            const tasksData = await tasksRes.json();
            const tasks: any[] = tasksData.tasks || [];
            if (tasks.length === 0) break;

            for (const task of tasks) {
              const statusType = task.status?.type || 'open';
              const completedDate = task.date_closed
                ? new Date(parseInt(task.date_closed))
                : null;
              const dueDate = task.due_date
                ? new Date(parseInt(task.due_date))
                : null;
              const assignee = task.assignees?.[0]?.username || null;
              const weekStart = getWeekStart(
                completedDate || new Date(parseInt(task.date_updated) || Date.now())
              );

              await prisma.clickUpTask.upsert({
                where: { client_id_task_id: { client_id: clientId, task_id: task.id } },
                create: {
                  client_id: clientId,
                  task_id: task.id,
                  task_name: task.name,
                  status: task.status?.status || 'unknown',
                  status_type: statusType,
                  list_id: list.id,
                  list_name: list.name,
                  space_id: space.id,
                  assignee_name: assignee,
                  due_date: dueDate,
                  completed_date: completedDate,
                  week_start: weekStart,
                },
                update: {
                  task_name: task.name,
                  status: task.status?.status || 'unknown',
                  status_type: statusType,
                  assignee_name: assignee,
                  due_date: dueDate,
                  completed_date: completedDate,
                  week_start: weekStart,
                  updated_at: new Date(),
                },
              });
              totalUpserted++;
            }

            if (tasksData.last_page) break;
            page++;
            // Rate limit: ClickUp allows 100 req/min
            await new Promise((r) => setTimeout(r, 100));
          }
        }
      }
    }

    return { success: true, tasksUpserted: totalUpserted };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getClickUpWeeklySummary(
  clientId: number,
  weeksBack = 8
): Promise<{ week: string; completed: number; inProgress: number; open: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - weeksBack * 7);

  const tasks = await prisma.clickUpTask.findMany({
    where: { client_id: clientId, week_start: { gte: since } },
  });

  const weekMap = new Map<
    string,
    { completed: number; inProgress: number; open: number }
  >();

  for (const task of tasks) {
    const key = task.week_start.toISOString().split('T')[0];
    if (!weekMap.has(key)) weekMap.set(key, { completed: 0, inProgress: 0, open: 0 });
    const w = weekMap.get(key)!;
    if (task.status_type === 'closed') w.completed++;
    else if (task.status_type === 'in_progress') w.inProgress++;
    else w.open++;
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, counts]) => ({ week, ...counts }));
}
