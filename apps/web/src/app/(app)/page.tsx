'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ClubRole, type ClubSummary, formatVnd } from '@smash-bill/shared';
import { Calendar, Plus, ShoppingBag, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMyClubs } from '../../lib/api-client';
import { useCurrentUser } from '../../lib/auth-context';

function getRoleBadge(role: ClubRole): {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
} {
  switch (role) {
    case 'HOST':
      return { label: 'Chủ CLB', variant: 'soft' };
    case 'MEMBER':
      return { label: 'Thành viên', variant: 'success' };
    case 'GUEST':
      return { label: 'Khách', variant: 'warning' };
  }
}

export default function HomePage() {
  const { user, loading: authLoading } = useCurrentUser();
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setClubs([]);
      setError(null);
      setLoadingClubs(false);
      return;
    }

    let active = true;
    setLoadingClubs(true);
    fetchMyClubs()
      .then((items) => {
        if (active) {
          setClubs(items);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Không thể tải dữ liệu CLB. Vui lòng thử lại.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoadingClubs(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  return (
    <div className="space-y-6">
      {/* Welcome / Role-Aware Header */}
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <Badge variant="soft">Tổng quan SmashBill</Badge>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
              {user ? `Xin chào, ${user.name}` : 'Chào mừng đến với SmashBill'}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Quản lý câu lạc bộ cố định, thành viên QR và tài khoản nhận tiền VietQR.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild variant="secondary">
              <Link href="/matches">
                <Calendar aria-hidden="true" />
                <span>Kèo giao lưu</span>
              </Link>
            </Button>
            <Button asChild>
              <Link href="/clubs/new">
                <Plus aria-hidden="true" />
                <span>Tạo CLB mới</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      {/* Real Clubs Overview */}
      {authLoading || loadingClubs ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-block border border-border" />
          <Skeleton className="h-40 rounded-block border border-border" />
        </div>
      ) : !user ? (
        <Card className="border-dashed text-center">
          <CardContent className="p-8">
            <p className="text-sm font-bold text-card-foreground">Bạn chưa đăng nhập</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Đăng nhập bằng Google để tạo CLB và quản lý danh sách thành viên.
            </p>
            <Button asChild className="mt-4">
              <a href="/login?reauth=1">Đăng nhập Google</a>
            </Button>
          </CardContent>
        </Card>
      ) : clubs.length === 0 ? (
        <Card className="border-dashed text-center">
          <CardContent className="p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-bold text-card-foreground">
              Bạn chưa có câu lạc bộ nào
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
              Khởi tạo CLB đầu tiên để tạo mã QR mời thành viên và cấu hình VietQR nhận tiền sân.
            </p>
            <Button asChild className="mt-5">
              <Link href="/clubs/new">
                <Plus aria-hidden="true" />
                <span>Tạo CLB đầu tiên</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section aria-label="Câu lạc bộ của bạn" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-card-foreground">
              Câu lạc bộ của bạn ({clubs.length})
            </h2>
            <Button asChild variant="link" size="sm">
              <Link href="/clubs">Xem tất cả →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clubs.map((club) => {
              const badge = getRoleBadge(club.myRole);
              return (
                <Card key={club.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {club.memberCount} thành viên
                      </span>
                    </div>
                    <CardTitle className="mt-2">{club.name}</CardTitle>
                    <CardDescription className="line-clamp-1 text-xs">
                      {club.location || 'Chưa cập nhật địa điểm sân'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-tile bg-secondary/60 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">Giá sân mặc định</span>
                      <span className="font-mono font-bold text-primary tabular-nums">
                        {formatVnd(club.defaultCourtFee)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button asChild variant="secondary" size="sm" className="flex-1">
                        <Link href={`/clubs/${club.id}`}>Chi tiết</Link>
                      </Button>
                      <Button asChild variant="soft" size="sm" className="flex-1">
                        <Link href={`/clubs/${club.id}/members`}>Thành viên &amp; QR</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Navigation Pillars */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>CLB &amp; Thành viên QR</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Quản lý danh sách hội viên và chia sẻ mã QR tự ghi danh.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/clubs">Mở danh sách CLB</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Kèo giao lưu</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Tìm buổi đánh vãng lai phù hợp trình độ và khu vực.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/matches">Xem kèo giao lưu</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShoppingBag className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Chợ vợt &amp; Phụ kiện</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Trao đổi vợt, giày cầu lông trong cộng đồng xác thực SSO.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/market">Khám phá Chợ vợt</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
