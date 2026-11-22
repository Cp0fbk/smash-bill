'use client';

import { formatVnd } from '@smash-bill/shared';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { BrandLogo } from '../../../components/brand-logo';
import { ThemeToggle } from '../../../components/theme-toggle';

type PaymentStatus = 'UNPAID' | 'CLAIMED' | 'PAID';

interface MatchBillPlayer {
  id: string;
  name: string;
  code: string;
  isGuest: boolean;
  roleLabel: string;
  amountOwed: number;
  depositDeducted: number;
  status: PaymentStatus;
}

const DEMO_EXPENSES = [
  { id: 'e1', label: 'Tiền sân (2 sân × 2 tiếng)', amount: 240_000 },
  { id: 'e2', label: 'Cầu Hải Yến xanh (1 ống)', amount: 130_000 },
  { id: 'e3', label: 'Trà đá & nước suối', amount: 30_000 },
];

const INITIAL_BILL_PLAYERS: MatchBillPlayer[] = [
  {
    id: 'bp1',
    name: 'Đức Anh (Khách giao lưu)',
    code: 'DUCANH',
    isGuest: true,
    roleLabel: 'Khách giao lưu • Không cần tài khoản',
    amountOwed: 67_000,
    depositDeducted: 0,
    status: 'UNPAID',
  },
  {
    id: 'bp2',
    name: 'Trần Khánh (Khách giao lưu)',
    code: 'KHANH',
    isGuest: true,
    roleLabel: 'Khách giao lưu • Không cần tài khoản',
    amountOwed: 67_000,
    depositDeducted: 0,
    status: 'UNPAID',
  },
  {
    id: 'bp3',
    name: 'Hoàng Bảo Long',
    code: 'BAOLONG',
    isGuest: false,
    roleLabel: 'Thành viên CLB',
    amountOwed: 67_000,
    depositDeducted: 0,
    status: 'UNPAID',
  },
  {
    id: 'bp4',
    name: 'Lê Thu Hà',
    code: 'THUHA',
    isGuest: false,
    roleLabel: 'Thành viên CLB',
    amountOwed: 67_000,
    depositDeducted: 0,
    status: 'CLAIMED',
  },
  {
    id: 'bp5',
    name: 'Trần Hoàng Nam',
    code: 'HOANGNAM',
    isGuest: false,
    roleLabel: 'Thành viên CLB',
    amountOwed: 67_000,
    depositDeducted: 0,
    status: 'PAID',
  },
  {
    id: 'bp6',
    name: 'Nguyễn Minh Quân',
    code: 'MINHQUAN',
    isGuest: false,
    roleLabel: 'Chủ sân / Host',
    amountOwed: 67_000,
    depositDeducted: 0,
    status: 'PAID',
  },
];

const HOST_BANK = {
  shortName: 'Vietcombank',
  bin: '970436',
  accountNo: '0071001234567',
  accountName: 'NGUYEN MINH QUAN',
};

function getStatusBadge(status: PaymentStatus): { label: string; className: string } {
  switch (status) {
    case 'PAID':
      return {
        label: 'Đã thanh toán',
        className: 'bg-success-soft text-on-success-soft border-success/30',
      };
    case 'CLAIMED':
      return {
        label: 'Chờ chủ sân xác nhận',
        className: 'bg-primary-soft text-primary border-border-strong/30',
      };
    case 'UNPAID':
      return {
        label: 'Chưa thanh toán',
        className: 'bg-warning-soft text-on-warning-soft border-warning/30',
      };
  }
}

export default function PublicMatchPayPage() {
  const params = useParams<{ matchToken: string }>();
  const matchToken = params?.matchToken ?? 'saomai-t5';

  const [players, setPlayers] = useState<MatchBillPlayer[]>(INITIAL_BILL_PLAYERS);
  const [selectedId, setSelectedId] = useState<string>('bp1');
  const [copiedField, setCopiedField] = useState<'account' | 'syntax' | 'link' | null>(null);

  const totalCost = DEMO_EXPENSES.reduce((sum, item) => sum + item.amount, 0);
  const perPlayerShare = Math.ceil(totalCost / players.length / 1000) * 1000;
  const fundSurplus = Math.max(0, perPlayerShare * players.length - totalCost);

  const selectedPlayer = players.find((p) => p.id === selectedId) ?? players[0];
  const amountToPay = Math.max(
    0,
    (selectedPlayer?.amountOwed ?? perPlayerShare) - (selectedPlayer?.depositDeducted ?? 0),
  );
  const transferSyntax = `SB SAOMAI ${selectedPlayer?.code ?? 'KHACH'} 1126`;
  const vietQrUrl = `https://img.vietqr.io/image/${HOST_BANK.bin}-${HOST_BANK.accountNo}-compact2.png?amount=${amountToPay}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=${encodeURIComponent(HOST_BANK.accountName)}`;

  async function copyText(text: string, field: 'account' | 'syntax' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      // Ignore clipboard error
    }
  }

  function handleClaimTransferred(playerId: string) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId && p.status === 'UNPAID' ? { ...p, status: 'CLAIMED' } : p,
      ),
    );
  }

  const paidOrClaimedCount = players.filter((p) => p.status !== 'UNPAID').length;

  return (
    <div className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6 lg:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Clean Public Top Bar (No Login Required) */}
        <header className="flex items-center justify-between rounded-block border border-border bg-card px-4 py-3 shadow-block sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-1.5 shadow-tile">
              <BrandLogo alt="SmashBill" size={30} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-card-foreground">
                  Smash<span className="text-primary">Bill</span>
                </span>
                <span className="rounded-pill bg-accent-qr-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-on-accent-qr">
                  Bill buổi đánh • Không cần đăng nhập
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Mã bill: <span className="font-mono">{matchToken}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                copyText(
                  typeof window !== 'undefined' ? window.location.href : `/pay/${matchToken}`,
                  'link',
                )
              }
              className="hidden min-h-[40px] cursor-pointer items-center gap-1.5 rounded-tile border border-border bg-secondary/70 px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary sm:inline-flex"
            >
              <span>{copiedField === 'link' ? 'Đã chép link bill' : 'Chép link gửi Zalo'}</span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Match Summary & Cost Breakdown Header */}
        <section
          aria-labelledby="public-bill-heading"
          className="rounded-block border border-border bg-card p-5 shadow-block sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                Buổi đánh đã chốt sổ • 6 người tham gia
              </span>
              <h1
                id="public-bill-heading"
                className="mt-2 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl"
              >
                Giao lưu tối Thứ 5 • Sân Cầu Lông Sao Mai
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Sân Sao Mai, Quận Phú Nhuận, TP.HCM • Chủ sân: Nguyễn Minh Quân
              </p>
            </div>

            <div className="rounded-tile bg-primary-soft px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-medium text-primary">Mỗi người đóng (làm tròn 1.000 ₫)</p>
              <p className="mt-0.5 font-mono text-2xl font-extrabold text-primary tabular-nums">
                {formatVnd(perPlayerShare)}
              </p>
            </div>
          </div>

          {/* Transparent Expense Breakdown */}
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-4">
            {DEMO_EXPENSES.map((exp) => (
              <div key={exp.id} className="rounded-tile bg-secondary/60 p-3">
                <p className="text-[11px] text-muted-foreground">{exp.label}</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-card-foreground tabular-nums">
                  {formatVnd(exp.amount)}
                </p>
              </div>
            ))}
            <div className="rounded-tile bg-success-soft p-3">
              <p className="text-[11px] text-on-success-soft">
                Tổng chi ({formatVnd(totalCost)}) • Dư quỹ
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-success tabular-nums">
                +{formatVnd(fundSurplus)}
              </p>
            </div>
          </div>
        </section>

        {/* Master-Detail: Left Player Selector (7 cols) + Right Instant VietQR Checkout (5 cols) */}
        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Step 1 — Tap Your Name */}
          <section
            aria-labelledby="select-player-heading"
            className="rounded-block border border-border bg-card p-5 shadow-block sm:p-6 lg:col-span-7"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 id="select-player-heading" className="text-base font-bold text-card-foreground">
                  1. Chọn tên của bạn để lấy mã VietQR
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Chạm vào đúng tên của bạn trong danh sách điểm danh dưới đây.
                </p>
              </div>
              <span className="rounded-pill bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-card-foreground tabular-nums">
                {paidOrClaimedCount}/{players.length} đã đóng
              </span>
            </div>

            <ul className="mt-4 space-y-2.5">
              {players.map((player) => {
                const isSelected = player.id === selectedPlayer?.id;
                const badge = getStatusBadge(player.status);

                return (
                  <li key={player.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(player.id)}
                      className={`flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-3 rounded-tile border px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation] ${
                        isSelected
                          ? 'border-border-strong bg-primary-soft/70 shadow-tile'
                          : 'border-border bg-card hover:bg-secondary/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-bold text-card-foreground">
                            {player.name}
                          </span>
                          {player.isGuest && (
                            <span className="rounded-pill bg-accent-qr-soft px-2 py-0.5 text-[10px] font-semibold text-on-accent-qr">
                              Khách vãng lai
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{player.roleLabel}</p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-mono text-sm font-extrabold text-primary tabular-nums">
                          {formatVnd(player.amountOwed)}
                        </span>
                        <span
                          className={`inline-flex rounded-pill border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Right: Step 2 — Scan VietQR & Confirm */}
          <aside className="lg:col-span-5">
            <section
              aria-labelledby="guest-vietqr-heading"
              className="rounded-block border border-border bg-card p-5 shadow-block sm:p-6 lg:sticky lg:top-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    2. Mã VietQR cá nhân
                  </p>
                  <h2
                    id="guest-vietqr-heading"
                    className="text-base font-bold text-card-foreground"
                  >
                    {selectedPlayer?.name}
                  </h2>
                </div>
                <span className="rounded-pill bg-accent-qr-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-on-accent-qr">
                  {HOST_BANK.shortName}
                </span>
              </div>

              {selectedPlayer?.status === 'PAID' ? (
                <div className="mt-4 rounded-tile border border-success/30 bg-success-soft p-6 text-center">
                  <p className="text-base font-bold text-on-success-soft">
                    Đã thanh toán đủ {formatVnd(selectedPlayer.amountOwed)}
                  </p>
                  <p className="mt-1 text-xs text-on-success-soft/80">
                    Chủ sân đã xác nhận khoản chuyển khoản của bạn. Cảm ơn bạn đã tham gia buổi
                    đánh!
                  </p>
                </div>
              ) : (
                <>
                  {/* Pure White Quiet-Zone QR Container */}
                  <div className="mt-4 flex flex-col items-center rounded-tile bg-secondary/60 p-5">
                    <div className="flex h-52 w-52 items-center justify-center rounded-tile border border-border bg-white p-3 shadow-tile">
                      <img
                        src={vietQrUrl}
                        alt={`VietQR thanh toán cho ${selectedPlayer?.name}`}
                        width={192}
                        height={192}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <p className="mt-4 font-mono text-2xl font-extrabold text-primary tabular-nums">
                      {formatVnd(amountToPay)}
                    </p>
                    <p className="mt-1 font-mono text-xs font-semibold text-card-foreground">
                      {HOST_BANK.shortName} • {HOST_BANK.accountNo}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {HOST_BANK.accountName}
                    </p>
                  </div>

                  {/* 1-Tap Copy Helpers for Mobile Banking Apps */}
                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => copyText(HOST_BANK.accountNo, 'account')}
                      className="flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-tile border border-border bg-secondary/70 px-3.5 py-2 text-xs transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
                    >
                      <span className="text-muted-foreground">
                        STK:{' '}
                        <strong className="font-mono text-card-foreground">
                          {HOST_BANK.accountNo}
                        </strong>
                      </span>
                      <span className="font-semibold text-primary">
                        {copiedField === 'account' ? 'Đã chép STK' : 'Chép STK'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText(transferSyntax, 'syntax')}
                      className="flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-tile border border-border bg-secondary/70 px-3.5 py-2 text-xs transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
                    >
                      <span className="text-muted-foreground">
                        Nội dung:{' '}
                        <strong className="font-mono text-card-foreground">{transferSyntax}</strong>
                      </span>
                      <span className="font-semibold text-primary">
                        {copiedField === 'syntax' ? 'Đã chép nội dung' : 'Chép nội dung'}
                      </span>
                    </button>
                  </div>

                  {/* Self-Claim Action for Guests Without Accounts */}
                  <div className="mt-4">
                    {selectedPlayer?.status === 'CLAIMED' ? (
                      <output className="block w-full rounded-tile border border-primary/30 bg-primary-soft px-4 py-3 text-center text-xs font-semibold text-primary">
                        Đã báo chuyển khoản • Đang chờ chủ sân xác nhận
                      </output>
                    ) : (
                      <button
                        type="button"
                        onClick={() => selectedPlayer && handleClaimTransferred(selectedPlayer.id)}
                        className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-tile bg-primary px-5 py-3 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
                      >
                        <svg
                          aria-hidden="true"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        <span>Tôi đã chuyển khoản {formatVnd(amountToPay)}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
