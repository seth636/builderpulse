import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Portal — Home Builder Marketers',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {children}
    </div>
  );
}
