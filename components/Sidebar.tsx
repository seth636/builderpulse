'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

// Inline SVGs — no external dep, zero cache risk
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
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: active ? '500' : '400',
        color: active ? '#FFFFFF' : hovered ? '#CBD5E1' : '#94A3B8',
        background: active
          ? 'rgba(59,130,246,0.08)'
          : hovered
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        borderLeft: active ? '3px solid #3B82F6' : '3px solid transparent',
        transition: 'all 0.15s ease',
        textDecoration: 'none',
        marginBottom: '2px',
      }}
    >
      <span style={{ color: active ? '#3B82F6' : hovered ? '#CBD5E1' : '#64748B', display: 'flex', flexShrink: 0 }}>
        <Icon />
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          background: '#EF4444',
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: '700',
          padding: '1px 6px',
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
        padding: '8px 12px',
        borderRadius: '8px',
        border: 'none',
        background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        color: hovered ? '#FFFFFF' : '#94A3B8',
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
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      padding: '16px 12px 6px',
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
      backgroundColor: '#070d1a',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px' }}>
        <span style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
          BuilderPulse
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        {sectionLabel('Main')}
        <NavItem href="/dashboard" Icon={IconDashboard} label="Dashboard" active={isActive('/dashboard')} />
        <NavItem href="/alerts" Icon={IconBell} label="Alerts" active={isActive('/alerts')} badge={alertCount} />

        {sectionLabel('Settings')}
        <NavItem href="/settings/clients" Icon={IconUsers} label="Clients" active={isActive('/settings/clients')} />
        <NavItem href="/settings/team" Icon={IconUserCog} label="Team" active={isActive('/settings/team')} />
      </nav>

      {/* User footer */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(59,130,246,0.2)', color: '#3B82F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '600', flexShrink: 0,
          }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {session?.user?.name || 'User'}
            </p>
            <p style={{ fontSize: '11px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {session?.user?.email || ''}
            </p>
          </div>
        </div>
        <LogoutButton onLogout={() => signOut({ callbackUrl: '/login' })} />
      </div>
    </div>
  );
}
