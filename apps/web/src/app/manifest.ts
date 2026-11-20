import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SmashBill — Quản lý CLB Cầu Lông & Chia Tiền Sân VietQR',
    short_name: 'SmashBill',
    description:
      'Ứng dụng điểm danh sân cầu lông 1 chạm, chống bùng kèo vãng lai, tự động chia tiền sân + cầu và tạo mã thanh toán VietQR động cho cả Điện thoại và Máy tính.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0060d0',
    orientation: 'any',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
