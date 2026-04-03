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

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function GA4Icon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="12" width="5" height="10" rx="1" fill="#F9AB00" />
      <rect x="9.5" y="6" width="5" height="16" rx="1" fill="#E37400" />
      <circle cx="19.5" cy="4" r="3" fill="#E37400" />
    </svg>
  );
}

function GSCIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="11" r="7" stroke="#4285F4" strokeWidth="2" fill="none" />
      <path d="M16.5 16.5L21 21" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 11h6M12 8v6" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GBPIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#34A853" />
      <circle cx="12" cy="9" r="2.5" fill="white" />
    </svg>
  );
}

function GHLIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#F8B600" />
      <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ClickUpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 12l4.5 4.5L12 9l4.5 4.5L21 6" stroke="#7B68EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 17l4.5-4.5" stroke="#00C4B4" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M21 11l-4.5 4.5" stroke="#00C4B4" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.5 12.5C2.5 8.5 5 5 8 5c1.8 0 3.2 1.2 4 3 .8-1.8 2.2-3 4-3 3 0 5.5 3.5 5.5 7.5 0 2.5-1 4.5-2.5 5.5-.8.5-1.5.5-2 0-1-.8-2-3-2-5.5 0 2.5-1 4.7-2 5.5-.5.5-1.2.5-2 0C4.5 17 2.5 15 2.5 12.5z"
        fill="#0866FF"
      />
    </svg>
  );
}

// ── Card Component ─────────────────────────────────────────────────────────────

interface IntegrationCardProps {
  provider: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  connected: boolean;
  accountName?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  note?: string;
  isConnecting?: boolean;
}

function IntegrationCard({
  name,
  description,
  icon,
  accentColor,
  connected,
  accountName,
  onConnect,
  onDisconnect,
  note,
  isConnecting = false,
}: IntegrationCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDisconnect = () => {
    setShowConfirm(false);
    onDisconnect();
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
      transition: 'box-shadow 0.2s ease',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      minHeight: '160px',
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
        {/* Icon container with brand accent */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '4px',
          }}>
            {name}
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: '1.5',
          }}>
            {description}
          </p>
        </div>
      </div>

      {note && (
        <div style={{
          marginBottom: '16px',
          padding: '8px 12px',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#166534',
          lineHeight: '1.5',
        }}>
          {note}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: connected ? '#10B981' : '#D1D5DB',
          }} />
          <span style={{
            fontSize: '13px',
            color: connected ? '#059669' : 'var(--text-muted)',
            fontWeight: '500',
          }}>
            {connected ? 'Connected' : 'Not connected'}
          </span>
          {connected && accountName && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '2px' }}>
              · {accountName}
            </span>
          )}
        </div>

        {!showConfirm ? (
          <button
            onClick={connected ? () => setShowConfirm(true) : onConnect}
            disabled={isConnecting}
            style={{
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '6px',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              opacity: isConnecting ? 0.7 : 1,
              ...(connected ? {
                color: '#EF4444',
                background: 'transparent',
                border: '1px solid #FECACA',
              } : {
                color: '#FFFFFF',
                background: accentColor,
                border: 'none',
              }),
            }}
            onMouseEnter={e => {
              if (connected) {
                e.currentTarget.style.background = '#FEF2F2';
              } else {
                e.currentTarget.style.opacity = '0.88';
              }
            }}
            onMouseLeave={e => {
              if (connected) {
                e.currentTarget.style.background = 'transparent';
              } else {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {isConnecting ? 'Connecting...' : connected ? 'Disconnect' : 'Connect'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDisconnect}
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#FFFFFF',
                background: '#EF4444',
                border: 'none',
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                background: 'var(--bg-page)',
                border: '1px solid var(--border)',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Google group banner ────────────────────────────────────────────────────────

function GoogleGroupBanner({ connected, onConnect }: { connected: boolean; onConnect: () => void }) {
  if (connected) return null;
  return (
    <div style={{
      gridColumn: '1 / -1',
      padding: '14px 18px',
      background: 'var(--bg-card-subtle)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    }}>
      <div>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Connect all three Google services at once
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
          One Google sign-in grants access to Analytics 4, Search Console, and Business Profile simultaneously.
        </p>
      </div>
      <button
        onClick={onConnect}
        style={{
          padding: '8px 18px',
          fontSize: '13px',
          fontWeight: '600',
          borderRadius: '6px',
          cursor: 'pointer',
          color: '#FFFFFF',
          background: '#4285F4',
          border: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#3367D6')}
        onMouseLeave={e => (e.currentTarget.style.background = '#4285F4')}
      >
        Connect Google Account
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [client, setClient] = useState<{ name: string; slug: string } | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      const providerNames: { [key: string]: string } = {
        google: 'Google',
        ghl: 'GoHighLevel',
        meta: 'Meta Ads',
        clickup: 'ClickUp',
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
      const clientRes = await fetch(`/api/clients/${slug}`);
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      }

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
    setConnectingProvider(provider);
    if (provider === 'clickup') {
      // ClickUp uses a different OAuth initiation URL format
      window.location.href = `/api/auth/clickup/initiate?client_slug=${slug}`;
    } else {
      window.location.href = `/api/auth/${provider}/initiate?client_slug=${slug}`;
    }
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

  const getIntegration = (provider: string): Integration | undefined =>
    integrations.find(i => i.provider === provider);

  const googleConnected = !!getIntegration('google');

  if (loading || !client) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
        <ClientSidebar clientName={client?.name || 'Loading...'} clientSlug={slug} />
        <div className="flex-1 ml-60" style={{ backgroundColor: 'var(--bg-page)' }}>
          <TopBar title="Integrations & Connections" />
          <div className="p-8">
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <ClientSidebar clientName={client.name} clientSlug={client.slug} />
      <div className="flex-1 ml-60" style={{ backgroundColor: 'var(--bg-page)' }}>
        <TopBar title="Integrations & Connections" />
        <div className="p-8">

          {/* Success / Error banners */}
          {successMessage && (
            <div style={{
              marginBottom: '24px',
              padding: '12px 16px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              color: '#166534',
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
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              {errorMessage}
            </div>
          )}

          {/* Page header */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, marginBottom: '6px' }}>
              Connect Your Services
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Authorize BuilderPulse to pull data from your marketing and analytics platforms.
            </p>
          </div>

          {/* ── Google section ── */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              margin: '0 0 12px 2px',
            }}>
              Google
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '16px',
              alignItems: 'stretch',
            }}>
              <GoogleGroupBanner
                connected={googleConnected}
                onConnect={() => handleConnect('google')}
              />

              <IntegrationCard
                provider="google"
                name="Google Analytics 4"
                description="Website traffic, sessions, conversions, and funnel data"
                icon={<GA4Icon />}
                accentColor="#F9AB00"
                connected={googleConnected}
                accountName={getIntegration('google')?.account_name}
                onConnect={() => handleConnect('google')}
                onDisconnect={() => handleDisconnect('google')}
                note={googleConnected ? undefined : 'Connect your Google account above to enable.'}
                isConnecting={connectingProvider === 'google'}
              />

              <IntegrationCard
                provider="google"
                name="Google Search Console"
                description="Search rankings, impressions, clicks, and keyword data"
                icon={<GSCIcon />}
                accentColor="#4285F4"
                connected={googleConnected}
                accountName={getIntegration('google')?.account_name}
                onConnect={() => handleConnect('google')}
                onDisconnect={() => handleDisconnect('google')}
                note={googleConnected ? undefined : 'Connect your Google account above to enable.'}
                isConnecting={connectingProvider === 'google'}
              />

              <IntegrationCard
                provider="google"
                name="Google Business Profile"
                description="Reviews, calls, direction requests, and local visibility"
                icon={<GBPIcon />}
                accentColor="#34A853"
                connected={googleConnected}
                accountName={getIntegration('google')?.account_name}
                onConnect={() => handleConnect('google')}
                onDisconnect={() => handleDisconnect('google')}
                note={googleConnected ? undefined : 'Connect your Google account above to enable.'}
                isConnecting={connectingProvider === 'google'}
              />
            </div>
          </div>

          {/* ── Other services ── */}
          <div style={{ marginTop: '32px' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              margin: '0 0 12px 2px',
            }}>
              Advertising & CRM
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
              alignItems: 'stretch',
            }}>
              <IntegrationCard
                provider="ghl"
                name="GoHighLevel"
                description="Leads, appointments, calls, and contact pipeline data"
                icon={<GHLIcon />}
                accentColor="#F8B600"
                connected={!!getIntegration('ghl')}
                accountName={getIntegration('ghl')?.account_name}
                onConnect={() => handleConnect('ghl')}
                onDisconnect={() => handleDisconnect('ghl')}
                isConnecting={connectingProvider === 'ghl'}
              />

              <IntegrationCard
                provider="meta"
                name="Meta Ads"
                description="Facebook and Instagram advertising metrics and spend"
                icon={<MetaIcon />}
                accentColor="#0866FF"
                connected={!!getIntegration('meta')}
                accountName={getIntegration('meta')?.account_name}
                onConnect={() => handleConnect('meta')}
                onDisconnect={() => handleDisconnect('meta')}
                isConnecting={connectingProvider === 'meta'}
              />
            </div>
          </div>

          {/* ── Project Management ── */}
          <div style={{ marginTop: '32px' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              margin: '0 0 12px 2px',
            }}>
              Project Management
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
              alignItems: 'stretch',
            }}>
              <IntegrationCard
                provider="clickup"
                name="ClickUp"
                description="Task completion, project progress, and weekly delivery metrics per client"
                icon={<ClickUpIcon />}
                accentColor="#7B68EE"
                connected={!!getIntegration('clickup')}
                accountName={getIntegration('clickup')?.account_name}
                onConnect={() => handleConnect('clickup')}
                onDisconnect={() => handleDisconnect('clickup')}
                isConnecting={connectingProvider === 'clickup'}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
