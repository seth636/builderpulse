'use client';

import { useEffect, useState } from 'react';

interface SearchConsoleCardProps {
  clientSlug: string;
  hasGSC: boolean;
}

export default function SearchConsoleCard({ clientSlug, hasGSC }: SearchConsoleCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!hasGSC) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/search-console/${clientSlug}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch search console data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientSlug, hasGSC]);

  if (!hasGSC) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">SEO / Search Console</h3>
        <p className="text-muted text-sm mb-4">Search performance metrics</p>
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <p className="text-muted text-sm">
            Not connected — add GSC Site URL in Settings
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">SEO / Search Console</h3>
        <p className="text-muted text-sm mb-4">Search performance metrics</p>
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || data.queries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">SEO / Search Console</h3>
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
            Connected
          </span>
        </div>
        <p className="text-muted text-sm mb-4">Search performance metrics</p>
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <p className="text-muted text-sm">
            Connected — No data yet. Click Sync in Settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">SEO / Search Console</h3>
        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
          Connected
        </span>
      </div>
      <p className="text-muted text-sm mb-4">Last 30 days</p>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted text-sm">Total Clicks</span>
          <span className="text-white font-medium">
            {data.summary.totalClicks.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted text-sm">Impressions</span>
          <span className="text-white font-medium">
            {data.summary.totalImpressions.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted text-sm">Avg CTR</span>
          <span className="text-white font-medium">
            {(data.summary.avgCtr * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted text-sm">Avg Position</span>
          <span className="text-white font-medium">
            {data.summary.avgPosition.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
