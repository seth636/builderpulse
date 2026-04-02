'use client';

import { useState, useMemo } from 'react';
import ClientCard from './ClientCard';

type ClientData = {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  pm_name: string | null;
  package: string;
  healthScore: number | null;
  alertCount: number;
  connectedServices: { ga4: boolean; gsc: boolean; ghl: boolean; meta: boolean; reviews: boolean };
};

type Tier = 'all' | 'wins' | 'stable' | 'risk';

function getTier(score: number | null): 'wins' | 'stable' | 'risk' | 'unscored' {
  if (score === null) return 'unscored';
  if (score >= 80) return 'wins';
  if (score >= 50) return 'stable';
  return 'risk';
}

function StatPill({
  label,
  count,
  color,
  urgent = false,
}: {
  label: string;
  count: number;
  color: string;
  urgent?: boolean;
}) {
  return (
    <div style={{ textAlign: 'center', minWidth: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '5px' }}>
        {urgent && count > 0 && (
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}80`, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: '26px', fontWeight: '700', color, lineHeight: 1 }}>{count}</span>
      </div>
      <div style={{ fontSize: '10px', color: '#6b6b7e', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', whiteSpace: 'nowrap' }}>
        {label}
      </div>
    </div>
  );
}

const TABS: { key: Tier; label: string; color?: string }[] = [
  { key: 'all', label: 'All Clients' },
  { key: 'wins', label: 'Biggest Wins', color: '#00FFD4' },
  { key: 'stable', label: 'Stable', color: '#926BD9' },
  { key: 'risk', label: 'At Risk', color: '#EF4444' },
];

export default function DashboardClient({ clients }: { clients: ClientData[] }) {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<Tier>('all');
  const [sortBy, setSortBy] = useState<'health' | 'name' | 'alerts'>('health');

  const stats = useMemo(() => {
    const scored = clients.filter(c => c.healthScore !== null);
    const avgHealth =
      scored.length > 0
        ? Math.round(scored.reduce((s, c) => s + (c.healthScore ?? 0), 0) / scored.length)
        : null;
    return {
      total: clients.length,
      avgHealth,
      wins: clients.filter(c => getTier(c.healthScore) === 'wins').length,
      stable: clients.filter(c => getTier(c.healthScore) === 'stable').length,
      risk: clients.filter(c => getTier(c.healthScore) === 'risk').length,
      totalAlerts: clients.reduce((s, c) => s + c.alertCount, 0),
    };
  }, [clients]);

  const tierCounts: Record<Tier, number> = {
    all: clients.length,
    wins: stats.wins,
    stable: stats.stable,
    risk: stats.risk,
  };

  const filtered = useMemo(() => {
    let list = [...clients];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        c => c.name.toLowerCase().includes(q) || (c.website_url || '').toLowerCase().includes(q)
      );
    }
    if (tier !== 'all') {
      list = list.filter(c => getTier(c.healthScore) === tier);
    }
    list.sort((a, b) => {
      if (sortBy === 'health') {
        if (a.healthScore === null && b.healthScore === null) return 0;
        if (a.healthScore === null) return 1;
        if (b.healthScore === null) return -1;
        return b.healthScore - a.healthScore;
      }
      if (sortBy === 'alerts') return b.alertCount - a.alertCount;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [clients, search, tier, sortBy]);

  const avgColor =
    stats.avgHealth === null
      ? '#64748b'
      : stats.avgHealth >= 80
      ? '#00FFD4'
      : stats.avgHealth >= 50
      ? '#926BD9'
      : '#EF4444';

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Portfolio Summary Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(147,107,218,0.07) 0%, rgba(0,0,0,0) 60%)',
        border: '1px solid rgba(147,107,218,0.13)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        {/* Left: Title + subtitle */}
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 5px' }}>
            Portfolio Summary
          </h1>
          <p style={{ fontSize: '13px', color: '#8b8b9e', margin: 0 }}>
            {stats.total} active client{stats.total !== 1 ? 's' : ''}
            {stats.totalAlerts > 0 && (
              <span style={{ color: '#F59E0B', marginLeft: '10px', fontWeight: '600' }}>
                · {stats.totalAlerts} unresolved alert{stats.totalAlerts !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {/* Right: stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          {/* Avg Health Score — big ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '56px', height: '56px', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="rgba(147,107,218,0.12)" strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={avgColor}
                  strokeWidth="3"
                  strokeDasharray={`${stats.avgHealth ?? 0}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontWeight: '700', fontSize: '12px',
              }}>
                {stats.avgHealth ?? '—'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginBottom: '2px' }}>Avg Health</div>
              <div style={{ fontSize: '11px', color: avgColor }}>
                {stats.avgHealth === null ? 'No data' : stats.avgHealth >= 80 ? 'Excellent' : stats.avgHealth >= 50 ? 'Good' : 'Needs Work'}
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '44px', background: 'rgba(255,255,255,0.07)' }} />

          <StatPill label="Biggest Wins" count={stats.wins} color="#00FFD4" />
          <StatPill label="Stable" count={stats.stable} color="#926BD9" />
          <StatPill label="At Risk" count={stats.risk} color="#EF4444" urgent />
          {stats.totalAlerts > 0 && (
            <StatPill label="Alerts" count={stats.totalAlerts} color="#F59E0B" urgent />
          )}
        </div>
      </div>

      {/* ── Controls row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>

        {/* Tier tabs */}
        <div style={{
          display: 'flex', gap: '4px',
          background: 'rgba(255,255,255,0.025)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {TABS.map(tab => {
            const active = tier === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTier(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: active ? '600' : '500',
                  transition: 'all 0.15s ease',
                  background: active
                    ? (tab.color ? `${tab.color}18` : 'rgba(255,255,255,0.08)')
                    : 'transparent',
                  color: active ? (tab.color || '#FFFFFF') : '#8b8b9e',
                  outline: 'none',
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: '11px', fontWeight: '700',
                  background: active
                    ? (tab.color ? `${tab.color}22` : 'rgba(255,255,255,0.1)')
                    : 'rgba(255,255,255,0.05)',
                  color: active ? (tab.color || '#FFFFFF') : '#6b6b7e',
                  padding: '1px 8px', borderRadius: '999px',
                  minWidth: '22px', textAlign: 'center',
                }}>
                  {tierCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'health' | 'name' | 'alerts')}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '8px', color: '#c4c4d4',
              fontSize: '13px', padding: '8px 12px', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="health">Sort: Health Score</option>
            <option value="name">Sort: Name</option>
            <option value="alerts">Sort: Alerts</option>
          </select>

          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b6b7e', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '8px', color: '#FFFFFF',
                fontSize: '13px', padding: '8px 12px 8px 34px',
                width: '220px', outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Client Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '14px',
      }}>
        {filtered.map(client => (
          <ClientCard
            key={client.id}
            name={client.name}
            slug={client.slug}
            website_url={client.website_url}
            pm_name={client.pm_name}
            package={client.package}
            healthScore={client.healthScore}
            alertCount={client.alertCount}
            connectedServices={client.connectedServices}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#6b6b7e' }}>
          <p style={{ fontSize: '16px', fontWeight: '500', color: '#8b8b9e', marginBottom: '6px' }}>
            {search ? `No clients matching "${search}"` : 'No clients in this tier'}
          </p>
          <p style={{ fontSize: '13px' }}>Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}
