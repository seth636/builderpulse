export const dynamic = 'force-dynamic';

import { PrismaClient } from '@prisma/client';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ClientCard from '@/components/ClientCard';
import SearchBar from '@/components/SearchBar';

const prisma = new PrismaClient();

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
  });

  // Fetch latest health scores and unresolved alert counts for all clients
  const healthScores = await prisma.clientHealthScore.findMany({
    where: { client_id: { in: clients.map(c => c.id) } },
    orderBy: { calculated_at: 'desc' },
  });
  const alertCounts = await prisma.anomalyAlert.groupBy({
    by: ['client_id'],
    where: { is_resolved: false, client_id: { in: clients.map(c => c.id) } },
    _count: { id: true },
  });

  // Build maps
  const healthMap: Record<number, number> = {};
  for (const hs of healthScores) {
    if (healthMap[hs.client_id] == null) healthMap[hs.client_id] = hs.score;
  }
  const alertMap: Record<number, number> = {};
  for (const ac of alertCounts) {
    alertMap[ac.client_id] = ac._count.id;
  }

  const search = searchParams.search?.toLowerCase() || '';
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search)
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-60">
        <TopBar title="Dashboard">
          <SearchBar />
        </TopBar>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                name={client.name}
                slug={client.slug}
                website_url={client.website_url}
                pm_name={client.pm_name}
                package={client.package}
                healthScore={healthMap[client.id] ?? null}
                alertCount={alertMap[client.id] ?? 0}
              />
            ))}
          </div>
          {filteredClients.length === 0 && (
            <div className="text-center text-muted py-12">
              No clients found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
