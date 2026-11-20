import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmashBill | Quản lý CLB Cầu Lông & Chia Tiền Sân VietQR',
  description:
    'Ứng dụng quản lý CLB cầu lông: điểm danh 1 chạm, chống bùng kèo vãng lai bằng đăng nhập xác thực, chia tiền sân + cầu làm tròn 1.000đ và thanh toán VietQR tự động.',
  icons: {
    icon: [
      { url: '/logo.jpg', media: '(prefers-color-scheme: light)' },
      { url: '/logo_dark.jpg', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/logo.jpg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SmashBill',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0060d0' },
    { media: '(prefers-color-scheme: dark)', color: '#040d1a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-on-primary">
        {children}
      </body>
    </html>
  );
}
