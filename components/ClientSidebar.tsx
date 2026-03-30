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
    `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-accent/10 text-accent'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`;

  const subLinkClass = (href: string) =>
    `block pl-8 pr-4 py-1.5 rounded-lg text-sm transition-colors ${
      isActive(href)
        ? 'text-accent'
        : 'text-slate-500 hover:text-white'
    }`;

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

      <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
        <a href="#overview" className={linkClass(`/client/${clientSlug}`)}>Overview</a>
        <a href="#traffic" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">Traffic</a>

        {/* SEO section with sub-links */}
        <a href="#seo" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">SEO</a>
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
          <div key={s.label} className="flex items-center justify-between px-4 py-2 rounded-lg text-sm cursor-not-allowed">
            <span className="text-slate-600">{s.label}</span>
            <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">P{s.phase}</span>
          </div>
        ))}

        <Link href={`/client/${clientSlug}/reports`} className={linkClass(`/client/${clientSlug}/reports`)}>
          Reports
        </Link>
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
