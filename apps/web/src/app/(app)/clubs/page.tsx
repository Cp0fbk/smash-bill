'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ClubRole, type ClubSummary, formatVnd } from '@smash-bill/shared';
import { Plus, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMyClubs } from '../../../lib/api-client';
import { useClubPermissions, useCurrentUser } from '../../../lib/auth-context';

function getRoleBadge(role: ClubRole): {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
} {
  switch (role) {
    case 'HOST':
      return { label: 'Chủ CLB • HOST', variant: 'soft' };
    case 'MEMBER':
      return { label: 'Thành viên • MEMBER', variant: 'success' };
    case 'GUEST':
      return { label: 'Khách • GUEST', variant: 'warning' };
  }
}

export default function ClubsPage() {
  const { user, loading: authLoading } = useCurrentUser();
  const { isPlatformAdmin } = useClubPermissions();
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setClubs([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
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
            err instanceof Error
              ? err.message
              : 'Không thể tải danh sách CLB. Vui lòng thử lại sau.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  return (
    <div className="space-y-6">
      {/* Page Header & Create Club CTA */}
      <Card aria-labelledby="clubs-page-heading">
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              CLB cố định (Sinh hoạt hàng tuần) &amp; Hồ sơ
            </p>
            <h1
              id="clubs-page-heading"
              className="mt-1 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl"
            >
              Câu lạc bộ cố định của tôi ({clubs.length})
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Dành cho hội đánh cố định hàng tuần: quản lý thành viên, quỹ CLB và VietQR. Nếu chỉ đi
              đánh lẻ 1 buổi với người lạ, hãy vào mục <strong>Kèo giao lưu</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isPlatformAdmin && (
              <Button asChild variant="soft">
                <Link href="/admin">Quản trị hệ thống (ADMIN)</Link>
              </Button>
            )}

            <Button asChild>
              <Link href="/clubs/new">
                <Plus aria-hidden="true" />
                <span>Tạo CLB mới</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {loading || authLoading ? (
        <div
          aria-label="Đang tải danh sách CLB"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {[1, 2, 3].map((idx) => (
            <Skeleton key={idx} className="h-56 rounded-block border border-border" />
          ))}
        </div>
      ) : !user ? (
        <Card
          aria-labelledby="guest-clubs-heading"
          className="border-dashed border-border-strong/50 text-center"
        >
          <CardContent className="p-8 sm:p-10">
            <h2 id="guest-clubs-heading" className="text-lg font-bold text-card-foreground">
              Bạn đang truy cập với tư cách Khách (Guest)
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-xs text-muted-foreground sm:text-sm">
              Khách vãng lai có thể tự ghi danh qua mã QR (/join/...) hoặc thanh toán VietQR
              (/pay/...) không cần tài khoản. Để tạo hoặc quản lý CLB cố định của bạn, vui lòng đăng
              nhập bằng Google.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild size="lg">
                <a href="/login?reauth=1&next=/clubs">Đăng nhập Google ngay</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : clubs.length === 0 ? (
        /* Empty State for First-Time Admins */
        <Card
          aria-labelledby="empty-clubs-heading"
          className="border-dashed border-border-strong/50 text-center"
        >
          <CardContent className="p-8 sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <UserPlus className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 id="empty-clubs-heading" className="mt-4 text-lg font-bold text-card-foreground">
              Bạn chưa tham gia hoặc tạo CLB nào
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-xs text-muted-foreground sm:text-sm">
              Khởi tạo CLB cầu lông của bạn trong chưa đầy 30 giây. Thành viên không cần tạo tài
              khoản vẫn được điểm danh và nhận mã VietQR chia tiền sân.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild size="lg">
                <Link href="/clubs/new">
                  <Plus aria-hidden="true" />
                  <span>Tạo CLB đầu tiên</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Responsive Bento Card Grid */
        <section
          aria-label="Danh sách CLB"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {clubs.map((club) => {
            const badge = getRoleBadge(club.myRole);
            const canManageClub = club.myRole === 'HOST';

            return (
              <Card
                key={club.id}
                className="flex flex-col justify-between transition-colors duration-200 hover:border-border-strong/50"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <Badge variant="secondary" className="font-mono text-muted-foreground">
                      #{club.inviteCode}
                    </Badge>
                  </div>

                  <CardTitle className="mt-3 text-lg">{club.name}</CardTitle>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {club.location || club.description || 'Chưa cập nhật địa điểm sân'}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 rounded-tile bg-secondary/60 p-3">
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        Giá sân mặc định
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-primary tabular-nums">
                        {formatVnd(club.defaultCourtFee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Thành viên</p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-card-foreground tabular-nums">
                        {club.memberCount} người
                      </p>
                    </div>
                  </div>

                  {/* VietQR Bank Status Pill */}
                  <div className="flex items-center justify-between rounded-tile border border-border px-3 py-2 text-xs">
                    <span className="font-medium text-muted-foreground">VietQR</span>
                    {club.bankBin && club.bankAccountNo ? (
                      <span className="font-mono font-semibold text-success tabular-nums">
                        {club.bankShortName || club.bankBin} • {club.bankAccountNo}
                      </span>
                    ) : (
                      <span className="font-medium text-warning">Chưa cấu hình ngân hàng</span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="gap-2">
                  <Button asChild variant="secondary" className="flex-1 px-3">
                    <Link href={`/clubs/${club.id}`}>Chi tiết</Link>
                  </Button>

                  <Button asChild variant="soft" className="flex-1 px-3">
                    <Link href={`/clubs/${club.id}/members`}>Thành viên &amp; QR</Link>
                  </Button>

                  {canManageClub && (
                    <Button asChild className="flex-1 px-3">
                      <Link href={`/clubs/${club.id}/settings`}>VietQR</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </section>
      )}

      {/* User Profile & Trust Summary Card */}
      {user && (
        <Card aria-labelledby="profile-summary-heading">
          <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 id="profile-summary-heading" className="text-base font-bold text-card-foreground">
                Hồ sơ người chơi • {user.name}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {user.email || `${user.provider} SSO`} • Vai trò hệ thống:{' '}
                <span className="font-mono font-semibold text-primary">{user.role}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-tile bg-secondary/70 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Trình độ</p>
                <p className="mt-0.5 font-mono text-xs font-bold text-card-foreground">
                  {user.skillLevel || 'TB'}
                </p>
              </div>
              <div className="rounded-tile bg-success-soft px-3 py-2">
                <p className="text-[11px] text-on-success-soft">Số trận</p>
                <p className="mt-0.5 font-mono text-xs font-bold text-success tabular-nums">
                  {user.totalMatches}
                </p>
              </div>
              <div className="rounded-tile bg-secondary/70 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Uy tín</p>
                <p className="mt-0.5 font-mono text-xs font-bold text-card-foreground tabular-nums">
                  +{user.thumbsUp} / -{user.flakeCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
