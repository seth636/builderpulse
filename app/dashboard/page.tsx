import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
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
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userRole = (session.user as any).role;
  const userClientId = (session.user as any).clientId;

  let clients;

  if (userRole === 'admin') {
    clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
    });
  } else if (userClientId) {
    clients = await prisma.client.findMany({
      where: { id: parseInt(userClientId) },
    });
  } else {
    clients = [];
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
