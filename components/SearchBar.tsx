'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
  }, [search, router, searchParams]);

  return (
    <input
      type="text"
      placeholder="Search clients..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="px-4 py-2 bg-card border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-64"
    />
  );
}
