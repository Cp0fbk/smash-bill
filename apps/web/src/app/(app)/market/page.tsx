'use client';

import Link from 'next/link';

export default function MarketPage() {
  return (
    <section
      aria-labelledby="market-heading"
      className="rounded-block border border-border bg-card p-6 shadow-block sm:p-8"
    >
      <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
        Chợ thiết bị cầu lông
      </span>
      <h1 id="market-heading" className="mt-2 text-xl font-bold text-card-foreground sm:text-2xl">
        Trao đổi Vợt, Giày &amp; Phụ kiện Cầu Lông
      </h1>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        Kết nối cộng đồng người chơi xác thực qua SSO, gắn liền hồ sơ uy tín chống scam.
      </p>
      <div className="mt-5">
        <Link
          href="/clubs"
          className="inline-flex min-h-[44px] items-center rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-tile hover:bg-primary-hover"
        >
          Xem CLB &amp; Hồ sơ uy tín
        </Link>
      </div>
    </section>
  );
}
