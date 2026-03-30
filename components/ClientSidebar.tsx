'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const CLIENT_SECTIONS = [
  { id: 'overview', label: 'Overview', phase: null },
  { id: 'traffic', label: 'Traffic', phase: null },
  { id: 'seo', label: 'SEO', phase: null },
  { id: 'ads', label: 'Ads', phase: 4 },
  { id: 'leads', label: 'Leads', phase: 4 },
  { id: 'reviews', label: 'Reviews', phase: 4 },
  { id: 'reports', label: 'Reports', phase: 5 },
];

type Props = {
  clientName: string;
  clientSlug: string;
};

export default function ClientSidebar({ clientName, clientSlug }: Props) {
  const { data: session } = useSession();

  return (
    <div className="fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-bold text-white mb-1">BuilderPulse</h1>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="p-4 border-b border-border">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Client</p>
        <p className="text-white font-bold text-sm truncate">{clientName}</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {CLIENT_SECTIONS.map((section) => {
          const isDisabled = section.phase !== null;
          if (isDisabled) {
            return (
              <div
                key={section.id}
                className="flex items-center justify-between px-4 py-2 rounded-lg text-sm cursor-not-allowed"
              >
                <span className="text-slate-600">{section.label}</span>
                <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                  P{section.phase}
                </span>
              </div>
            );
          }
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {section.label}
            </a>
          );
        })}
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
