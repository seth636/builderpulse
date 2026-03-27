'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ClientModal from '@/components/ClientModal';

interface Client {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  pm_name: string | null;
  package: string;
  ga4_property_id: string | null;
  gsc_site_url: string | null;
  meta_ad_account_id: string | null;
  ghl_location_id: string | null;
  google_business_id: string | null;
}

export default function ClientsSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'admin') {
        router.push('/dashboard');
      } else {
        fetchClients();
      }
    }
  }, [session, status, router]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingClient(null);
    fetchClients();
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-60">
          <TopBar title="Client Settings" />
          <div className="p-8 text-center text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-60">
        <TopBar title="Client Settings" />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Manage Clients</h3>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
            >
              Add Client
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    PM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-background/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {client.website_url || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {client.pm_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted capitalize">
                      {client.package}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-accent hover:text-accent/80 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-400 hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ClientModal client={editingClient} onClose={handleModalClose} />
      )}
    </div>
  );
}
