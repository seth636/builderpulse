'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface TopBarProps {
  title: string;
  children?: React.ReactNode;
}

export default function TopBar({ title, children }: TopBarProps) {
  const { data: session } = useSession();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetch('/api/alerts?isRead=false&isResolved=false')
      .then(r => r.json())
      .then(d => setAlertCount((d.alerts || []).length))
      .catch(() => {});
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-4">
          {children}
          <Link href="/alerts" className="relative">
            <div className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <span className="text-lg">🔔</span>
            </div>
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </Link>
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </div>
  );
}
