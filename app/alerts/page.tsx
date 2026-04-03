'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

// SVG icon components
const IconTrafficDrop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="17" y1="7" x2="7" y2="17" />
    <polyline points="17 17 7 17 7 7" />
  </svg>
);

const IconTrafficSpike = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const IconRankingDrop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconLeadDrought = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const IconNegativeReview = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

const IconSiteHealth = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconAdPerformance = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TYPE_ICONS: Record<string, React.ReactNode> = {
  traffic_drop: <IconTrafficDrop />,
  traffic_spike: <IconTrafficSpike />,
  ranking_drop: <IconRankingDrop />,
  lead_drought: <IconLeadDrought />,
  negative_review: <IconNegativeReview />,
  site_health_drop: <IconSiteHealth />,
  ad_performance: <IconAdPerformance />,
};

const SEVERITY_STYLES: Record<string, React.CSSProperties> = {
  critical: { backgroundColor: '#EF4444', color: '#fff' },
  warning: { backgroundColor: '#F59E0B', color: '#000' },
  info: { backgroundColor: '#926BD9', color: '#fff' },
};

const filterSelectStyle: React.CSSProperties = {
  background: 'rgba(147,107,218,0.08)',
  border: '1px solid rgba(147,107,218,0.15)',
  color: 'var(--text-primary)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  cursor: 'pointer',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSeverity !== 'all') params.set('severity', filterSeverity);
      if (filterClient !== 'all') params.set('clientId', filterClient);
      if (filterStatus === 'active') params.set('isResolved', 'false');
      else if (filterStatus === 'resolved') params.set('isResolved', 'true');
      else if (filterStatus === 'unread') { params.set('isRead', 'false'); params.set('isResolved', 'false'); }

      const res = await fetch(`/api/alerts?${params.toString()}`);
      if (!res.ok) {
        setAlerts([]);
        setLoading(false);
        return;
      }
      const d = await res.json();
      setAlerts(Array.isArray(d?.alerts) ? d.alerts : []);
    } catch { setAlerts([]); }
    setLoading(false);
  }, [filterSeverity, filterClient, filterStatus]);

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.ok ? r.json() : { clients: [] })
      .then(d => setClients(Array.isArray(d?.clients) ? d.clients : (Array.isArray(d) ? d : [])))
      .catch(() => setClients([]));
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markRead = async (id: number | undefined) => {
    if (id == null) return;
    try {
      await fetch(`/api/alerts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) });
      setAlerts(prev => (prev || []).map(a => a?.id === id ? { ...a, is_read: true } : a));
    } catch { /* ignore */ }
  };

  const resolve = async (id: number | undefined) => {
    if (id == null) return;
    try {
      await fetch(`/api/alerts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isResolved: true, isRead: true }) });
      setAlerts(prev => (prev || []).filter(a => a?.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Sidebar />
      <div className="flex-1 ml-60" style={{ backgroundColor: 'var(--bg-page)' }}>
        <TopBar title="Alerts" />
        <div className="p-8">
          {/* Filter bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">All Clients</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="active">Active</option>
              <option value="unread">Unread</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <div style={{
              background: 'rgba(13,17,23,0.95)',
              border: '1px solid rgba(147,107,218,0.15)',
              borderRadius: 12,
              padding: 48,
              textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No alerts. The system monitors all clients automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(alerts || []).map((alert: any) => {
                if (!alert) return null;
                const severity = alert?.severity ?? 'warning';
                const alertType = alert?.alert_type ?? 'unknown';
                const isUnread = !alert?.is_read;
                return (
                  <div
                    key={alert?.id ?? Math.random()}
                    style={{
                      background: 'rgba(13,17,23,0.95)',
                      border: isUnread ? '1px solid rgba(147,107,218,0.3)' : '1px solid rgba(147,107,218,0.15)',
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: isUnread ? '0 0 12px rgba(147,107,218,0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            {TYPE_ICONS[alertType] || <IconAlertTriangle />}
                          </span>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 999,
                            ...(SEVERITY_STYLES[severity] || { backgroundColor: '#926BD9', color: '#fff' }),
                          }}>
                            {severity.toUpperCase()}
                          </span>
                          {alert?.client && (
                            <Link href={`/client/${alert.client?.slug ?? ''}`} style={{ fontSize: 12, color: '#00FFD4', textDecoration: 'none' }}>
                              {alert.client?.name ?? 'Client'}
                            </Link>
                          )}
                          {isUnread && (
                            <span style={{ fontSize: 11, backgroundColor: 'rgba(147,107,218,0.15)', color: '#926BD9', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>NEW</span>
                          )}
                        </div>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: '0 0 4px 0' }}>{alert?.title ?? 'Alert'}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{alert?.description ?? ''}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                          {alert?.created_at ? new Date(alert.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {isUnread && (
                          <button
                            onClick={() => markRead(alert?.id)}
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              background: 'transparent',
                              border: '1px solid rgba(147,107,218,0.2)',
                              borderRadius: 6,
                              padding: '5px 10px',
                              cursor: 'pointer',
                              transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            Mark Read
                          </button>
                        )}
                        {!alert?.is_resolved && (
                          <button
                            onClick={() => resolve(alert?.id)}
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              background: 'transparent',
                              border: '1px solid rgba(147,107,218,0.2)',
                              borderRadius: 6,
                              padding: '5px 10px',
                              cursor: 'pointer',
                              transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
