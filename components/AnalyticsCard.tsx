'use client';

import { useEffect, useState } from 'react';

interface AnalyticsCardProps {
  clientSlug: string;
  hasGA4: boolean;
}

export default function AnalyticsCard({ clientSlug, hasGA4 }: AnalyticsCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!hasGA4) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/analytics/${clientSlug}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientSlug, hasGA4]);

  if (!hasGA4) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
        <p className="text-muted text-sm mb-4">GA4 traffic and user metrics</p>
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <p className="text-muted text-sm">
            Not connected — add GA4 Property ID in Settings
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
        <p className="text-muted text-sm mb-4">GA4 traffic and user metrics</p>
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || data.daily.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Analytics</h3>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
            Connected
          </span>
        </div>
        <p className="text-muted text-sm mb-4">GA4 traffic and user metrics</p>
        <div className="bg-background/50 rounded-lg p-4 text-center">
          <p className="text-muted text-sm">
            Connected — No data yet. Click Sync in Settings.
          </p>
        </div>
      </div>
    );
  }

  const latestDate = data.daily[data.daily.length - 1]?.date || 'N/A';

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">Analytics</h3>
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
          Connected
        </span>
      </div>
      <p className="text-muted text-sm mb-4">
        Last synced: {new Date(latestDate).toLocaleDateString()}
      </p>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted text-sm">Sessions (30d)</span>
          <span className="text-white font-medium">
            {data.summary.totalSessions.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted text-sm">Users (30d)</span>
          <span className="text-white font-medium">
            {data.summary.totalUsers.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted text-sm">Bounce Rate</span>
          <span className="text-white font-medium">
            {(data.summary.avgBounceRate * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted text-sm">Conversions</span>
          <span className="text-white font-medium">
            {data.summary.totalConversions}
          </span>
        </div>
      </div>
    </div>
  );
}
