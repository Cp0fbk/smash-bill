'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <Card aria-labelledby="matches-heading">
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <Badge variant="soft">Kèo giao lưu &amp; Buổi đánh</Badge>
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
            <Button asChild>
              <Link href="/">Bảng điểm danh buổi đánh</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/clubs">CLB cố định của tôi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs: All / Kèo giao lưu 1 buổi / Lịch CLB hàng tuần */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as MatchFilter)}>
        <TabsList>
          <TabsTrigger value="ALL">Tất cả buổi đánh</TabsTrigger>
          <TabsTrigger value="GIAO_LUU">Kèo giao lưu (vãng lai 1 buổi)</TabsTrigger>
          <TabsTrigger value="CLUB_WEEKLY">Lịch sinh hoạt CLB (hàng tuần)</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Match Cards Grid */}
      <section
        aria-label="Danh sách kèo giao lưu và buổi đánh"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {visibleMatches.map((match) => (
          <Card key={match.id} className="flex flex-col justify-between">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={match.kind === 'GIAO_LUU' ? 'info' : 'soft'}>
                  {match.kindLabel}
                </Badge>
                <Badge variant="secondary" className="font-mono">
                  Trình độ: {match.skillRange}
                </Badge>
              </div>

              <CardTitle className="mt-3">{match.title}</CardTitle>
              <p className="text-xs font-medium text-muted-foreground">{match.clubName}</p>
              <p className="text-xs text-muted-foreground">{match.location}</p>
            </CardHeader>

            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-2.5 rounded-tile bg-secondary/60 p-3">
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
            </CardContent>

            <CardFooter className="justify-between">
              <span className="font-mono text-xs font-semibold text-success tabular-nums">
                Còn {match.openGuestSlots} slot giao lưu
              </span>
              <div className="flex items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/pay/${match.id}`}>Link QR khách</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/">Điểm danh</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}
