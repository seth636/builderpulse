'use client';

import { useSession } from 'next-auth/react';

interface TopBarProps {
  title: string;
  children?: React.ReactNode;
}

export default function TopBar({ title, children }: TopBarProps) {
  const { data: session } = useSession();

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-4">
          {children}
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </div>
  );
}
