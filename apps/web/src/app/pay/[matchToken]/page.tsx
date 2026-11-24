'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatVnd } from '@smash-bill/shared';
import { Check } from 'lucide-react';
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

function getStatusBadge(status: PaymentStatus): {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
} {
  switch (status) {
    case 'PAID':
      return { label: 'Đã thanh toán', variant: 'success' };
    case 'CLAIMED':
      return { label: 'Chờ chủ sân xác nhận', variant: 'soft' };
    case 'UNPAID':
      return { label: 'Chưa thanh toán', variant: 'warning' };
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
        <Card className="px-4 py-3 sm:px-5">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-1.5 shadow-tile">
                <BrandLogo alt="SmashBill" size={30} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-card-foreground">
                    Smash<span className="text-primary">Bill</span>
                  </span>
                  <Badge variant="info" className="font-mono text-[11px]">
                    Bill buổi đánh • Không cần đăng nhập
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mã bill: <span className="font-mono">{matchToken}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  copyText(
                    typeof window !== 'undefined' ? window.location.href : `/pay/${matchToken}`,
                    'link',
                  )
                }
                className="hidden sm:inline-flex"
              >
                {copiedField === 'link' ? 'Đã chép link bill' : 'Chép link gửi Zalo'}
              </Button>
              <ThemeToggle />
            </div>
          </header>
        </Card>

        {/* Match Summary & Cost Breakdown Header */}
        <Card aria-labelledby="public-bill-heading">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <Badge variant="soft">Buổi đánh đã chốt sổ • 6 người tham gia</Badge>
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
                <p className="text-xs font-medium text-primary">
                  Mỗi người đóng (làm tròn 1.000 ₫)
                </p>
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
          </CardContent>
        </Card>

        {/* Master-Detail: Left Player Selector (7 cols) + Right Instant VietQR Checkout (5 cols) */}
        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Step 1 — Tap Your Name */}
          <Card aria-labelledby="select-player-heading" className="lg:col-span-7">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle id="select-player-heading">
                  1. Chọn tên của bạn để lấy mã VietQR
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Chạm vào đúng tên của bạn trong danh sách điểm danh dưới đây.
                </p>
              </div>
              <Badge variant="secondary" className="font-mono tabular-nums">
                {paidOrClaimedCount}/{players.length} đã đóng
              </Badge>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2.5">
                {players.map((player) => {
                  const isSelected = player.id === selectedPlayer?.id;
                  const badge = getStatusBadge(player.status);

                  return (
                    <li key={player.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedId(player.id)}
                        className={cn(
                          'flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-3 rounded-tile border px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]',
                          isSelected
                            ? 'border-border-strong bg-primary-soft/70 shadow-tile'
                            : 'border-border bg-card hover:bg-secondary/60',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-bold text-card-foreground">
                              {player.name}
                            </span>
                            {player.isGuest && (
                              <Badge variant="info" className="px-2 text-[10px]">
                                Khách vãng lai
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{player.roleLabel}</p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="font-mono text-sm font-extrabold text-primary tabular-nums">
                            {formatVnd(player.amountOwed)}
                          </span>
                          <Badge variant={badge.variant} className="px-2 text-[10px]">
                            {badge.label}
                          </Badge>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Right: Step 2 — Scan VietQR & Confirm */}
          <aside className="lg:col-span-5">
            <Card aria-labelledby="guest-vietqr-heading" className="lg:sticky lg:top-6">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    2. Mã VietQR cá nhân
                  </p>
                  <CardTitle id="guest-vietqr-heading">{selectedPlayer?.name}</CardTitle>
                </div>
                <Badge variant="info" className="font-mono">
                  {HOST_BANK.shortName}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {selectedPlayer?.status === 'PAID' ? (
                  <Alert variant="success" className="p-6 text-center">
                    <p className="text-base font-bold">
                      Đã thanh toán đủ {formatVnd(selectedPlayer.amountOwed)}
                    </p>
                    <p className="mt-1 text-xs opacity-80">
                      Chủ sân đã xác nhận khoản chuyển khoản của bạn. Cảm ơn bạn đã tham gia buổi
                      đánh!
                    </p>
                  </Alert>
                ) : (
                  <>
                    {/* Pure White Quiet-Zone QR Container */}
                    <div className="flex flex-col items-center rounded-tile bg-secondary/60 p-5">
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

                    {/* 1-Tap Copy Helpers */}
                    <div className="space-y-2">
                      <Button
                        variant="secondary"
                        onClick={() => copyText(HOST_BANK.accountNo, 'account')}
                        className="w-full justify-between px-3.5 font-normal"
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
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => copyText(transferSyntax, 'syntax')}
                        className="w-full justify-between px-3.5 font-normal"
                      >
                        <span className="text-muted-foreground">
                          Nội dung:{' '}
                          <strong className="font-mono text-card-foreground">
                            {transferSyntax}
                          </strong>
                        </span>
                        <span className="font-semibold text-primary">
                          {copiedField === 'syntax' ? 'Đã chép nội dung' : 'Chép nội dung'}
                        </span>
                      </Button>
                    </div>

                    {/* Self-Claim Action */}
                    <div>
                      {selectedPlayer?.status === 'CLAIMED' ? (
                        <Alert variant="info" className="text-center">
                          <AlertDescription className="font-semibold">
                            Đã báo chuyển khoản • Đang chờ chủ sân xác nhận
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button
                          size="lg"
                          onClick={() =>
                            selectedPlayer && handleClaimTransferred(selectedPlayer.id)
                          }
                          className="w-full"
                        >
                          <Check className="stroke-[2.5]" aria-hidden="true" />
                          <span>Tôi đã chuyển khoản {formatVnd(amountToPay)}</span>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>
    </div>
  );
}
