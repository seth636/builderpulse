'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';

interface AuditIssue {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  url: string;
  howToFix: string;
}

interface AuditResult {
  healthScore: number;
  issuesCount: number;
  issues: AuditIssue[];
}

interface AuditHistory {
  id: number;
  date: string;
  overall_score: number;
  errors_count: number;
  warnings_count: number;
  notices_count: number;
  pages_crawled: number;
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-xs text-muted">/100</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color }}>
        {score >= 80 ? 'Good' : score >= 50 ? 'Needs Work' : 'Critical'}
      </p>
    </div>
  );
}

function IssueBadge({ severity }: { severity: 'critical' | 'warning' | 'info' }) {
  const styles = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${styles[severity]}`}>
      {severity.toUpperCase()}
    </span>
  );
}

export default function SiteAuditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [clientName, setClientName] = useState('');
  const [running, setRunning] = useState(false);
  const [currentAudit, setCurrentAudit] = useState<AuditResult | null>(null);
  const [history, setHistory] = useState<AuditHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchHistory = useCallback(async () => {
    if (!slug) return;
    setHistoryLoading(true);
    try {
      const [clientRes, auditRes] = await Promise.all([
        fetch('/api/clients'),
        fetch(`/api/seo/${slug}/audits`),
      ]);
      const clients = await clientRes.json();
      const found = clients.find((c: any) => c.slug === slug);
      if (found) setClientName(found.name);

      const data = await auditRes.json();
      setHistory(data.audits || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleRunAudit = async () => {
    setRunning(true);
    setCurrentAudit(null);
    try {
      const res = await fetch(`/api/seo/${slug}/audit`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCurrentAudit(data);
        fetchHistory();
      } else {
        const err = await res.json();
        alert('Audit failed: ' + (err.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Audit failed. Check that website URL is configured in client settings.');
    } finally {
      setRunning(false);
    }
  };

  const filteredIssues = (currentAudit?.issues || []).filter(i =>
    filterSeverity === 'all' || i.severity === filterSeverity
  );

  const criticalCount = (currentAudit?.issues || []).filter(i => i.severity === 'critical').length;
  const warningCount = (currentAudit?.issues || []).filter(i => i.severity === 'warning').length;
  const infoCount = (currentAudit?.issues || []).filter(i => i.severity === 'info').length;

  if (status === 'loading' || historyLoading) {
    return (
      <div className="flex min-h-screen">
        <ClientSidebar clientName={clientName || slug} clientSlug={slug} />
        <div className="flex-1 ml-60">
          <TopBar title="Site Audit" />
          <div className="p-8 text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ClientSidebar clientName={clientName || slug} clientSlug={slug} />
      <div className="flex-1 ml-60">
        <TopBar title={`${clientName} — Site Audit`} />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Site Audit</h2>
              <p className="text-muted text-sm mt-1">14-point technical SEO crawl</p>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={running}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {running ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Audit...
                </>
              ) : (
                'Run Audit'
              )}
            </button>
          </div>

          {running && (
            <div className="bg-card border border-border rounded-xl p-8 text-center mb-6">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Crawling your website...</p>
              <p className="text-muted text-sm mt-1">This may take 30–60 seconds. We crawl up to 10 pages.</p>
            </div>
          )}

          {currentAudit && !running && (
            <div className="space-y-6 mb-8">
              {/* Health score card */}
              <div className="bp-card">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <HealthGauge score={currentAudit.healthScore} />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-4">Audit Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
                        <p className="text-xs text-red-400/80 mt-0.5">Critical</p>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{warningCount}</p>
                        <p className="text-xs text-yellow-400/80 mt-0.5">Warnings</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-400">{infoCount}</p>
                        <p className="text-xs text-blue-400/80 mt-0.5">Info</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues list */}
              {currentAudit.issues.length > 0 && (
                <div className="bp-card">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-white">Issues Found</h3>
                    <div className="flex gap-1.5 ml-auto">
                      {(['all', 'critical', 'warning', 'info'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setFilterSeverity(f)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${filterSeverity === f ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredIssues.map((issue, idx) => (
                      <div key={idx} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <IssueBadge severity={issue.severity} />
                          <span className="text-white text-sm font-medium flex-1">{issue.title}</span>
                          <span className="text-white/30 text-xs truncate max-w-[200px] hidden sm:block">{issue.url}</span>
                          <span className="text-white/30 ml-2">{expandedIssue === idx ? '▲' : '▼'}</span>
                        </button>
                        {expandedIssue === idx && (
                          <div className="px-4 pb-4 pt-2 bg-background/30 border-t border-border space-y-2">
                            <p className="text-muted text-sm">{issue.description}</p>
                            <p className="text-xs text-white/40 font-mono break-all">{issue.url}</p>
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                              <p className="text-xs text-green-400 font-medium mb-0.5">How to Fix</p>
                              <p className="text-sm text-green-300/80">{issue.howToFix}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past audits */}
          {history.length === 0 && !currentAudit ? (
            <div className="bg-card border border-border rounded-xl p-16 text-center">
              <div className="text-5xl mb-4">🔎</div>
              <h3 className="text-lg font-semibold text-white mb-2">No audits yet</h3>
              <p className="text-muted text-sm">Click "Run Audit" to analyze your website.</p>
            </div>
          ) : history.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-white font-semibold">Past Audits</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-background/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Health Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Critical</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Warnings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Info</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Pages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((a) => {
                    const scoreColor = a.overall_score >= 80 ? 'text-green-400' : a.overall_score >= 50 ? 'text-yellow-400' : 'text-red-400';
                    return (
                      <tr key={a.id} className="hover:bg-background/50">
                        <td className="px-4 py-3 text-white">
                          {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${scoreColor}`}>{a.overall_score}/100</span>
                        </td>
                        <td className="px-4 py-3 text-red-400">{a.errors_count}</td>
                        <td className="px-4 py-3 text-yellow-400">{a.warnings_count}</td>
                        <td className="px-4 py-3 text-blue-400">{a.notices_count}</td>
                        <td className="px-4 py-3 text-muted">{a.pages_crawled}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
