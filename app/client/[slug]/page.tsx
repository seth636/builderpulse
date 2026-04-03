import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';
import ClientDashboard from '@/components/dashboard/ClientDashboard';

const prisma = new PrismaClient();

export default async function ClientDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <ClientSidebar clientName={client.name} clientSlug={client.slug} />
      <div className="flex-1 ml-60" style={{ backgroundColor: 'var(--bg-page)' }}>
        <TopBar title={client.name} />
        <div className="p-8">
          <ClientDashboard client={{
            id: client.id,
            name: client.name,
            slug: client.slug,
            website_url: client.website_url,
            ga4_property_id: (client as any).ga4_property_id ?? null,
            gsc_site_url: (client as any).gsc_site_url ?? null,
            meta_ad_account_id: (client as any).meta_ad_account_id ?? null,
            ghl_location_id: (client as any).ghl_location_id ?? null,
          }} />
        </div>
      </div>
    </div>
  );
}
