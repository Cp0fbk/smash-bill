'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatVnd } from '@smash-bill/shared';
import { Check } from 'lucide-react';
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

const SESSION_COST_VND = 265_000;

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
      <Card aria-label="Tổng quan chi phí buổi đánh">
        <CardContent className="grid grid-cols-3 gap-3 p-4 sm:p-5">
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
        </CardContent>
      </Card>

      {/* 1-Touch Attendance List */}
      <Card aria-labelledby="attendance-heading">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle id="attendance-heading">
            Điểm danh buổi đánh ({presentCount}/{players.length})
          </CardTitle>
          <span className="text-xs text-muted-foreground">Chạm để điểm danh</span>
        </CardHeader>

        <CardContent>
          <ul className="space-y-2">
            {players.map((player) => {
              const share = player.present ? perPlayerShare : 0;

              return (
                <li key={player.id}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={player.present}
                    onClick={() => toggleAttendance(player.id)}
                    className={cn(
                      'flex min-h-[52px] w-full cursor-pointer items-center justify-between rounded-tile border px-3.5 py-2.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]',
                      player.present
                        ? 'border-border bg-card hover:bg-secondary/50'
                        : 'border-border bg-secondary/50 opacity-70',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-md',
                          player.present
                            ? 'bg-success text-on-success'
                            : 'border border-border bg-card text-transparent',
                        )}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                      </span>
                      <div>
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            player.present
                              ? 'text-card-foreground'
                              : 'text-muted-foreground line-through',
                          )}
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
        </CardContent>

        <CardFooter className="flex-col gap-2.5 sm:flex-row">
          <Button asChild className="w-full flex-1">
            <Link href="/pay/saomai-t5">Xem bill &amp; Mã VietQR thu tiền</Link>
          </Button>

          <Button variant="secondary" onClick={copyPayLink} className="w-full sm:w-auto">
            {copiedLink ? 'Đã chép link /pay' : 'Chép link gửi Zalo'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
