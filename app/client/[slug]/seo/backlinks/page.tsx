'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Backlink {
  id: number;
  source_url: string;
  target_url: string;
  anchor_text: string | null;
  first_seen: string;
  last_checked: string;
  status: string;
}

interface BacklinkSummary {
  total: number;
  referringDomains: number;
  newThisMonth: number;
  lostThisMonth: number;
}

function getDomain(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

function getMonthlyData(backlinks: Backlink[]) {
  const map = new Map<string, Set<string>>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    map.set(key, new Set());
  }

  for (const b of backlinks) {
    const d = new Date(b.first_seen);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (map.has(key)) {
      const domain = getDomain(b.source_url);
      map.get(key)!.add(domain);
    }
  }

  return [...map.entries()].map(([month, domains]) => ({ month, domains: domains.size }));
}

export default function BacklinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [clientName, setClientName] = useState('');
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [summary, setSummary] = useState<BacklinkSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [clientRes, blRes] = await Promise.all([
        fetch('/api/clients'),
        fetch(`/api/seo/${slug}/backlinks`),
      ]);
      const clients = await clientRes.json();
      const found = clients.find((c: any) => c.slug === slug);
      if (found) setClientName(found.name);

      const data = await blRes.json();
      setBacklinks(data.backlinks || []);
      setSummary(data.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthlyData = getMonthlyData(backlinks);

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen">
        <ClientSidebar clientName={clientName || slug} clientSlug={slug} />
        <div className="flex-1 ml-60">
          <TopBar title="Backlinks" />
          <div className="p-8 text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ClientSidebar clientName={clientName || slug} clientSlug={slug} />
      <div className="flex-1 ml-60">
        <TopBar title={`${clientName} — Backlinks`} />
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Backlink Monitor</h2>
            <p className="text-muted text-sm mt-1">Synced from Google Search Console</p>
          </div>

          {backlinks.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-16 text-center">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-lg font-semibold text-white mb-2">No backlink data yet</h3>
              <p className="text-muted text-sm">Backlinks are synced from Google Search Console. Ensure GSC is connected in Settings.</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Backlinks', value: summary?.total ?? backlinks.length, color: 'text-white' },
                  { label: 'Referring Domains', value: summary?.referringDomains ?? '—', color: 'text-accent' },
                  { label: 'New This Month', value: summary?.newThisMonth ?? 0, color: 'text-green-400' },
                  { label: 'Lost This Month', value: summary?.lostThisMonth ?? 0, color: 'text-red-400' },
                ].map(card => (
                  <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-muted text-xs mb-1">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Monthly chart */}
              <div className="bp-card mb-6">
                <h3 className="text-white font-semibold mb-4">Referring Domains by Month</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                      itemStyle={{ color: '#6366f1', fontSize: 11 }}
                    />
                    <Bar dataKey="domains" name="Referring Domains" radius={[4, 4, 0, 0]}>
                      {monthlyData.map((_, i) => (
                        <Cell key={i} fill="#6366f1" fillOpacity={0.7 + (i / monthlyData.length) * 0.3} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Backlinks table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-white font-semibold">All Backlinks</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Source Domain</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Target URL</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">First Seen</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Last Seen</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {backlinks.map(b => (
                        <tr key={b.id} className="hover:bg-background/50">
                          <td className="px-4 py-3 text-white font-medium">
                            <a href={b.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                              {getDomain(b.source_url)}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-muted text-xs font-mono truncate max-w-[200px]">
                            <a href={b.target_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                              {b.target_url}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-muted text-xs">
                            {new Date(b.first_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-muted text-xs">
                            {new Date(b.last_checked).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${b.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
