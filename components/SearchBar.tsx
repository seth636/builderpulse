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
      style={{
        padding: '10px 16px',
        background: 'rgba(147, 107, 218, 0.08)',
        border: '1px solid rgba(147, 107, 218, 0.15)',
        borderRadius: '8px',
        color: '#FFFFFF',
        fontSize: '14px',
        width: '240px',
        outline: 'none',
        transition: 'all 0.2s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0, 255, 212, 0.4)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 255, 212, 0.1)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(147, 107, 218, 0.15)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}
