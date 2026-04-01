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
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(147, 107, 218, 0.1)',
      padding: '16px 32px',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.3px',
          }}>
            {title}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {children}

          {/* Dark/light toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(147, 107, 218, 0.08)',
              border: '1px solid rgba(147, 107, 218, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#8b8b9e',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(147, 107, 218, 0.15)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(147, 107, 218, 0.08)';
              e.currentTarget.style.color = '#8b8b9e';
            }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Alerts bell */}
          <Link href="/alerts" style={{ position: 'relative', textDecoration: 'none' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(147, 107, 218, 0.08)',
                border: '1px solid rgba(147, 107, 218, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: '#8b8b9e',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(147, 107, 218, 0.15)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(147, 107, 218, 0.08)';
                e.currentTarget.style.color = '#8b8b9e';
              }}
            >
              <BellIcon />
            </div>
            {alertCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 5px',
                borderRadius: '999px',
                minWidth: '18px',
                textAlign: 'center',
                lineHeight: '1',
              }}>
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(0, 255, 212, 0.15) 0%, rgba(147, 107, 218, 0.15) 100%)',
            border: '1px solid rgba(0, 255, 212, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00FFD4',
            fontWeight: '600',
            fontSize: '14px',
          }}>
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </div>
  );
}
