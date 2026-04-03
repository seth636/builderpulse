import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BuilderPulse - Client Analytics Dashboard',
  description: 'HBM Client Analytics Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`} style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
        <SessionProvider session={null}>{children}</SessionProvider>
      </body>
    </html>
  );
}
