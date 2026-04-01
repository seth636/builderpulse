'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

type Props = {
  clientName: string;
  clientSlug: string;
};

export default function ClientSidebar({ clientName, clientSlug }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
      isActive(href)
        ? 'text-white bg-[rgba(147,107,218,0.12)] border-l-2 border-[#00FFD4] pl-[14px]'
        : 'text-[#8b8b9e] hover:bg-[rgba(255,255,255,0.03)] hover:text-white border-l-2 border-transparent'
    }`;

  const subLinkClass = (href: string) =>
    `block pl-12 pr-4 py-1.5 text-sm transition-colors ${
      isActive(href)
        ? 'text-[#00FFD4]'
        : 'text-[#6b6b7e] hover:text-white'
    }`;

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: '220px',
      backgroundColor: '#050508',
      borderRight: '1px solid rgba(147, 107, 218, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid rgba(147, 107, 218, 0.08)',
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
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
            BuilderPulse
          </span>
        </div>
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#8b8b9e',
            fontSize: '13px',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8b8b9e'}
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(147, 107, 218, 0.08)',
        background: 'rgba(147, 107, 218, 0.03)',
      }}>
        <p style={{ fontSize: '10px', color: '#6b6b7e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Client</p>
        <p style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName}</p>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        <a href="#overview" className={linkClass(`/client/${clientSlug}`)}>Overview</a>
        <a href="#traffic" style={{
          display: 'block',
          padding: '10px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#8b8b9e',
          textDecoration: 'none',
          transition: 'all 0.15s ease',
        }}>Traffic</a>

        {/* SEO section with sub-links */}
        <a href="#seo" style={{
          display: 'block',
          padding: '10px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#8b8b9e',
          textDecoration: 'none',
          transition: 'all 0.15s ease',
        }}>SEO</a>
        <Link href={`/client/${clientSlug}/seo/keywords`} className={subLinkClass(`/client/${clientSlug}/seo/keywords`)}>
          ↳ Keywords
        </Link>
        <Link href={`/client/${clientSlug}/seo/audit`} className={subLinkClass(`/client/${clientSlug}/seo/audit`)}>
          ↳ Site Audit
        </Link>
        <Link href={`/client/${clientSlug}/seo/backlinks`} className={subLinkClass(`/client/${clientSlug}/seo/backlinks`)}>
          ↳ Backlinks
        </Link>

        {/* Disabled items */}
        {[
          { label: 'Ads', phase: 4 },
          { label: 'Leads', phase: 4 },
          { label: 'Reviews', phase: 4 },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'not-allowed',
          }}>
            <span style={{ color: '#4a4a5a' }}>{s.label}</span>
            <span style={{
              fontSize: '10px',
              color: '#4a4a5a',
              background: 'rgba(147, 107, 218, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>P{s.phase}</span>
          </div>
        ))}

        <Link href={`/client/${clientSlug}/recommendations`} className={linkClass(`/client/${clientSlug}/recommendations`)}>
          AI Recommendations
        </Link>
        <Link href={`/client/${clientSlug}/reports`} className={linkClass(`/client/${clientSlug}/reports`)}>
          Reports
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
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.name}</p>
            <p style={{ fontSize: '11px', color: '#6b6b7e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            width: '100%',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#8b8b9e',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(147, 107, 218, 0.15)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(147, 107, 218, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8b8b9e';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
