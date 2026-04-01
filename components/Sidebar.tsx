'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Bell,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';

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

  const navItem = (
    href: string,
    Icon: React.ElementType,
    label: string,
    badge?: number
  ) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: active ? '500' : '400',
          color: active ? '#FFFFFF' : '#94A3B8',
          background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
          borderLeft: active ? '3px solid #3B82F6' : '3px solid transparent',
          transition: 'all 0.15s ease',
          textDecoration: 'none',
          position: 'relative',
          marginBottom: '2px',
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#94A3B8';
          }
        }}
      >
        <Icon size={20} strokeWidth={1.75} />
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
  };

  const sectionLabel = (text: string) => (
    <p style={{
      fontSize: '11px',
      fontWeight: '600',
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      padding: '16px 16px 6px',
    }}>
      {text}
    </p>
  );

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || 'U';

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
      <div style={{ padding: '24px 20px 20px' }}>
        <span style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#FFFFFF',
          letterSpacing: '-0.3px',
        }}>
          BuilderPulse
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        {sectionLabel('Main')}
        {navItem('/dashboard', LayoutDashboard, 'Dashboard')}
        {navItem('/alerts', Bell, 'Alerts', alertCount)}

        {sectionLabel('Admin')}
        {navItem('/settings/clients', Users, 'Clients')}
        {navItem('/settings/team', Settings, 'Team')}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.2)',
            color: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            flexShrink: 0,
          }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.name || 'User'}
            </p>
            <p style={{ fontSize: '11px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255,255,255,0.04)',
            color: '#94A3B8',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
          }}
        >
          <LogOut size={14} strokeWidth={2} />
          Logout
        </button>
      </div>
    </div>
  );
}
