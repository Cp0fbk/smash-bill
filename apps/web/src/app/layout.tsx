import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmashBill | Badminton Club Attendance & VietQR Billing',
  description:
    'Single-player Micro-SaaS PWA for Badminton club admins: 1-touch attendance, automatic court & shuttlecock fee splitting, and instant VietQR checkout.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmashBill',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
