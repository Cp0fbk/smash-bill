'use client';

import { formatVnd } from '@smash-bill/shared';
import Link from 'next/link';
import { useState } from 'react';

type MatchFilter = 'ALL' | 'GIAO_LUU' | 'CLUB_WEEKLY';

interface SampleMatchCard {
  id: string;
  title: string;
  kind: 'GIAO_LUU' | 'CLUB_WEEKLY';
  kindLabel: string;
  clubName?: string;
  scheduleLabel: string;
  location: string;
  skillRange: string;
  openGuestSlots: number;
  estimatedShareVnd: number;
}

const SAMPLE_MATCHES: SampleMatchCard[] = [
  {
    id: 'm1',
    title: 'Kèo giao lưu tối Thứ 5 • Tuyển 4 vãng lai',
    kind: 'GIAO_LUU',
    kindLabel: 'Kèo giao lưu (1 buổi)',
    clubName: 'Chủ sân: Minh Quân',
    scheduleLabel: 'Thứ 5, 19:30 – 21:30',
    location: 'Sân Cầu Lông Sao Mai, Phú Nhuận, TP.HCM',
    skillRange: 'TB – TB+',
    openGuestSlots: 4,
    estimatedShareVnd: 70_000,
  },
  {
    id: 'm2',
    title: 'Buổi sinh hoạt cố định tuần này • CLB Sao Mai',
    kind: 'CLUB_WEEKLY',
    kindLabel: 'Lịch CLB hàng tuần',
    clubName: 'CLB Sao Mai',
    scheduleLabel: 'Chủ Nhật, 09:00 – 11:30',
    location: 'Sân Cầu Lông Sao Mai, Phú Nhuận, TP.HCM',
    skillRange: 'TB+ – Khá',
    openGuestSlots: 2,
    estimatedShareVnd: 67_000,
  },
  {
    id: 'm3',
    title: 'Giao lưu sáng Thứ 7 • Sân Bình Thạnh',
    kind: 'GIAO_LUU',
    kindLabel: 'Kèo giao lưu (1 buổi)',
    clubName: 'Chủ sân: Hoàng Nam',
    scheduleLabel: 'Thứ 7, 08:30 – 10:30',
    location: 'Sân Cầu Lông Chu Văn An, Bình Thạnh, TP.HCM',
    skillRange: 'TB- – TB',
    openGuestSlots: 3,
    estimatedShareVnd: 65_000,
  },
];

export default function MatchesPage() {
  const [filter, setFilter] = useState<MatchFilter>('ALL');

  const visibleMatches = SAMPLE_MATCHES.filter((item) => {
    if (filter === 'ALL') {
      return true;
    }
    return item.kind === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header distinguishing Kèo giao lưu (1 buổi) vs Buổi sinh hoạt CLB (hàng tuần) */}
      <section
        aria-labelledby="matches-heading"
        className="flex flex-col justify-between gap-4 rounded-block border border-border bg-card p-5 shadow-block sm:flex-row sm:items-center sm:p-6"
      >
        <div>
          <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
            Kèo giao lưu &amp; Buổi đánh
          </span>
          <h1
            id="matches-heading"
            className="mt-2 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl"
          >
            Kèo giao lưu vãng lai &amp; Lịch đánh hàng tuần
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Tham gia <strong>kèo giao lưu 1 buổi</strong> với hội mới, hoặc mở{' '}
            <strong>buổi đánh định kỳ</strong> cho CLB của bạn.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/"
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
          >
            Bảng điểm danh buổi đánh
          </Link>
          <Link
            href="/clubs"
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-tile border border-border bg-secondary/70 px-4 py-2.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
          >
            CLB cố định của tôi
          </Link>
        </div>
      </section>

      {/* Filter Tabs: All / Kèo giao lưu 1 buổi / Lịch CLB hàng tuần */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL' as const, label: 'Tất cả buổi đánh' },
          { id: 'GIAO_LUU' as const, label: 'Kèo giao lưu (vãng lai 1 buổi)' },
          { id: 'CLUB_WEEKLY' as const, label: 'Lịch sinh hoạt CLB (hàng tuần)' },
        ].map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(tab.id)}
              className={`min-h-[40px] cursor-pointer rounded-pill border px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation] ${
                active
                  ? 'border-border-strong bg-primary text-on-primary'
                  : 'border-border bg-card text-secondary-foreground hover:bg-secondary'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Match Cards Grid */}
      <section
        aria-label="Danh sách kèo giao lưu và buổi đánh"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {visibleMatches.map((match) => (
          <article
            key={match.id}
            className="flex flex-col justify-between rounded-block border border-border bg-card p-5 shadow-block"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${
                    match.kind === 'GIAO_LUU'
                      ? 'bg-accent-qr-soft text-on-accent-qr'
                      : 'bg-primary-soft text-primary'
                  }`}
                >
                  {match.kindLabel}
                </span>
                <span className="rounded-pill bg-secondary px-2.5 py-0.5 font-mono text-xs font-semibold text-card-foreground">
                  Trình độ: {match.skillRange}
                </span>
              </div>

              <h2 className="mt-3 text-base font-bold text-card-foreground">{match.title}</h2>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{match.clubName}</p>
              <p className="mt-1 text-xs text-muted-foreground">{match.location}</p>

              <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-tile bg-secondary/60 p-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Thời gian</p>
                  <p className="mt-0.5 text-xs font-bold text-card-foreground">
                    {match.scheduleLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Chi phí dự kiến</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-primary tabular-nums">
                    ~{formatVnd(match.estimatedShareVnd)}/người
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
              <span className="font-mono text-xs font-semibold text-success tabular-nums">
                Còn {match.openGuestSlots} slot giao lưu
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/pay/${match.id}`}
                  className="inline-flex min-h-[40px] items-center rounded-tile border border-border bg-secondary/70 px-3 py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary"
                >
                  Link QR khách
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-[40px] items-center rounded-tile bg-primary px-3.5 py-2 text-xs font-semibold text-on-primary shadow-tile hover:bg-primary-hover"
                >
                  Điểm danh
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
