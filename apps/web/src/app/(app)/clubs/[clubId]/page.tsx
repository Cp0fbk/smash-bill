'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ClubDetail, formatVnd, toTransferSyntax } from '@smash-bill/shared';
import { Users } from 'lucide-react';
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
      <Skeleton
        aria-label="Đang tải thông tin CLB"
        className="h-64 w-full rounded-block border border-border"
      />
    );
  }

  if (notFound || !club) {
    return (
      <Card role="alert" className="mx-auto my-8 max-w-lg text-center">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-lg font-bold text-card-foreground">
            404 • Không tìm thấy câu lạc bộ
          </h1>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            {error || 'CLB không tồn tại hoặc bạn chưa phải là thành viên của CLB này.'}
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/clubs">Quay lại danh sách CLB</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
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
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/clubs"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ← Danh sách CLB
              </Link>
              <Badge variant="soft">Vai trò: {club.myRole}</Badge>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
              {club.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {club.location || 'Chưa cập nhật địa điểm sân'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild variant="outline" className="border-border-strong bg-secondary">
              <Link href={`/clubs/${club.id}/members`}>
                <Users className="text-primary" aria-hidden="true" />
                <span>Thành viên &amp; Mã mời QR ({club.memberCount})</span>
              </Link>
            </Button>

            {canManageClub && (
              <Button asChild>
                <Link href={`/clubs/${club.id}/settings`}>Cài đặt CLB &amp; VietQR</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Club Metrics & Invite Info */}
        <div className="space-y-6 lg:col-span-7">
          <Card aria-label="Thông số CLB">
            <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 sm:p-6">
              <div className="rounded-tile bg-secondary/70 p-3.5">
                <p className="text-xs text-muted-foreground">Giá sân mặc định</p>
                <p className="mt-1 font-mono text-base font-bold text-primary tabular-nums">
                  {formatVnd(club.defaultCourtFee)}
                </p>
              </div>
              <Link
                href={`/clubs/${club.id}/members`}
                className="group rounded-tile bg-secondary/70 p-3.5 transition-colors hover:bg-primary-soft"
              >
                <p className="text-xs text-muted-foreground group-hover:text-primary">Thành viên</p>
                <p className="mt-1 font-mono text-base font-bold text-card-foreground tabular-nums group-hover:text-primary">
                  {club.memberCount} người →
                </p>
              </Link>
              <div className="col-span-2 rounded-tile bg-primary-soft p-3.5 sm:col-span-1">
                <p className="text-xs text-primary">Mã mời CLB</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-base font-bold text-primary">
                    {club.inviteCode}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInviteCode}
                    className="h-7 min-h-0 rounded-pill px-2.5 py-0.5 text-[11px] text-primary"
                  >
                    {copiedCode ? 'Đã chép' : 'Chép'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {club.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Giới thiệu &amp; Lịch sân</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {club.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: VietQR Status Card */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Tài khoản VietQR CLB</CardTitle>
              <Badge variant="info" className="font-mono">
                NAPAS 24/7
              </Badge>
            </CardHeader>

            <CardContent>
              {qrPreviewUrl ? (
                <div className="flex flex-col items-center rounded-tile bg-secondary/60 p-5">
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
                <div className="rounded-tile border border-dashed border-border p-5 text-center">
                  <p className="text-xs text-muted-foreground">
                    CLB chưa cấu hình tài khoản ngân hàng nhận tiền VietQR.
                  </p>
                  {canManageClub && (
                    <Button asChild className="mt-3">
                      <Link href={`/clubs/${club.id}/settings`}>Cấu hình ngân hàng ngay</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
