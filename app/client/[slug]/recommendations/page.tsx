'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-900/20 border-red-700 text-red-400',
  medium: 'bg-amber-900/20 border-amber-700 text-amber-400',
  low: 'bg-green-900/20 border-green-700 text-green-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  seo: 'bg-blue-900/30 text-blue-300',
  ads: 'bg-purple-900/30 text-purple-300',
  content: 'bg-teal-900/30 text-teal-300',
  crm: 'bg-orange-900/30 text-orange-300',
  reputation: 'bg-yellow-900/30 text-yellow-300',
  website: 'bg-pink-900/30 text-pink-300',
};

export default function RecommendationsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [clientName, setClientName] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  // Initialize empty - hydration-safe. Loaded in useEffect.
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());

  // Load localStorage doneSet after mount (hydration-safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`recs-done-${slug}`);
      if (saved) setDoneSet(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, [slug]);

  useEffect(() => {
    // Fetch client name
    fetch(`/api/clients`)
      .then(r => r.ok ? r.json() : { clients: [] })
      .then((d: any) => {
        const c = (d.clients || d || []).find((cl: any) => cl.slug === slug);
        if (c) setClientName(c.name);
      }).catch(() => {});

    fetch(`/api/clients/${slug}/recommendations?month=${currentMonth}`)
      .then(r => r.ok ? r.json() : { recommendations: [] })
      .then(d => { setRecommendations(d.recommendations || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug, currentMonth]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/clients/${slug}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth }),
      });
      const d = await res.json();
      setRecommendations(d.recommendations || []);
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const toggleDone = (index: number) => {
    setDoneSet(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      localStorage.setItem(`recs-done-${slug}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const byPriority = (p: string) => recommendations.filter(r => r.priority === p);

  return (
    <div className="flex min-h-screen">
      <ClientSidebar clientName={clientName || slug} clientSlug={slug} />
      <div className="flex-1 ml-60">
        <TopBar title="AI Recommendations" />
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">AI Recommendations</h1>
              <p className="text-gray-400 text-sm">Month: {currentMonth}</p>
            </div>
            <button onClick={handleGenerate} disabled={generating} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {generating ? 'Generating...' : recommendations.length > 0 ? 'Regenerate' : 'Generate Recommendations'}
            </button>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : recommendations.length === 0 ? (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-12 text-center">
              <p className="text-gray-400 mb-4">No recommendations yet. Generate recommendations to get specific action items.</p>
              <button onClick={handleGenerate} disabled={generating} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                {generating ? 'Generating...' : 'Generate Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {(['high', 'medium', 'low'] as const).map(priority => {
                const recs = byPriority(priority);
                if (recs.length === 0) return null;
                return (
                  <div key={priority}>
                    <h2 className="text-lg font-bold text-white mb-3 capitalize">{priority} Priority</h2>
                    <div className="space-y-3">
                      {recs.map((rec: any, idx: number) => {
                        const globalIdx = recommendations.indexOf(rec);
                        const done = doneSet.has(globalIdx);
                        return (
                          <div key={idx} className={`border rounded-xl p-5 transition-opacity ${done ? 'opacity-50' : ''} ${PRIORITY_COLORS[rec.priority] || 'bg-gray-900 border-gray-700'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${PRIORITY_COLORS[rec.priority] || ''}`}>{rec.priority}</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${CATEGORY_COLORS[rec.category] || 'bg-gray-800 text-gray-300'}`}>{rec.category}</span>
                                  <span className="font-semibold text-white text-sm">{rec.title}</span>
                                </div>
                                <p className="text-gray-300 text-sm mb-2">{rec.body}</p>
                                <p className="text-gray-500 text-xs italic">Data: {rec.metricReference}</p>
                              </div>
                              <div className="flex-shrink-0">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={done}
                                    onChange={() => toggleDone(globalIdx)}
                                    className="w-4 h-4 accent-teal-500"
                                  />
                                  <span className="text-xs text-gray-400">Done</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
