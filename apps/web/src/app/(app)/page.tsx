'use client';

import Link from 'next/link';
import { useState } from 'react';

interface CourtPlayer {
  id: string;
  name: string;
  roleLabel: string;
  present: boolean;
}

const INITIAL_PLAYERS: CourtPlayer[] = [
  { id: 'p1', name: 'Nguyễn Quang Minh', roleLabel: 'Chủ sân / Host', present: true },
  { id: 'p2', name: 'Lê Hoàng', roleLabel: 'Cố định (CLB)', present: true },
  { id: 'p3', name: 'Phạm Thảo', roleLabel: 'Cố định (CLB)', present: true },
  { id: 'p4', name: 'Trần Khánh', roleLabel: 'Khách giao lưu', present: true },
  { id: 'p5', name: 'Vũ Đức', roleLabel: 'Cố định (CLB)', present: false },
];

const SESSION_COST_VND = 265000;

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, amount))} ₫`;
}

export default function HomePage() {
  const [players, setPlayers] = useState<CourtPlayer[]>(INITIAL_PLAYERS);
  const [copiedLink, setCopiedLink] = useState(false);

  const presentCount = players.filter((p) => p.present).length;
  const perPlayerShare =
    presentCount > 0 ? Math.ceil(SESSION_COST_VND / presentCount / 1000) * 1000 : 0;
  const clubFundSurplus = Math.max(0, perPlayerShare * presentCount - SESSION_COST_VND);

  function toggleAttendance(id: string) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, present: !p.present } : p)));
  }

  async function copyPayLink() {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await navigator.clipboard.writeText(`${origin}/pay/saomai-t5`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1600);
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* 3 Compact KPI Cards */}
      <section
        aria-label="Tổng quan chi phí buổi đánh"
        className="grid grid-cols-3 gap-3 rounded-block border border-border bg-card p-4 shadow-block sm:p-5"
      >
        <div className="rounded-tile bg-secondary/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">Tổng chi phí</p>
          <p className="mt-1 font-mono text-base font-bold text-card-foreground tabular-nums sm:text-lg">
            {formatVnd(SESSION_COST_VND)}
          </p>
        </div>

        <div className="rounded-tile bg-primary-soft p-3">
          <p className="text-xs font-medium text-primary">Mỗi người</p>
          <p className="mt-1 font-mono text-base font-bold text-primary tabular-nums sm:text-lg">
            {formatVnd(perPlayerShare)}
          </p>
        </div>

        <div className="rounded-tile bg-success-soft p-3">
          <p className="text-xs font-medium text-on-success-soft">Dư quỹ CLB</p>
          <p className="mt-1 font-mono text-base font-bold text-success tabular-nums sm:text-lg">
            +{formatVnd(clubFundSurplus)}
          </p>
        </div>
      </section>

      {/* 1-Touch Attendance List */}
      <section
        aria-labelledby="attendance-heading"
        className="rounded-block border border-border bg-card p-5 shadow-block"
      >
        <div className="flex items-center justify-between">
          <h1 id="attendance-heading" className="text-base font-bold text-card-foreground">
            Điểm danh buổi đánh ({presentCount}/{players.length})
          </h1>
          <span className="text-xs text-muted-foreground">Chạm để điểm danh</span>
        </div>

        <ul className="mt-4 space-y-2">
          {players.map((player) => {
            const share = player.present ? perPlayerShare : 0;

            return (
              <li key={player.id}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={player.present}
                  onClick={() => toggleAttendance(player.id)}
                  className={`flex min-h-[52px] w-full cursor-pointer items-center justify-between rounded-tile border px-3.5 py-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation] ${
                    player.present
                      ? 'border-border bg-card hover:bg-secondary/50'
                      : 'border-border bg-secondary/50 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 items-center justify-center rounded-md ${
                        player.present
                          ? 'bg-success text-on-success'
                          : 'border border-border bg-card text-transparent'
                      }`}
                    >
                      <svg
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          player.present
                            ? 'text-card-foreground'
                            : 'text-muted-foreground line-through'
                        }`}
                      >
                        {player.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{player.roleLabel}</p>
                    </div>
                  </div>

                  <span className="font-mono text-sm font-bold text-primary tabular-nums">
                    {formatVnd(share)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Link to Dedicated Public Payment Route (/pay/[matchToken]) */}
        <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4 sm:flex-row">
          <Link
            href="/pay/saomai-t5"
            className="flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
          >
            <span>Xem bill &amp; Mã VietQR thu tiền</span>
          </Link>

          <button
            type="button"
            onClick={copyPayLink}
            className="inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-tile border border-border bg-secondary/70 px-4 py-2.5 text-xs font-semibold text-secondary-foreground transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
          >
            <span>{copiedLink ? 'Đã chép link /pay' : 'Chép link gửi Zalo'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
