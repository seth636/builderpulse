'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Ranking {
  id: number;
  keyword: string;
  position: number;
  previousPosition: number | null;
  bestPosition: number;
  date: string;
}

type SortKey = 'keyword' | 'position' | 'previousPosition' | 'change' | 'bestPosition' | 'date';
type Filter = 'all' | 'top10' | 'top20' | 'improved' | 'declined';

function positionBadge(pos: number) {
  if (pos === 0) return <span className="text-slate-500">—</span>;
  const color = pos <= 3 ? 'text-green-400' : pos <= 10 ? 'text-blue-400' : pos <= 20 ? 'text-yellow-400' : 'text-slate-400';
  return <span className={color}>{pos}</span>;
}

function changeBadge(current: number, previous: number | null) {
  if (!previous || previous === 0 || current === 0) return <span className="text-slate-500">—</span>;
  const diff = previous - current; // positive = improved (rank number went down)
  if (Math.abs(diff) < 0.5) return <span className="text-slate-500">—</span>;
  if (diff > 0) return <span className="text-green-400 font-medium">↑ {Math.abs(diff)}</span>;
  return <span className="text-red-400 font-medium">↓ {Math.abs(diff)}</span>;
}

export default function KeywordsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [clientName, setClientName] = useState('');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('position');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addKeywords, setAddKeywords] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [clientRes, rankRes] = await Promise.all([
        fetch('/api/clients'),
        fetch(`/api/seo/${slug}/keywords`),
      ]);
      const clients = await clientRes.json();
      const found = clients.find((c: any) => c.slug === slug);
      if (found) setClientName(found.name);

      const rankData = await rankRes.json();
      setRankings(rankData.rankings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchHistory = async (keyword: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/seo/${slug}/keywords?keyword=${encodeURIComponent(keyword)}&days=90`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRowClick = (keyword: string) => {
    if (expandedRow === keyword) {
      setExpandedRow(null);
      setHistory([]);
    } else {
      setExpandedRow(keyword);
      fetchHistory(keyword);
    }
  };

  const handleAddKeywords = async () => {
    const words = addKeywords.split('\n').map(k => k.trim()).filter(Boolean);
    if (!words.length) return;
    setAddLoading(true);
    try {
      await fetch(`/api/seo/${slug}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: words }),
      });
      setShowAddModal(false);
      setAddKeywords('');
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setAddLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = rankings.filter(r => {
    if (filter === 'top10') return r.position > 0 && r.position <= 10;
    if (filter === 'top20') return r.position > 0 && r.position <= 20;
    if (filter === 'improved') return r.previousPosition !== null && r.position > 0 && r.previousPosition > r.position;
    if (filter === 'declined') return r.previousPosition !== null && r.position > 0 && r.previousPosition < r.position;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: any = a[sortKey === 'change' ? 'position' : sortKey];
    let bVal: any = b[sortKey === 'change' ? 'position' : sortKey];
    if (sortKey === 'change') {
      aVal = a.previousPosition !== null ? a.previousPosition - a.position : 0;
      bVal = b.previousPosition !== null ? b.previousPosition - b.position : 0;
    }
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const chartData = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    position: h.position,
  }));

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen">
        <ClientSidebar clientName={clientName || slug} clientSlug={slug} />
        <div className="flex-1 ml-60">
          <TopBar title="Keywords" />
          <div className="p-8 text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ClientSidebar clientName={clientName || slug} clientSlug={slug} />
      <div className="flex-1 ml-60">
        <TopBar title={`${clientName} — Keywords`} />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Rank Tracker</h2>
              <p className="text-muted text-sm mt-1">GSC-powered keyword position tracking</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
            >
              + Add Keywords
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 mb-4">
            {(['all', 'top10', 'top20', 'improved', 'declined'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
              >
                {f === 'all' ? 'All' : f === 'top10' ? 'Top 10' : f === 'top20' ? 'Top 20' : f === 'improved' ? 'Improved' : 'Declined'}
              </button>
            ))}
            <span className="ml-auto text-muted text-xs self-center">{filtered.length} keywords</span>
          </div>

          {rankings.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2">No keyword rankings yet</h3>
              <p className="text-muted text-sm">Connect Google Search Console in settings to start tracking rankings automatically.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background/50 border-b border-border">
                  <tr>
                    {[
                      ['keyword', 'Keyword'],
                      ['position', 'Position'],
                      ['previousPosition', 'Previous'],
                      ['change', 'Change'],
                      ['bestPosition', 'Best'],
                      ['date', 'Last Checked'],
                    ].map(([key, label]) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key as SortKey)}
                        className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:text-white select-none"
                      >
                        {label}{sortIcon(key as SortKey)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map((r) => (
                    <>
                      <tr
                        key={r.id}
                        onClick={() => handleRowClick(r.keyword)}
                        className="hover:bg-background/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-white max-w-xs truncate">
                          <span className="flex items-center gap-1">
                            <span className="text-white/30 text-xs">{expandedRow === r.keyword ? '▲' : '▶'}</span>
                            {r.keyword}
                          </span>
                        </td>
                        <td className="px-4 py-3">{positionBadge(r.position)}</td>
                        <td className="px-4 py-3 text-muted">{r.previousPosition ? r.previousPosition : '—'}</td>
                        <td className="px-4 py-3">{changeBadge(r.position, r.previousPosition)}</td>
                        <td className="px-4 py-3 text-muted">{r.bestPosition || '—'}</td>
                        <td className="px-4 py-3 text-muted text-xs">
                          {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                      {expandedRow === r.keyword && (
                        <tr key={`${r.id}-expanded`}>
                          <td colSpan={6} className="px-6 py-4 bg-background/30">
                            {historyLoading ? (
                              <div className="h-40 flex items-center justify-center text-muted text-sm">Loading history...</div>
                            ) : chartData.length < 2 ? (
                              <div className="h-20 flex items-center justify-center text-muted text-sm">Not enough history to chart yet.</div>
                            ) : (
                              <div>
                                <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">90-Day Position History (lower = better)</p>
                                <ResponsiveContainer width="100%" height={160}>
                                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                    <YAxis reversed tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                    <Tooltip
                                      contentStyle={{ backgroundColor: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                                      labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                                      itemStyle={{ color: '#6366f1', fontSize: 11 }}
                                      formatter={(val: any) => [`Position ${val}`, '']}
                                    />
                                    <Line type="monotone" dataKey="position" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Keywords Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add Keywords</h3>
            <p className="text-muted text-sm mb-4">Enter one keyword per line. Rankings will populate automatically from Google Search Console.</p>
            <textarea
              value={addKeywords}
              onChange={e => setAddKeywords(e.target.value)}
              placeholder="custom home builders arizona&#10;luxury home builder phoenix&#10;home builder near me"
              rows={8}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none text-sm font-mono"
            />
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddKeywords}
                disabled={addLoading || !addKeywords.trim()}
                className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {addLoading ? 'Adding...' : 'Add Keywords'}
              </button>
              <button
                onClick={() => { setShowAddModal(false); setAddKeywords(''); }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
