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
  const [syncing, setSyncing] = useState<number | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

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

  const handleSync = async (client: Client, integration?: string) => {
    setSyncing(client.id);
    try {
      const res = await fetch(`/api/sync/${client.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration ? { integration } : {}),
      });
      const result = await res.json();

      if (res.ok) {
        const parts: string[] = [];
        if (result.ga4) parts.push(result.ga4.success ? `GA4: ${result.ga4.rowsInserted} rows` : `GA4 Error: ${result.ga4.error}`);
        if (result.gsc) parts.push(result.gsc.success ? `GSC: ${result.gsc.rowsInserted} rows` : `GSC Error: ${result.gsc.error}`);
        if (result.meta) parts.push(result.meta.success ? `Meta: ${result.meta.rowsInserted} rows` : `Meta Error: ${result.meta.error}`);
        if (result.ghl) parts.push(result.ghl.success ? `GHL: ${result.ghl.leadsInserted} leads` : `GHL Error: ${result.ghl.error}`);
        if (result.reviews) parts.push(result.reviews.success ? `Reviews: ${result.reviews.rowsInserted} rows` : `Reviews Error: ${result.reviews.error}`);
        alert('Sync completed!\n' + (parts.join('\n') || 'Nothing to sync (check credentials)'));
      } else {
        alert('Sync failed');
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      alert('Failed to sync data');
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Integrations
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        {client.ga4_property_id && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                            GA4
                          </span>
                        )}
                        {client.gsc_site_url && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                            GSC
                          </span>
                        )}
                        {!client.ga4_property_id && !client.gsc_site_url && (
                          <span className="text-muted text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex flex-wrap justify-end gap-1 mb-2">
                        {client.ga4_property_id && (
                          <button onClick={() => handleSync(client, 'ga4')} disabled={syncing === client.id} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded disabled:opacity-50">GA4</button>
                        )}
                        {client.gsc_site_url && (
                          <button onClick={() => handleSync(client, 'gsc')} disabled={syncing === client.id} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded disabled:opacity-50">GSC</button>
                        )}
                        {client.meta_ad_account_id && (
                          <button onClick={() => handleSync(client, 'meta')} disabled={syncing === client.id} className="text-xs px-2 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 rounded disabled:opacity-50">Meta</button>
                        )}
                        {client.ghl_location_id && (
                          <button onClick={() => handleSync(client, 'ghl')} disabled={syncing === client.id} className="text-xs px-2 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded disabled:opacity-50">GHL</button>
                        )}
                        {client.ghl_location_id && (
                          <button onClick={() => handleSync(client, 'reviews')} disabled={syncing === client.id} className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded disabled:opacity-50">Reviews</button>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
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
                      </div>
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
