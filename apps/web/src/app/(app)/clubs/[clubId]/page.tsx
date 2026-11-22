'use client';

import { type ClubDetail, formatVnd, toTransferSyntax } from '@smash-bill/shared';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiClientError, fetchClubById } from '../../../../lib/api-client';
import { useClubPermissions } from '../../../../lib/auth-context';

export default function ClubDetailPage() {
  const params = useParams<{ clubId: string }>();
  const clubId = params?.clubId ?? '';

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const { canManageClub } = useClubPermissions(club?.myRole);

  useEffect(() => {
    if (!clubId) {
      return;
    }
    let active = true;

    fetchClubById(clubId)
      .then((detail) => {
        if (active) {
          setClub(detail);
          setNotFound(false);
        }
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        if (err instanceof ApiClientError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Không thể tải thông tin CLB.');
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
  }, [clubId]);

  async function copyInviteCode() {
    if (!club) {
      return;
    }
    try {
      await navigator.clipboard.writeText(club.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1600);
    } catch {
      // Ignore clipboard error
    }
  }

  if (loading) {
    return (
      <div
        aria-label="Đang tải thông tin CLB"
        className="h-64 animate-pulse rounded-block border border-border bg-card p-6 shadow-block motion-reduce:animate-none"
      />
    );
  }

  if (notFound || !club) {
    return (
      <section
        role="alert"
        className="mx-auto my-8 max-w-lg rounded-block border border-border bg-card p-6 text-center shadow-block sm:p-8"
      >
        <h1 className="text-lg font-bold text-card-foreground">404 • Không tìm thấy câu lạc bộ</h1>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          {error || 'CLB không tồn tại hoặc bạn chưa phải là thành viên của CLB này.'}
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/clubs"
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-tile bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover"
          >
            Quay lại danh sách CLB
          </Link>
        </div>
      </section>
    );
  }

  const sampleSyntax = toTransferSyntax(`SB ${club.slug.replace(/-/g, '')} QUY CLB`);
  const sampleAmount = club.defaultCourtFee > 0 ? club.defaultCourtFee : 240_000;
  const qrPreviewUrl =
    club.bankBin && club.bankAccountNo
      ? `https://img.vietqr.io/image/${club.bankBin}-${club.bankAccountNo}-compact2.png?amount=${sampleAmount}&addInfo=${encodeURIComponent(sampleSyntax)}&accountName=${encodeURIComponent(club.bankAccountName || '')}`
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 rounded-block border border-border bg-card p-5 shadow-block sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/clubs"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              ← Danh sách CLB
            </Link>
            <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
              Vai trò: {club.myRole}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
            {club.name}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {club.location || 'Chưa cập nhật địa điểm sân'}
          </p>
        </div>

        {canManageClub && (
          <Link
            href={`/clubs/${club.id}/settings`}
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
          >
            <span>Cài đặt CLB &amp; VietQR</span>
          </Link>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Club Metrics & Invite Info */}
        <div className="space-y-6 lg:col-span-7">
          <section
            aria-label="Thông số CLB"
            className="grid grid-cols-2 gap-3 rounded-block border border-border bg-card p-5 shadow-block sm:grid-cols-3"
          >
            <div className="rounded-tile bg-secondary/70 p-3.5">
              <p className="text-xs text-muted-foreground">Giá sân mặc định</p>
              <p className="mt-1 font-mono text-base font-bold text-primary tabular-nums">
                {formatVnd(club.defaultCourtFee)}
              </p>
            </div>
            <div className="rounded-tile bg-secondary/70 p-3.5">
              <p className="text-xs text-muted-foreground">Thành viên</p>
              <p className="mt-1 font-mono text-base font-bold text-card-foreground tabular-nums">
                {club.memberCount} người
              </p>
            </div>
            <div className="col-span-2 rounded-tile bg-primary-soft p-3.5 sm:col-span-1">
              <p className="text-xs text-primary">Mã mời CLB</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-base font-bold text-primary">
                  {club.inviteCode}
                </span>
                <button
                  type="button"
                  onClick={copyInviteCode}
                  className="cursor-pointer rounded-pill bg-card px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-tile"
                >
                  {copiedCode ? 'Đã chép' : 'Chép'}
                </button>
              </div>
            </div>
          </section>

          {club.description && (
            <section className="rounded-block border border-border bg-card p-5 shadow-block">
              <h2 className="text-sm font-bold text-card-foreground">Giới thiệu &amp; Lịch sân</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {club.description}
              </p>
            </section>
          )}
        </div>

        {/* Right: VietQR Status Card */}
        <div className="lg:col-span-5">
          <section className="rounded-block border border-border bg-card p-5 shadow-block">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-card-foreground">Tài khoản VietQR CLB</h2>
              <span className="rounded-pill bg-accent-qr-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-on-accent-qr">
                NAPAS 24/7
              </span>
            </div>

            {qrPreviewUrl ? (
              <div className="mt-4 flex flex-col items-center rounded-tile bg-secondary/60 p-5">
                <div className="flex h-48 w-48 items-center justify-center rounded-tile border border-border bg-white p-3 shadow-tile">
                  <img
                    src={qrPreviewUrl}
                    alt={`VietQR ${club.name}`}
                    width={180}
                    height={180}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-3 font-mono text-sm font-bold text-card-foreground">
                  {club.bankShortName || club.bankBin} • {club.bankAccountNo}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {club.bankAccountName}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-tile border border-dashed border-border p-5 text-center">
                <p className="text-xs text-muted-foreground">
                  CLB chưa cấu hình tài khoản ngân hàng nhận tiền VietQR.
                </p>
                {canManageClub && (
                  <Link
                    href={`/clubs/${club.id}/settings`}
                    className="mt-3 inline-flex min-h-[44px] items-center rounded-tile bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-tile"
                  >
                    Cấu hình ngân hàng ngay
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
