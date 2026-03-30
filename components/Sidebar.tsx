'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = true; // Auth disabled temporarily
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

  return (
    <div className="fixed left-0 top-0 h-screen w-[220px] bg-card-dark border-r border-border-divider flex flex-col">
      <div className="p-6">
        <h1 className="text-base font-semibold text-white">BuilderPulse</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
            isActive('/dashboard')
              ? 'text-white bg-white/[0.03] border-l-4 border-accent pl-[12px]'
              : 'text-slate-400 hover:bg-white/[0.03] hover:text-white border-l-4 border-transparent'
          }`}
        >
          <span className="text-xl">📊</span>
          <span>Dashboard</span>
        </Link>
        <Link
          href="/alerts"
          className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all ${
            isActive('/alerts')
              ? 'text-white bg-white/[0.03] border-l-4 border-accent pl-[12px]'
              : 'text-slate-400 hover:bg-white/[0.03] hover:text-white border-l-4 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <span>Alerts</span>
          </div>
          {alertCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {alertCount}
            </span>
          )}
        </Link>

        {isAdmin && (
          <div className="pt-4 border-t border-border-divider mt-4">
            <p className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Settings
            </p>
            <Link
              href="/settings/clients"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                isActive('/settings/clients')
                  ? 'text-white bg-white/[0.03] border-l-4 border-accent pl-[12px]'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-white border-l-4 border-transparent'
              }`}
            >
              <span className="text-xl">👥</span>
              <span>Clients</span>
            </Link>
            <Link
              href="/settings/team"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                isActive('/settings/team')
                  ? 'text-white bg-white/[0.03] border-l-4 border-accent pl-[12px]'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-white border-l-4 border-transparent'
              }`}
            >
              <span className="text-xl">⚙️</span>
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
          className="w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
