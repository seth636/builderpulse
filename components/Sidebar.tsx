'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

// SVG icon components
const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CogIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = true;
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetch('/api/alerts?isRead=false&isResolved=false')
      .then(r => r.json())
      .then(d => setAlertCount((d.alerts || []).length))
      .catch(() => {});
  }, []);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navLinkClass = (active: boolean) =>
    `relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-md ${
      active
        ? 'text-white bg-white/[0.04]'
        : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'
    }`;

  const activeIndicator = (active: boolean) =>
    active
      ? 'absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-accent rounded-r-full'
      : '';

  return (
    <div className="fixed left-0 top-0 h-screen w-[220px] bg-card-dark border-r border-border-divider flex flex-col transition-colors duration-200">
      <div className="p-6 pb-4">
        <h1 className="text-base font-semibold text-white tracking-tight">BuilderPulse</h1>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        <Link href="/dashboard" className={navLinkClass(isActive('/dashboard'))}>
          {isActive('/dashboard') && <span className={activeIndicator(true)} />}
          <span className={isActive('/dashboard') ? 'text-accent' : 'text-slate-500'}>
            <DashboardIcon />
          </span>
          <span>Dashboard</span>
        </Link>

        <Link href="/alerts" className={navLinkClass(isActive('/alerts'))}>
          {isActive('/alerts') && <span className={activeIndicator(true)} />}
          <span className={isActive('/alerts') ? 'text-accent' : 'text-slate-500'}>
            <BellIcon />
          </span>
          <span className="flex-1">Alerts</span>
          {alertCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {alertCount}
            </span>
          )}
        </Link>

        {isAdmin && (
          <div className="pt-4 mt-2">
            <p className="px-4 py-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
              Admin
            </p>
            <Link href="/settings/clients" className={navLinkClass(isActive('/settings/clients'))}>
              {isActive('/settings/clients') && <span className={activeIndicator(true)} />}
              <span className={isActive('/settings/clients') ? 'text-accent' : 'text-slate-500'}>
                <UsersIcon />
              </span>
              <span>Clients</span>
            </Link>
            <Link href="/settings/team" className={navLinkClass(isActive('/settings/team'))}>
              {isActive('/settings/team') && <span className={activeIndicator(true)} />}
              <span className={isActive('/settings/team') ? 'text-accent' : 'text-slate-500'}>
                <CogIcon />
              </span>
              <span>Team</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border-divider">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
            {session?.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </div>
  );
}
