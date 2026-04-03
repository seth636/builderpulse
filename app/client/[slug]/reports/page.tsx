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
  report_email?: string | null;
}

interface Schedule {
  id: number;
  enabled: boolean;
  recipient: string;
  day_of_week: number;
  hour_utc: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const YEARS = [2024, 2025, 2026];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOUR_OPTIONS = [
  { label: '6:00 AM PT (14:00 UTC)', value: 14 },
  { label: '7:00 AM PT (15:00 UTC)', value: 15 },
  { label: '8:00 AM PT (16:00 UTC)', value: 16 },
  { label: '9:00 AM PT (17:00 UTC)', value: 17 },
  { label: '12:00 PM PT (20:00 UTC)', value: 20 },
];

function getLastMonth(): { month: number; year: number } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: d.getMonth(), year: d.getFullYear() };
}

function getNextSendDate(dayOfWeek: number, hourUtc: number): string {
  const now = new Date();
  const daysUntil = (dayOfWeek - now.getUTCDay() + 7) % 7 || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntil);
  next.setUTCHours(hourUtc, 0, 0, 0);
  return next.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Shared input style
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '13px',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  background: 'var(--bg-card-subtle)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

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

  // Schedule state
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [schedEnabled, setSchedEnabled] = useState(false);
  const [schedRecipient, setSchedRecipient] = useState('');
  const [schedDay, setSchedDay] = useState(1);
  const [schedHour, setSchedHour] = useState(14);
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedMsg, setSchedMsg] = useState<string | null>(null);

  // Send modal state
  const [sendModalReport, setSendModalReport] = useState<Report | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  const lastMonth = getLastMonth();
  const [selectedMonth, setSelectedMonth] = useState(lastMonth.month);
  const [selectedYear, setSelectedYear] = useState(lastMonth.year);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (slug) fetchClient();
  }, [slug]);

  const fetchClient = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      const found = data.find((c: ClientInfo) => c.slug === slug);
      if (found) {
        setClient(found);
        fetchReports(found.id);
        fetchSchedule();
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

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/clients/${slug}/report-schedule`);
      if (res.ok) {
        const data = await res.json();
        if (data.schedule) {
          setSchedule(data.schedule);
          setSchedEnabled(data.schedule.enabled);
          setSchedRecipient(data.schedule.recipient);
          setSchedDay(data.schedule.day_of_week);
          setSchedHour(data.schedule.hour_utc);
        }
      }
    } catch {}
  };

  const handleGenerate = async () => {
    if (!client) return;
    setGenerating(true);
    setGenerateError(null);
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
        setGenerateError(null);
        await fetchReports(client.id);
      } else {
        const err = await res.json();
        setGenerateError(err.error || 'Failed to generate report. Make sure this client has connected integrations with synced data.');
      }
    } catch {
      setGenerateError('Network error — could not reach the server. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const openSendModal = (report: Report) => {
    setSendModalReport(report);
    setSendEmail(client?.report_email || schedule?.recipient || '');
    setSendMsg(null);
  };

  const handleSend = async () => {
    if (!sendModalReport) return;
    setSendLoading(true);
    setSendMsg(null);
    try {
      // Update report_email on client if different
      if (sendEmail && client && sendEmail !== client.report_email) {
        await fetch(`/api/clients/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_email: sendEmail }),
        });
      }
      const res = await fetch(`/api/reports/${sendModalReport.id}/send`, { method: 'POST' });
      if (res.ok) {
        setSendMsg(`Sent to ${sendEmail}`);
        if (client) fetchReports(client.id);
        setTimeout(() => setSendModalReport(null), 2000);
      } else {
        const err = await res.json();
        setSendMsg(`Error: ${err.error}`);
      }
    } catch {
      setSendMsg('Failed to send report');
    } finally {
      setSendLoading(false);
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    setActionLoading(reportId);
    try {
      await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (client) await fetchReports(client.id);
    } catch {
      alert('Failed to delete report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSchedule = async () => {
    setSchedSaving(true);
    setSchedMsg(null);
    try {
      const res = await fetch(`/api/clients/${slug}/report-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: schedEnabled, recipient: schedRecipient, dayOfWeek: schedDay, hourUtc: schedHour }),
      });
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.schedule);
        setSchedMsg('Schedule saved');
        setTimeout(() => setSchedMsg(null), 3000);
      } else {
        setSchedMsg('Failed to save');
      }
    } catch {
      setSchedMsg('Failed to save');
    } finally {
      setSchedSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
        {client && <ClientSidebar clientName={client.name} clientSlug={slug} />}
        <div style={{ flex: 1, marginLeft: client ? '240px' : 0 }}>
          <TopBar title="Reports" />
          <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <ClientSidebar clientName={client.name} clientSlug={slug} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <TopBar title={`${client.name} — Reports`} />
        <div style={{ padding: '32px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px' }}>Monthly Reports</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>AI-generated performance reports for {client.name}</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '9px 18px', background: '#926BD9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
            >
              + Generate Report
            </button>
          </div>

          {/* Reports table */}
          {reports.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '64px', textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px' }}>No reports yet</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 4px' }}>Generate your first monthly report to get started.</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 20px' }}>Reports pull from connected integrations (Google, GHL, Meta). Make sure at least one is connected and synced first.</p>
              <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', background: '#926BD9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                Generate First Report
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Period', 'Status', 'Created', 'Sent', 'Actions'].map((h, i) => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: i === 4 ? 'right' : 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{report.period_label}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600',
                          background: report.status === 'sent' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          color: report.status === 'sent' ? '#10B981' : '#F59E0B',
                        }}>
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {report.sent_at ? new Date(report.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                          <a href={`/report/${report.id}/view`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#926BD9', fontWeight: '500', textDecoration: 'none' }}>View</a>
                          <a href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#4285F4', fontWeight: '500', textDecoration: 'none' }}>PDF</a>
                          <button
                            onClick={() => openSendModal(report)}
                            disabled={actionLoading === report.id}
                            style={{ fontSize: '13px', color: '#10B981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', padding: 0, fontFamily: 'Inter, sans-serif' }}
                          >
                            Send Report
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            disabled={actionLoading === report.id}
                            style={{ fontSize: '13px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', padding: 0, fontFamily: 'Inter, sans-serif' }}
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

          {/* ── Auto-Schedule ── */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px' }}>Auto-Send Weekly Report</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Automatically email the latest report to the client on a schedule.</p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => setSchedEnabled(v => !v)}
                style={{
                  width: '44px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  background: schedEnabled ? '#926BD9' : 'var(--border)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px', left: schedEnabled ? '23px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', display: 'block',
                }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recipient Email</label>
                <input
                  type="email"
                  value={schedRecipient}
                  onChange={e => setSchedRecipient(e.target.value)}
                  placeholder="client@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Day of Week</label>
                <select value={schedDay} onChange={e => setSchedDay(parseInt(e.target.value))} style={inputStyle}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Send Time</label>
                <select value={schedHour} onChange={e => setSchedHour(parseInt(e.target.value))} style={inputStyle}>
                  {HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {schedEnabled && schedRecipient && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(146,107,217,0.08)', border: '1px solid rgba(146,107,217,0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Next send: <strong style={{ color: 'var(--text-primary)' }}>{getNextSendDate(schedDay, schedHour)}</strong> → {schedRecipient}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleSaveSchedule}
                disabled={schedSaving}
                style={{ padding: '8px 20px', background: '#926BD9', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', opacity: schedSaving ? 0.6 : 1 }}
              >
                {schedSaving ? 'Saving...' : 'Save Schedule'}
              </button>
              {schedMsg && <span style={{ fontSize: '13px', color: schedMsg.startsWith('Failed') ? '#EF4444' : '#10B981' }}>{schedMsg}</span>}
            </div>
          </div>

        </div>
      </div>

      {/* Generate modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 20px' }}>Generate Report</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Month</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={inputStyle}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Year</label>
                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={inputStyle}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {generating && <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Generating AI report — this may take 30–60 seconds...</p>}
              {generateError && (
                <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '13px', color: '#EF4444', lineHeight: '1.5' }}>
                  {generateError}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleGenerate} disabled={generating} style={{ flex: 1, padding: '10px', background: '#926BD9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: generating ? 0.6 : 1 }}>
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
              <button onClick={() => setShowModal(false)} disabled={generating} style={{ flex: 1, padding: '10px', background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: '500', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Report modal */}
      {sendModalReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px' }}>Send Report</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px' }}>{sendModalReport.period_label}</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recipient Email</label>
              <input type="email" value={sendEmail} onChange={e => setSendEmail(e.target.value)} placeholder="client@example.com" style={inputStyle} />
            </div>
            {sendMsg && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: sendMsg.startsWith('Error') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', color: sendMsg.startsWith('Error') ? '#EF4444' : '#10B981', border: `1px solid ${sendMsg.startsWith('Error') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                {sendMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSend} disabled={sendLoading || !sendEmail} style={{ flex: 1, padding: '10px', background: '#10B981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', opacity: (sendLoading || !sendEmail) ? 0.6 : 1 }}>
                {sendLoading ? 'Sending...' : 'Send Now'}
              </button>
              <button onClick={() => setSendModalReport(null)} style={{ flex: 1, padding: '10px', background: 'var(--bg-card-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: '500', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
