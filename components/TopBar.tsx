'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface TopBarProps {
  title: string;
  children?: React.ReactNode;
}

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function TopBar({ title, children }: TopBarProps) {
  const { data: session } = useSession();
  const [alertCount, setAlertCount] = useState(0);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    fetch('/api/alerts?isRead=false&isResolved=false')
      .then(r => r.json())
      .then(d => setAlertCount((d.alerts || []).length))
      .catch(() => {});

    // Init theme from localStorage, default dark
    const stored = localStorage.getItem('bp-theme');
    const dark = stored ? stored === 'dark' : true;
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('bp-theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border-divider px-8 py-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          {children}

          {/* Dark/light toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Alerts bell */}
          <Link href="/alerts" className="relative">
            <div className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white">
              <BellIcon />
            </div>
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </div>
  );
}
