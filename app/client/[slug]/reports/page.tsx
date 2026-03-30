'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ClientSidebar from '@/components/ClientSidebar';
import TopBar from '@/components/TopBar';

interface Report {
  id: number;
  client_id: number;
  period_start: string;
  period_end: string;
  period_label: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface ClientInfo {
  id: number;
  name: string;
  slug: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const YEARS = [2024, 2025, 2026];

function getLastMonth(): { month: number; year: number } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: d.getMonth(), year: d.getFullYear() };
}

export default function ClientReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [client, setClient] = useState<ClientInfo | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const lastMonth = getLastMonth();
  const [selectedMonth, setSelectedMonth] = useState(lastMonth.month);
  const [selectedYear, setSelectedYear] = useState(lastMonth.year);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (slug) {
      fetchClient();
    }
  }, [slug]);

  const fetchClient = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      const found = data.find((c: ClientInfo) => c.slug === slug);
      if (found) {
        setClient(found);
        fetchReports(found.id);
      }
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (clientId: number) => {
    try {
      const res = await fetch(`/api/reports?clientId=${clientId}`);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const handleGenerate = async () => {
    if (!client) return;
    setGenerating(true);

    const periodStart = new Date(selectedYear, selectedMonth, 1);
    const periodEnd = new Date(selectedYear, selectedMonth + 1, 0);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          periodStart: periodStart.toISOString().split('T')[0],
          periodEnd: periodEnd.toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchReports(client.id);
      } else {
        const err = await res.json();
        alert(`Failed to generate report: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (reportId: number) => {
    setActionLoading(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}/send`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(`Report sent to ${data.sentTo}`);
        if (client) await fetchReports(client.id);
      } else {
        const err = await res.json();
        alert(`Failed to send: ${err.error}`);
      }
    } catch (error) {
      alert('Failed to send report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    setActionLoading(reportId);
    try {
      await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (client) await fetchReports(client.id);
    } catch (error) {
      alert('Failed to delete report');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: 'background:#dcfce7;color:#16a34a',
      draft: 'background:#fef9c3;color:#ca8a04',
    };
    const s = styles[status] || 'background:#f1f5f9;color:#64748b';
    return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;${s}">${status.toUpperCase()}</span>`;
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen">
        {client && <ClientSidebar clientName={client.name} clientSlug={slug} />}
        <div className={`flex-1 ${client ? 'ml-60' : ''}`}>
          <TopBar title="Reports" />
          <div className="p-8 text-center text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="flex min-h-screen">
      <ClientSidebar clientName={client.name} clientSlug={slug} />
      <div className="flex-1 ml-60">
        <TopBar title={`${client.name} — Reports`} />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Monthly Reports</h2>
              <p className="text-muted text-sm mt-1">AI-generated performance reports for {client.name}</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
            >
              + Generate Report
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-16 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">No reports yet</h3>
              <p className="text-muted mb-6">Generate your first monthly report to get started.</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
              >
                Generate First Report
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Sent</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-background/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {report.period_label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            report.status === 'sent'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {new Date(report.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {report.sent_at
                          ? new Date(report.sent_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/report/${report.id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:text-accent/80 font-medium"
                          >
                            View
                          </a>
                          <a
                            href={`/api/reports/${report.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            PDF
                          </a>
                          <button
                            onClick={() => handleSend(report.id)}
                            disabled={actionLoading === report.id}
                            className="text-green-400 hover:text-green-300 font-medium disabled:opacity-50"
                          >
                            {actionLoading === report.id ? '...' : 'Send'}
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            disabled={actionLoading === report.id}
                            className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">Generate Report</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {generating && (
                <div className="text-center text-muted text-sm py-2">
                  Generating report with AI summary... this may take 30–60 seconds.
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-6">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={generating}
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
