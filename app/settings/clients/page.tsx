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
  auto_send_reports?: boolean;
  report_email?: string | null;
  portal_enabled?: boolean;
  portal_token?: string | null;
  client_login_enabled?: boolean;
}

const integrationBadgeStyle = (key: string): React.CSSProperties => {
  const map: Record<string, { color: string; background: string; border: string }> = {
    GA4:    { color: '#F59E0B', background: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
    GSC:    { color: '#926BD9', background: 'rgba(147,107,218,0.12)', border: 'rgba(147,107,218,0.3)' },
    Meta:   { color: '#818CF8', background: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)' },
    GHL:    { color: '#00FFD4', background: 'rgba(0,255,212,0.12)',   border: 'rgba(0,255,212,0.3)' },
    Reviews:{ color: '#F472B6', background: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
  };
  const c = map[key] ?? { color: 'var(--text-muted)', background: 'rgba(139,139,158,0.1)', border: 'rgba(139,139,158,0.3)' };
  return {
    fontSize: 10,
    fontWeight: 500,
    padding: '3px 8px',
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    border: `1px solid ${c.border}`,
    color: c.color,
    background: c.background,
  };
};

export default function ClientsSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

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
      <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
        <Sidebar />
        <div className="flex-1 ml-60" style={{ backgroundColor: 'var(--bg-page)' }}>
          <TopBar title="Client Settings" />
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Sidebar />
      <div className="flex-1 ml-60" style={{ backgroundColor: 'var(--bg-page)' }}>
        <TopBar title="Client Settings" />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Manage Clients</h3>
            <button onClick={handleAdd} className="btn-teal">
              Add Client
            </button>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(147,107,218,0.08) 0%, rgba(13,17,23,0.95) 50%, rgba(0,0,0,0.98) 100%)',
            border: '1px solid rgba(147,107,218,0.15)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(147,107,218,0.1)' }}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>PM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Integrations</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    style={{
                      borderBottom: '1px solid rgba(147,107,218,0.06)',
                      background: hoveredRow === client.id ? 'rgba(147,107,218,0.04)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={() => setHoveredRow(client.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>{client.website_url || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>{client.pm_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize" style={{ color: 'var(--text-muted)' }}>{client.package}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {client.ga4_property_id && <span style={integrationBadgeStyle('GA4')}>GA4</span>}
                        {client.gsc_site_url && <span style={integrationBadgeStyle('GSC')}>GSC</span>}
                        {client.meta_ad_account_id && <span style={integrationBadgeStyle('Meta')}>Meta</span>}
                        {client.ghl_location_id && <span style={integrationBadgeStyle('GHL')}>GHL</span>}
                        {client.ghl_location_id && <span style={integrationBadgeStyle('Reviews')}>Reviews</span>}
                        {!client.ga4_property_id && !client.gsc_site_url && !client.meta_ad_account_id && !client.ghl_location_id && (
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4, marginBottom: 8 }}>
                        {client.ga4_property_id && (
                          <button onClick={() => handleSync(client, 'ga4')} disabled={syncing === client.id} style={integrationBadgeStyle('GA4')} className="cursor-pointer disabled:opacity-50">GA4</button>
                        )}
                        {client.gsc_site_url && (
                          <button onClick={() => handleSync(client, 'gsc')} disabled={syncing === client.id} style={integrationBadgeStyle('GSC')} className="cursor-pointer disabled:opacity-50">GSC</button>
                        )}
                        {client.meta_ad_account_id && (
                          <button onClick={() => handleSync(client, 'meta')} disabled={syncing === client.id} style={integrationBadgeStyle('Meta')} className="cursor-pointer disabled:opacity-50">Meta</button>
                        )}
                        {client.ghl_location_id && (
                          <button onClick={() => handleSync(client, 'ghl')} disabled={syncing === client.id} style={integrationBadgeStyle('GHL')} className="cursor-pointer disabled:opacity-50">GHL</button>
                        )}
                        {client.ghl_location_id && (
                          <button onClick={() => handleSync(client, 'reviews')} disabled={syncing === client.id} style={integrationBadgeStyle('Reviews')} className="cursor-pointer disabled:opacity-50">Reviews</button>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button onClick={() => handleEdit(client)} className="text-accent hover:text-accent/80 font-medium text-sm">Edit</button>
                        <button onClick={() => handleDelete(client.id)} className="text-red-400 hover:text-red-300 font-medium text-sm">Delete</button>
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
