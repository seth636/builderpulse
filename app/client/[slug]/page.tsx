import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { redirect, notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import PackageBadge from '@/components/PackageBadge';

const prisma = new PrismaClient();

export default async function ClientDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
  });

  if (!client) {
    notFound();
  }

  const userRole = (session.user as any).role;
  const userClientId = (session.user as any).clientId;

  if (userRole !== 'admin' && parseInt(userClientId) !== client.id) {
    redirect('/dashboard');
  }

  const sections = [
    { title: 'Analytics', description: 'GA4 traffic and user metrics' },
    { title: 'SEO', description: 'Rankings, backlinks, and audits' },
    { title: 'Ads', description: 'Meta advertising performance' },
    { title: 'Leads', description: 'GHL leads and appointments' },
    { title: 'Reviews', description: 'Google Business reviews' },
    { title: 'Reports', description: 'Generated client reports' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-60">
        <TopBar title={client.name} />
        <div className="p-8">
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {client.name}
                </h2>
                {client.website_url && (
                  <a
                    href={client.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {client.website_url}
                  </a>
                )}
              </div>
              <PackageBadge package={client.package} />
            </div>
            {client.pm_name && (
              <p className="text-muted">
                <span className="text-white/60">Project Manager:</span>{' '}
                {client.pm_name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <div
                key={section.title}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {section.title}
                </h3>
                <p className="text-muted text-sm mb-4">{section.description}</p>
                <div className="bg-background/50 rounded-lg p-4 text-center">
                  <p className="text-muted text-sm">Coming in Phase 2-5</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
