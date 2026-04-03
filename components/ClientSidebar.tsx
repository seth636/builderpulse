'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

// SVG Icon components — 18x18, same stroke style as Sidebar.tsx
const IconOverview = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconTraffic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconSEO = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconAds = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconLeads = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconReviews = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconAI = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const IconReports = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconConnections = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

type Props = {
  clientName: string;
  clientSlug: string;
};

export default function ClientSidebar({ clientName, clientSlug }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    paddingLeft: active ? 14 : 16,
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    textDecoration: 'none',
    background: active ? 'rgba(147,107,218,0.12)' : 'transparent',
    borderLeft: active ? '2px solid #00FFD4' : '2px solid transparent',
    transition: 'all 0.15s ease',
  });

  const subLinkStyle = (active: boolean): React.CSSProperties => ({
    display: 'block',
    paddingLeft: 48,
    paddingRight: 16,
    paddingTop: 6,
    paddingBottom: 6,
    fontSize: 13,
    color: active ? '#00FFD4' : 'var(--text-muted)',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  });

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: '240px',
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '5px',
            background: 'linear-gradient(135deg, #00FFD4 0%, #926BD9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#000' }}>B</span>
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
            BuilderPulse
          </span>
        </div>
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '13px',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(147, 107, 218, 0.03)',
      }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Client</p>
        <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName}</p>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        {/* Overview */}
        <Link
          href={`/client/${clientSlug}`}
          style={navLinkStyle(isActive(`/client/${clientSlug}`) && !pathname.includes('/seo/') && !pathname.includes('/recommendations') && !pathname.includes('/reports') && !pathname.includes('/traffic') && !pathname.includes('/ads') && !pathname.includes('/leads') && !pathname.includes('/reviews') && !pathname.includes('/connections'))}
          onMouseEnter={e => { const active = isActive(`/client/${clientSlug}`) && !pathname.includes('/seo/'); if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { const active = isActive(`/client/${clientSlug}`) && !pathname.includes('/seo/'); if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconOverview />
          Overview
        </Link>

        {/* Traffic */}
        <Link
          href={`/client/${clientSlug}/traffic`}
          style={navLinkStyle(isActive(`/client/${clientSlug}/traffic`))}
          onMouseEnter={e => { if (!isActive(`/client/${clientSlug}/traffic`)) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!isActive(`/client/${clientSlug}/traffic`)) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconTraffic />
          Traffic
        </Link>

        {/* SEO */}
        <Link
          href={`/client/${clientSlug}/seo/keywords`}
          style={navLinkStyle(pathname.includes('/seo/'))}
          onMouseEnter={e => { if (!pathname.includes('/seo/')) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!pathname.includes('/seo/')) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconSEO />
          SEO
        </Link>
        <Link href={`/client/${clientSlug}/seo/keywords`} style={subLinkStyle(isActive(`/client/${clientSlug}/seo/keywords`))}>
          ↳ Keywords
        </Link>
        <Link href={`/client/${clientSlug}/seo/audit`} style={subLinkStyle(isActive(`/client/${clientSlug}/seo/audit`))}>
          ↳ Site Audit
        </Link>
        <Link href={`/client/${clientSlug}/seo/backlinks`} style={subLinkStyle(isActive(`/client/${clientSlug}/seo/backlinks`))}>
          ↳ Backlinks
        </Link>

        {/* Ads */}
        <Link
          href={`/client/${clientSlug}/ads`}
          style={navLinkStyle(isActive(`/client/${clientSlug}/ads`))}
          onMouseEnter={e => { if (!isActive(`/client/${clientSlug}/ads`)) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!isActive(`/client/${clientSlug}/ads`)) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconAds />
          Ads
        </Link>

        {/* Leads */}
        <Link
          href={`/client/${clientSlug}/leads`}
          style={navLinkStyle(isActive(`/client/${clientSlug}/leads`))}
          onMouseEnter={e => { if (!isActive(`/client/${clientSlug}/leads`)) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!isActive(`/client/${clientSlug}/leads`)) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconLeads />
          Leads
        </Link>

        {/* Reviews */}
        <Link
          href={`/client/${clientSlug}/reviews`}
          style={navLinkStyle(isActive(`/client/${clientSlug}/reviews`))}
          onMouseEnter={e => { if (!isActive(`/client/${clientSlug}/reviews`)) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!isActive(`/client/${clientSlug}/reviews`)) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconReviews />
          Reviews
        </Link>

        {/* AI Recommendations */}
        <Link
          href={`/client/${clientSlug}/recommendations`}
          style={navLinkStyle(isActive(`/client/${clientSlug}/recommendations`))}
          onMouseEnter={e => { if (!isActive(`/client/${clientSlug}/recommendations`)) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!isActive(`/client/${clientSlug}/recommendations`)) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconAI />
          AI Recommendations
        </Link>

        {/* Reports */}
        <Link
          href={`/client/${clientSlug}/reports`}
          style={navLinkStyle(isActive(`/client/${clientSlug}/reports`))}
          onMouseEnter={e => { if (!isActive(`/client/${clientSlug}/reports`)) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!isActive(`/client/${clientSlug}/reports`)) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconReports />
          Reports
        </Link>

        {/* Connections */}
        <Link
          href={`/client/${clientSlug}/connections`}
          style={navLinkStyle(isActive(`/client/${clientSlug}/connections`))}
          onMouseEnter={e => { if (!isActive(`/client/${clientSlug}/connections`)) e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { if (!isActive(`/client/${clientSlug}/connections`)) e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <IconConnections />
          Connections
        </Link>
      </nav>

      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(147, 107, 218, 0.08)',
        background: 'rgba(147, 107, 218, 0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, rgba(0, 255, 212, 0.2) 0%, rgba(147, 107, 218, 0.2) 100%)',
            border: '1px solid rgba(0, 255, 212, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00FFD4',
            fontWeight: '600',
            fontSize: '13px',
          }}>
            {session?.user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            width: '100%',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(147, 107, 218, 0.15)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'rgba(147, 107, 218, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
