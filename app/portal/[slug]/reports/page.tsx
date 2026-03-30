import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import PortalHeader from '../../components/PortalHeader';

const prisma = new PrismaClient();

function getPortalSessionFromCookies(cookieStore: ReturnType<typeof cookies>) {
  const cookie = cookieStore.get('portal_session');
  if (!cookie) return null;
  try {
    return JSON.parse(Buffer.from(cookie.value, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export default async function PortalReportsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { token?: string };
}) {
  const cookieStore = cookies();
  const tokenParam = searchParams.token;

  const client = await prisma.client.findUnique({ where: { slug: params.slug } });
  if (!client) redirect('/portal/login');

  let authorized = false;
  if (tokenParam && client.portal_enabled && client.portal_token === tokenParam) authorized = true;
  const portalSession = getPortalSessionFromCookies(cookieStore);
  if (!authorized && portalSession?.role === 'client' && portalSession?.clientId === client.id) authorized = true;
  const nextAuthSession = await getServerSession(authOptions);
  if (!authorized && nextAuthSession && ['admin', 'pm'].includes((nextAuthSession.user as any).role || '')) authorized = true;
  if (!authorized) redirect(`/portal/login?redirect=/portal/${params.slug}/reports`);

  const reports = await prisma.report.findMany({
    where: { client_id: client.id, status: 'sent' },
    orderBy: { period_start: 'desc' },
    take: 24,
  });

  function formatPeriod(label: string, sentAt: Date | null): string {
    if (sentAt) {
      return sentAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return label;
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PortalHeader clientName={client.name} slug={params.slug} />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            href={`/portal/${params.slug}${tokenParam ? `?token=${tokenParam}` : ''}`}
            style={{ fontSize: '14px', color: '#0ea5e9', textDecoration: 'none' }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          Monthly Reports
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
          Your monthly marketing performance reports from Home Builder Marketers.
        </p>

        {reports.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            padding: '60px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              No reports yet
            </h3>
            <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '400px', margin: '0 auto' }}>
              No reports have been shared yet. Reports will appear here once your account manager sends your monthly report.
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px', color: '#9ca3af', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report Period</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', color: '#9ca3af', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sent</th>
                  <th style={{ textAlign: 'right', padding: '14px 20px', color: '#9ca3af', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, i) => (
                  <tr key={report.id} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{report.period_label}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                        {report.period_start ? new Date(report.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} — {report.period_end ? new Date(report.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: '#6b7280' }}>
                      {formatPeriod(report.period_label, report.sent_at)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <a
                          href={`/report/${report.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            fontSize: '13px',
                            color: '#374151',
                            textDecoration: 'none',
                            fontWeight: '500',
                            backgroundColor: 'white',
                          }}
                        >
                          View
                        </a>
                        <a
                          href={`/api/reports/${report.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#0ea5e9',
                            fontSize: '13px',
                            color: 'white',
                            textDecoration: 'none',
                            fontWeight: '500',
                          }}
                        >
                          Download PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '20px 24px', textAlign: 'center', marginTop: '32px' }}>
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>
          Powered by{' '}
          <a href="https://homebuildermarketers.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '500' }}>
            Home Builder Marketers
          </a>
        </p>
      </footer>
    </div>
  );
}
