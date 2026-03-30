'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = true; // Auth disabled temporarily

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">BuilderPulse</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <Link
          href="/dashboard"
          className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive('/dashboard')
              ? 'bg-accent/10 text-accent'
              : 'text-muted hover:bg-white/5 hover:text-white'
          }`}
        >
          Dashboard
        </Link>

        {isAdmin && (
          <div className="pt-4">
            <p className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
              Settings
            </p>
            <Link
              href="/settings/clients"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/settings/clients')
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              Clients
            </Link>
            <Link
              href="/settings/team"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/settings/team')
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              Team
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="mb-3">
          <p className="text-sm font-medium text-white">{session?.user?.name}</p>
          <p className="text-xs text-muted">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full px-4 py-2 text-sm font-medium text-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
