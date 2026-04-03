'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

// Inline SVGs — SearchAtlas style icons
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconUserCog = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
    <circle cx="19" cy="11" r="2"/>
    <path d="M19 9V7"/>
    <path d="M19 13v-2"/>
  </svg>
);

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

function NavItem({
  href,
  Icon,
  label,
  active,
  badge,
}: {
  href: string;
  Icon: () => JSX.Element;
  label: string;
  active: boolean;
  badge?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: active ? '500' : '400',
        color: active ? 'var(--text-primary)' : hovered ? 'var(--text-secondary)' : 'var(--text-muted)',
        background: active
          ? 'rgba(147, 107, 218, 0.12)'
          : hovered
          ? 'rgba(255,255,255,0.03)'
          : 'transparent',
        borderLeft: active ? '2px solid #00FFD4' : '2px solid transparent',
        transition: 'all 0.15s ease',
        textDecoration: 'none',
        marginBottom: '2px',
      }}
    >
      <span style={{ color: active ? '#00FFD4' : hovered ? 'var(--text-secondary)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
        <Icon />
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          background: '#EF4444',
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 7px',
          borderRadius: '999px',
          minWidth: '20px',
          textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onLogout}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        background: hovered ? 'rgba(147, 107, 218, 0.1)' : 'var(--bg-card-subtle)',
        color: hovered ? 'var(--text-primary)' : 'var(--text-muted)',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <IconLogout />
      Logout
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetch('/api/alerts?isRead=false&isResolved=false')
      .then(r => r.json())
      .then(d => setAlertCount((d.alerts || []).length))
      .catch(() => {});
  }, []);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || 'U';

  const sectionLabel = (text: string) => (
    <p key={text} style={{
      fontSize: '11px',
      fontWeight: '600',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      padding: '20px 14px 8px',
      margin: 0,
    }}>
      {text}
    </p>
  );

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
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ 
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #00FFD4 0%, #926BD9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#000' }}>B</span>
          </div>
          <span style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            BuilderPulse
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px', overflowY: 'auto' }}>
        {sectionLabel('Main')}
        <NavItem href="/dashboard" Icon={IconDashboard} label="Dashboard" active={isActive('/dashboard')} />
        <NavItem href="/alerts" Icon={IconBell} label="Alerts" active={isActive('/alerts')} badge={alertCount} />

        {sectionLabel('Settings')}
        <NavItem href="/settings/clients" Icon={IconUsers} label="Clients" active={isActive('/settings/clients')} />
        <NavItem href="/settings/team" Icon={IconUserCog} label="Team" active={isActive('/settings/team')} />
      </nav>

      {/* User footer */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid rgba(147, 107, 218, 0.08)',
        background: 'rgba(147, 107, 218, 0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(0, 255, 212, 0.2) 0%, rgba(147, 107, 218, 0.2) 100%)', 
            color: '#00FFD4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '600', flexShrink: 0,
            border: '1px solid rgba(0, 255, 212, 0.2)',
          }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {session?.user?.name || 'User'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {session?.user?.email || ''}
            </p>
          </div>
        </div>
        <LogoutButton onLogout={() => signOut({ callbackUrl: '/login' })} />
      </div>
    </div>
  );
}
