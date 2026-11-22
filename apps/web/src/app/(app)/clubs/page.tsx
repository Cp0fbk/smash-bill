'use client';

import { type ClubRole, type ClubSummary, formatVnd } from '@smash-bill/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMyClubs } from '../../../lib/api-client';
import { useClubPermissions, useCurrentUser } from '../../../lib/auth-context';

function getRoleBadge(role: ClubRole): { label: string; className: string } {
  switch (role) {
    case 'HOST':
      return {
        label: 'Chủ CLB • HOST',
        className: 'bg-primary-soft text-primary border-border-strong/30',
      };
    case 'MEMBER':
      return {
        label: 'Thành viên • MEMBER',
        className: 'bg-success-soft text-on-success-soft border-success/30',
      };
    case 'GUEST':
      return {
        label: 'Khách • GUEST',
        className: 'bg-warning-soft text-on-warning-soft border-warning/30',
      };
  }
}

export default function ClubsPage() {
  const { user } = useCurrentUser();
  const { isPlatformAdmin } = useClubPermissions();
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
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
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header & Create Club CTA */}
      <section
        aria-labelledby="clubs-page-heading"
        className="flex flex-col justify-between gap-4 rounded-block border border-border bg-card p-5 shadow-block sm:flex-row sm:items-center sm:p-6"
      >
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
            <Link
              href="/admin"
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-tile border border-border-strong bg-primary-soft px-4 py-2.5 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
            >
              <span>Quản trị hệ thống (ADMIN)</span>
            </Link>
          )}

          <Link
            href="/clubs/new"
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
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
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            <span>Tạo CLB mới</span>
          </Link>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="rounded-tile border border-destructive/30 bg-destructive-soft px-4 py-3 text-xs font-semibold text-destructive"
        >
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div
          aria-label="Đang tải danh sách CLB"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-56 animate-pulse rounded-block border border-border bg-card p-5 shadow-block motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        /* Empty State for First-Time Admins */
        <section
          aria-labelledby="empty-clubs-heading"
          className="rounded-block border border-dashed border-border-strong/50 bg-card p-8 text-center shadow-block sm:p-10"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <svg
              aria-hidden="true"
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <h2 id="empty-clubs-heading" className="mt-4 text-lg font-bold text-card-foreground">
            Bạn chưa tham gia hoặc tạo CLB nào
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-muted-foreground sm:text-sm">
            Khởi tạo CLB cầu lông của bạn trong chưa đầy 30 giây. Thành viên không cần tạo tài khoản
            vẫn được điểm danh và nhận mã VietQR chia tiền sân.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/clubs/new"
              className="inline-flex min-h-[46px] cursor-pointer items-center gap-2 rounded-tile bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-cta transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
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
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              <span>Tạo CLB đầu tiên</span>
            </Link>
          </div>
        </section>
      ) : (
        /* Responsive Bento Card Grid (grid-cols-1 md:grid-cols-2 xl:grid-cols-3) */
        <section
          aria-label="Danh sách CLB"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {clubs.map((club) => {
            const badge = getRoleBadge(club.myRole);
            const canManageClub = club.myRole === 'HOST';

            return (
              <article
                key={club.id}
                className="flex flex-col justify-between rounded-block border border-border bg-card p-5 shadow-block transition-colors duration-200 hover:border-border-strong/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="rounded-pill bg-secondary px-2.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                      #{club.inviteCode}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-card-foreground">{club.name}</h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {club.location || club.description || 'Chưa cập nhật địa điểm sân'}
                  </p>

                  {/* Key Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-tile bg-secondary/60 p-3">
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
                  <div className="mt-3 flex items-center justify-between rounded-tile border border-border px-3 py-2 text-xs">
                    <span className="font-medium text-muted-foreground">VietQR</span>
                    {club.bankBin && club.bankAccountNo ? (
                      <span className="font-mono font-semibold text-success tabular-nums">
                        {club.bankShortName || club.bankBin} • {club.bankAccountNo}
                      </span>
                    ) : (
                      <span className="font-medium text-warning">Chưa cấu hình ngân hàng</span>
                    )}
                  </div>
                </div>

                {/* Role-Gated Action Footer */}
                <div className="mt-5 flex items-center gap-2 border-t border-border pt-3.5">
                  <Link
                    href={`/clubs/${club.id}`}
                    className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-tile border border-border bg-secondary/70 px-3 py-2 text-xs font-semibold text-secondary-foreground transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
                  >
                    Chi tiết CLB
                  </Link>

                  {canManageClub && (
                    <Link
                      href={`/clubs/${club.id}/settings`}
                      className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-tile bg-primary px-3 py-2 text-xs font-semibold text-on-primary shadow-tile transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
                    >
                      <span>Cài đặt &amp; VietQR</span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* User Profile & Trust Summary Card */}
      {user && (
        <section
          aria-labelledby="profile-summary-heading"
          className="rounded-block border border-border bg-card p-5 shadow-block sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
          </div>
        </section>
      )}
    </div>
  );
}
