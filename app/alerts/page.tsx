'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-800 text-red-200',
  warning: 'bg-amber-800 text-amber-200',
  info: 'bg-blue-800 text-blue-200',
};

const TYPE_ICONS: Record<string, string> = {
  traffic_drop: '📉',
  traffic_spike: '📈',
  ranking_drop: '🔻',
  lead_drought: '🌵',
  negative_review: '⭐',
  site_health_drop: '🏥',
  ad_performance: '📢',
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
      const d = await res.json();
      setAlerts(d.alerts || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filterSeverity, filterClient, filterStatus]);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.clients || d || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markRead = async (id: number) => {
    await fetch(`/api/alerts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const resolve = async (id: number) => {
    await fetch(`/api/alerts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isResolved: true, isRead: true }) });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-60">
        <TopBar title="Alerts" />
        <div className="p-8">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="all">All Clients</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="unread">Unread</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-12 text-center">
              <p className="text-gray-400">No alerts. The system monitors all clients automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div key={alert.id} className={`border rounded-xl p-5 ${!alert.is_read ? 'bg-gray-800/80 border-gray-600' : 'bg-gray-900/50 border-gray-700'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span>{TYPE_ICONS[alert.alert_type] || '⚠️'}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${SEVERITY_COLORS[alert.severity] || 'bg-gray-700 text-gray-300'}`}>
                          {alert.severity?.toUpperCase()}
                        </span>
                        {alert.client && (
                          <Link href={`/client/${alert.client.slug}`} className="text-xs text-teal-400 hover:underline">
                            {alert.client.name}
                          </Link>
                        )}
                        {!alert.is_read && (
                          <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">NEW</span>
                        )}
                      </div>
                      <p className="text-white font-semibold text-sm mb-1">{alert.title}</p>
                      <p className="text-gray-400 text-xs">{alert.description}</p>
                      <p className="text-gray-600 text-xs mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!alert.is_read && (
                        <button onClick={() => markRead(alert.id)} className="text-xs text-gray-400 hover:text-white border border-gray-600 px-2 py-1 rounded transition-colors">
                          Mark Read
                        </button>
                      )}
                      {!alert.is_resolved && (
                        <button onClick={() => resolve(alert.id)} className="text-xs text-gray-400 hover:text-white border border-gray-600 px-2 py-1 rounded transition-colors">
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
