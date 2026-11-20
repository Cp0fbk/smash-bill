'use client';

import { useState } from 'react';
import { BrandLogo } from '../../components/brand-logo';
import { ThemeToggle } from '../../components/theme-toggle';
import { UserSessionBar } from '../../components/user-session-bar';

interface CourtPlayer {
  id: string;
  name: string;
  code: string;
  roleLabel: string;
  present: boolean;
}

const INITIAL_PLAYERS: CourtPlayer[] = [
  { id: 'p1', name: 'Nguyễn Quang Minh', code: 'MINH', roleLabel: 'Chủ CLB', present: true },
  { id: 'p2', name: 'Lê Hoàng', code: 'HOANG', roleLabel: 'Cố định', present: true },
  { id: 'p3', name: 'Phạm Thảo', code: 'THAO', roleLabel: 'Cố định', present: true },
  { id: 'p4', name: 'Trần Khánh', code: 'KHANH', roleLabel: 'Vãng lai', present: true },
  { id: 'p5', name: 'Vũ Đức', code: 'DUC', roleLabel: 'Cố định', present: false },
];

const SESSION_COST_VND = 265000;

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, amount))} ₫`;
}

export default function HomePage() {
  const [players, setPlayers] = useState<CourtPlayer[]>(INITIAL_PLAYERS);
  const [selectedId, setSelectedId] = useState<string>('p1');
  const [copied, setCopied] = useState(false);

  const presentCount = players.filter((p) => p.present).length;
  const perPlayerShare =
    presentCount > 0 ? Math.ceil(SESSION_COST_VND / presentCount / 1000) * 1000 : 0;
  const clubFundSurplus = Math.max(0, perPlayerShare * presentCount - SESSION_COST_VND);

  const selectedPlayer = players.find((p) => p.id === selectedId) ?? players[0];
  const selectedDue = selectedPlayer?.present ? perPlayerShare : 0;
  const transferSyntax = `SB SAOMAI ${selectedPlayer?.code ?? 'MINH'}`;
  const vietQrUrl = `https://img.vietqr.io/image/970436-0071000888999-compact2.png?amount=${selectedDue}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=${encodeURIComponent('NGUYEN QUANG MINH')}`;

  function toggleAttendance(id: string) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, present: !p.present } : p)));
    setSelectedId(id);
  }

  async function copySyntax() {
    try {
      await navigator.clipboard.writeText(transferSyntax);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Minimal Header */}
      <header className="flex flex-col gap-2.5 rounded-block border border-border bg-card px-4 py-3 shadow-block sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-1.5 shadow-tile sm:h-10 sm:w-10">
              <BrandLogo alt="SmashBill" size={30} />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-base font-bold tracking-tight text-card-foreground">
                Smash<span className="text-primary">Bill</span>
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                CLB Sao Mai
              </span>
            </div>
          </div>

          <div className="shrink-0 sm:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-2.5 sm:border-t-0 sm:pt-0">
          <div className="hidden shrink-0 sm:block">
            <ThemeToggle />
          </div>
          <UserSessionBar />
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: KPI Summary & 1-Touch Attendance */}
        <div className="space-y-6 lg:col-span-7">
          {/* 3 Compact KPI Cards */}
          <section
            aria-label="Tổng quan buổi đánh"
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
              <p className="text-xs font-medium text-on-success-soft">Quỹ CLB</p>
              <p className="mt-1 font-mono text-base font-bold text-success tabular-nums sm:text-lg">
                +{formatVnd(clubFundSurplus)}
              </p>
            </div>
          </section>

          {/* Attendance List */}
          <section
            aria-labelledby="attendance-heading"
            className="rounded-block border border-border bg-card p-5 shadow-block"
          >
            <div className="flex items-center justify-between">
              <h2 id="attendance-heading" className="text-base font-bold text-card-foreground">
                Điểm danh ({presentCount}/{players.length})
              </h2>
              <span className="text-xs text-muted-foreground">Chạm để điểm danh</span>
            </div>

            <ul className="mt-4 space-y-2">
              {players.map((player) => {
                const share = player.present ? perPlayerShare : 0;
                const isSelected = player.id === selectedPlayer?.id;

                return (
                  <li key={player.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={player.present}
                      onClick={() => toggleAttendance(player.id)}
                      className={`flex min-h-[52px] flex-1 cursor-pointer items-center justify-between rounded-tile border px-3.5 py-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation] ${
                        player.present
                          ? isSelected
                            ? 'border-border-strong bg-primary-soft/60'
                            : 'border-border bg-card hover:bg-secondary/50'
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

                    <button
                      type="button"
                      onClick={() => setSelectedId(player.id)}
                      aria-label={`Mã QR ${player.name}`}
                      className={`min-h-[52px] cursor-pointer rounded-tile border px-3 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation] ${
                        isSelected
                          ? 'border-border-strong bg-primary text-on-primary'
                          : 'border-border bg-secondary/70 text-secondary-foreground hover:bg-secondary'
                      }`}
                    >
                      QR
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Right: Clean VietQR Card */}
        <div className="lg:col-span-5">
          <section
            aria-labelledby="qr-heading"
            className="rounded-block border border-border bg-card p-5 shadow-block"
          >
            <div className="flex items-center justify-between">
              <h2 id="qr-heading" className="text-base font-bold text-card-foreground">
                {selectedPlayer?.name}
              </h2>
              <span className="rounded-pill bg-accent-qr-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-on-accent-qr">
                VietQR
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center rounded-tile bg-secondary/60 p-5">
              <div className="flex h-48 w-48 items-center justify-center rounded-tile border border-border bg-white p-2.5 shadow-tile">
                <img
                  src={vietQrUrl}
                  alt={`VietQR ${selectedPlayer?.name}`}
                  width={180}
                  height={180}
                  className="h-full w-full object-contain"
                />
              </div>

              <p className="mt-4 font-mono text-2xl font-bold text-primary tabular-nums">
                {formatVnd(selectedDue)}
              </p>
            </div>

            <button
              type="button"
              onClick={copySyntax}
              className="mt-4 flex min-h-[46px] w-full cursor-pointer items-center justify-between rounded-tile border border-border bg-secondary/70 px-3.5 py-2.5 text-xs transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
            >
              <span className="font-mono font-semibold text-card-foreground">{transferSyntax}</span>
              <span className="font-semibold text-primary">{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
