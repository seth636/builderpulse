'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';

interface Integration {
  provider: string;
  account_name: string | null;
  connected: boolean;
  created_at?: string;
}

interface IntegrationCardProps {
  provider: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  accountName?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  comingSoon?: boolean;
}

function IntegrationCard({
  provider,
  name,
  description,
  icon,
  connected,
  accountName,
  onConnect,
  onDisconnect,
  comingSoon = false,
}: IntegrationCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDisconnect = () => {
    setShowConfirm(false);
    onDisconnect();
  };

  return (
    <div style={{
      background: 'rgba(147, 107, 218, 0.03)',
      border: '1px solid rgba(147, 107, 218, 0.15)',
      borderRadius: '12px',
      padding: '24px',
      transition: 'all 0.2s ease',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          background: 'rgba(0, 255, 212, 0.08)',
          border: '1px solid rgba(0, 255, 212, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#FFFFFF',
            margin: 0,
            marginBottom: '4px',
          }}>
            {name}
          </h3>
          <p style={{
            fontSize: '13px',
            color: '#8b8b9e',
            margin: 0,
            lineHeight: '1.5',
          }}>
            {description}
          </p>
        </div>
      </div>

      {!comingSoon && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? '#10b981' : '#6b6b7e',
            }} />
            <span style={{
              fontSize: '13px',
              color: connected ? '#10b981' : '#6b6b7e',
              fontWeight: '500',
            }}>
              {connected ? 'Connected' : 'Not connected'}
            </span>
            {connected && accountName && (
              <span style={{
                fontSize: '12px',
                color: '#6b6b7e',
                marginLeft: '4px',
              }}>
                ({accountName})
              </span>
            )}
          </div>

          {!showConfirm ? (
            <button
              onClick={connected ? () => setShowConfirm(true) : onConnect}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                ...(connected ? {
                  color: '#ef4444',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                } : {
                  color: '#000',
                  background: '#00FFD4',
                  border: 'none',
                }),
              }}
              onMouseEnter={(e) => {
                if (connected) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                } else {
                  e.currentTarget.style.background = '#00e5c3';
                }
              }}
              onMouseLeave={(e) => {
                if (connected) {
                  e.currentTarget.style.background = 'transparent';
                } else {
                  e.currentTarget.style.background = '#00FFD4';
                }
              }}
            >
              {connected ? 'Disconnect' : 'Connect'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  color: '#FFFFFF',
                  background: '#ef4444',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  color: '#8b8b9e',
                  background: 'rgba(147, 107, 218, 0.08)',
                  border: '1px solid rgba(147, 107, 218, 0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(147, 107, 218, 0.15)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(147, 107, 218, 0.08)';
                  e.currentTarget.style.color = '#8b8b9e';
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {comingSoon && (
        <div style={{
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '500',
          borderRadius: '6px',
          color: '#6b6b7e',
          background: 'rgba(147, 107, 218, 0.08)',
          border: '1px solid rgba(147, 107, 218, 0.15)',
          textAlign: 'center',
        }}>
          Coming Soon
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [client, setClient] = useState<{ name: string; slug: string } | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for success/error messages in URL
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      const providerNames: { [key: string]: string } = {
        google: 'Google',
        ghl: 'GoHighLevel',
        meta: 'Meta',
      };
      setSuccessMessage(`${providerNames[connected] || connected} connected successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }

    if (error) {
      setErrorMessage(`Failed to connect: ${error}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }

    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      // Fetch client info
      const clientRes = await fetch(`/api/clients/${slug}`);
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      }

      // Fetch integrations
      const intRes = await fetch(`/api/clients/${slug}/integrations`);
      if (intRes.ok) {
        const intData = await intRes.json();
        setIntegrations(intData.integrations || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (provider: string) => {
    window.location.href = `/api/auth/${provider}/initiate?client_slug=${slug}`;
  };

  const handleDisconnect = async (provider: string) => {
    try {
      const res = await fetch(`/api/clients/${slug}/integrations/${provider}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccessMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected successfully!`);
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchData();
      } else {
        setErrorMessage('Failed to disconnect integration');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setErrorMessage('Failed to disconnect integration');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const getIntegration = (provider: string): Integration | undefined => {
    return integrations.find(i => i.provider === provider);
  };

  if (loading || !client) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: '#000000' }}>
        <ClientSidebar clientName={client?.name || 'Loading...'} clientSlug={slug} />
        <div className="flex-1 ml-60" style={{ backgroundColor: '#000000' }}>
          <TopBar title="Integrations & Connections" />
          <div className="p-8">
            <p style={{ color: '#8b8b9e' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#000000' }}>
      <ClientSidebar clientName={client.name} clientSlug={client.slug} />
      <div className="flex-1 ml-60" style={{ backgroundColor: '#000000' }}>
        <TopBar title="Integrations & Connections" />
        <div className="p-8">
          {/* Success/Error Messages */}
          {successMessage && (
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#10b981',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              {errorMessage}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#FFFFFF',
              margin: 0,
              marginBottom: '8px',
            }}>
              Connect Your Services
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#8b8b9e',
              margin: 0,
            }}>
              Authorize BuilderPulse to access your marketing and analytics platforms
            </p>
          </div>

          {/* Integration Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            <IntegrationCard
              provider="google"
              name="Google"
              description="Google Analytics 4, Search Console & Business Profile"
              icon="🔍"
              connected={!!getIntegration('google')}
              accountName={getIntegration('google')?.account_name}
              onConnect={() => handleConnect('google')}
              onDisconnect={() => handleDisconnect('google')}
            />

            <IntegrationCard
              provider="ghl"
              name="GoHighLevel"
              description="Leads, appointments, calls and contact data"
              icon="📊"
              connected={!!getIntegration('ghl')}
              accountName={getIntegration('ghl')?.account_name}
              onConnect={() => handleConnect('ghl')}
              onDisconnect={() => handleDisconnect('ghl')}
            />

            <IntegrationCard
              provider="meta"
              name="Meta Ads"
              description="Facebook & Instagram advertising metrics"
              icon="📱"
              connected={!!getIntegration('meta')}
              accountName={getIntegration('meta')?.account_name}
              onConnect={() => handleConnect('meta')}
              onDisconnect={() => handleDisconnect('meta')}
            />

            <IntegrationCard
              provider="agency-analytics"
              name="Agency Analytics"
              description="SEO rankings, backlinks and site audits"
              icon="📈"
              connected={false}
              onConnect={() => {}}
              onDisconnect={() => {}}
              comingSoon
            />

            <IntegrationCard
              provider="clickup"
              name="ClickUp"
              description="Project management and task tracking"
              icon="✅"
              connected={false}
              onConnect={() => {}}
              onDisconnect={() => {}}
              comingSoon
            />
          </div>
        </div>
      </div>
    </div>
  );
}
