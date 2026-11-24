'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type {
  InviteSelfJoinType,
  JoinByInviteResult,
  PublicInviteClubInfo,
} from '@smash-bill/shared';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { BrandLogo } from '../../../components/brand-logo';
import { QrCodeSvg } from '../../../components/qr-code-svg';
import { ThemeToggle } from '../../../components/theme-toggle';
import { ApiClientError, fetchPublicInviteInfo, joinClubByInvite } from '../../../lib/api-client';

export default function PublicInviteJoinPage() {
  const params = useParams<{ inviteCode: string }>();
  const inviteCode = params?.inviteCode ?? '';

  const [clubInfo, setClubInfo] = useState<PublicInviteClubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [joinType, setJoinType] = useState<InviteSelfJoinType>('REGULAR');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [joinResult, setJoinResult] = useState<JoinByInviteResult | null>(null);
  const [copiedPersonalLink, setCopiedPersonalLink] = useState(false);
  const [origin, setOrigin] = useState('https://smashbill.vn');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!inviteCode) {
      return;
    }
    let active = true;
    setLoading(true);

    fetchPublicInviteInfo(inviteCode)
      .then((info) => {
        if (active) {
          setClubInfo(info);
          setNotFound(false);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(err instanceof Error ? err.message : 'Không thể tải thông tin lời mời.');
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
  }, [inviteCode]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!inviteCode) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setSubmitError('Vui lòng nhập họ tên hoặc biệt danh trên sân.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await joinClubByInvite(inviteCode, {
        displayName: trimmedName,
        phone: phone.trim() || undefined,
        type: joinType,
      });
      setJoinResult(result);
      setClubInfo(result.club);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 429) {
        setSubmitError('Bạn thao tác quá nhanh. Vui lòng đợi 1 phút rồi thử lại.');
      } else if (err instanceof ApiClientError && err.status === 404) {
        setNotFound(true);
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Không thể tham gia CLB lúc này.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const personalUrl = joinResult ? `${origin}/p/${joinResult.member.publicToken}` : '';

  async function handleCopyPersonalLink() {
    if (!personalUrl) return;
    try {
      await navigator.clipboard.writeText(personalUrl);
      setCopiedPersonalLink(true);
      setTimeout(() => setCopiedPersonalLink(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  }

  async function handleSharePersonalLink() {
    if (!joinResult || !personalUrl) return;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Link công nợ & VietQR cá nhân - ${joinResult.club.name}`,
          text: `Link tra cứu tiền sân & VietQR của ${joinResult.member.displayName} tại ${joinResult.club.name}:`,
          url: personalUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await handleCopyPersonalLink();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal Top Bar */}
      <header className="border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-1 shadow-tile">
              <BrandLogo alt="SmashBill" size={28} />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-extrabold tracking-tight text-foreground">
                Smash<span className="text-primary">Bill</span>
              </span>
              <Badge variant="soft" className="px-2 text-[11px]">
                Ghi danh nhanh
              </Badge>
            </div>
          </Link>
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        {loading ? (
          <Skeleton
            aria-label="Đang tải lời mời CLB"
            className="mx-auto h-72 max-w-lg rounded-block border border-border"
          />
        ) : notFound || !clubInfo ? (
          <Card role="alert" className="mx-auto max-w-lg text-center">
            <CardContent className="p-6 sm:p-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-on-warning-soft">
                <AlertCircle className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="mt-4 text-lg font-bold text-card-foreground">
                Mã mời không tồn tại hoặc đã được làm mới
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {loadError ||
                  'Chủ sân có thể đã đổi mã mời QR mới để bảo mật danh sách CLB. Vui lòng xin lại link hoặc quét mã QR mới nhất tại sân.'}
              </p>
              <div className="mt-6 flex justify-center">
                <Button asChild>
                  <Link href="/">Về trang chủ SmashBill</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Centered max-w-lg on mobile, 12-col split view max-w-4xl on desktop */
          <div className="mx-auto max-w-lg lg:grid lg:max-w-4xl lg:grid-cols-12 lg:items-start lg:gap-8">
            {/* Left 5 Columns: Club Info Showcase */}
            <Card className="mb-6 lg:col-span-5 lg:mb-0">
              <CardContent className="p-6">
                <Badge variant="soft">Lời mời tham gia CLB Cầu Lông</Badge>
                <h1 className="mt-3 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
                  {clubInfo.name}
                </h1>
                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                  {clubInfo.location || 'Sân cầu lông CLB'}
                </p>

                {clubInfo.description && (
                  <p className="mt-3 rounded-tile bg-secondary/70 p-3 text-xs leading-relaxed text-muted-foreground">
                    {clubInfo.description}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Quy mô hiện tại</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-card-foreground tabular-nums">
                      {clubInfo.memberCount} thành viên
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Tài khoản</p>
                    <p className="mt-0.5 text-xs font-bold text-success">Không cần đăng ký</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right 7 Columns: Self-Join Form OR Personal Link Card */}
            <Card className="lg:col-span-7">
              <CardContent className="p-6">
                {!joinResult ? (
                  <>
                    <h2 className="text-base font-bold text-card-foreground sm:text-lg">
                      Ghi danh vào danh sách điểm danh
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Điền tên thường gọi trên sân để chủ sân điểm danh và chia tiền sân/cầu tự động
                      qua VietQR.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="join-display-name">Họ tên hoặc Biệt danh trên sân *</Label>
                        <Input
                          id="join-display-name"
                          type="text"
                          required
                          maxLength={80}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="VD: Minh Quân / Đức Anh"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="join-phone">
                          Số điện thoại / Zalo (khuyên dùng để không bị tạo trùng tên)
                        </Label>
                        <Input
                          id="join-phone"
                          type="tel"
                          maxLength={25}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="VD: 0912 345 678"
                          className="font-mono tabular-nums"
                        />
                      </div>

                      <fieldset className="space-y-1.5">
                        <legend className="block text-xs font-semibold text-card-foreground">
                          Hình thức tham gia
                        </legend>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setJoinType('REGULAR')}
                            className={cn(
                              'flex min-h-[52px] cursor-pointer flex-col items-start justify-center rounded-tile border p-3 text-left transition-colors [touch-action:manipulation]',
                              joinType === 'REGULAR'
                                ? 'border-primary bg-primary-soft text-primary'
                                : 'border-border bg-secondary/50 text-foreground hover:bg-secondary',
                            )}
                          >
                            <span className="text-xs font-bold">Thành viên cố định</span>
                            <span className="mt-0.5 text-[11px] opacity-80">
                              Đánh định kỳ hàng tuần / tháng
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setJoinType('GUEST')}
                            className={cn(
                              'flex min-h-[52px] cursor-pointer flex-col items-start justify-center rounded-tile border p-3 text-left transition-colors [touch-action:manipulation]',
                              joinType === 'GUEST'
                                ? 'border-primary bg-primary-soft text-primary'
                                : 'border-border bg-secondary/50 text-foreground hover:bg-secondary',
                            )}
                          >
                            <span className="text-xs font-bold">Khách vãng lai (Giao lưu)</span>
                            <span className="mt-0.5 text-[11px] opacity-80">
                              Tham gia theo buổi đánh lẻ
                            </span>
                          </button>
                        </div>
                      </fieldset>

                      {submitError && (
                        <Alert variant="destructive">
                          <AlertDescription className="font-semibold">
                            {submitError}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitting}
                        className="w-full font-bold"
                      >
                        {submitting ? 'Đang ghi danh...' : 'Tham gia CLB ngay'}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="space-y-5">
                    <Alert variant="success">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">
                          {joinResult.reactivated
                            ? 'Đã kích hoạt lại hồ sơ thành viên của bạn!'
                            : joinResult.isExisting
                              ? 'Đã nhận diện hồ sơ thành viên qua số điện thoại!'
                              : 'Ghi danh thành công vào CLB!'}
                        </span>
                        <Badge variant="outline" className="font-mono text-[11px] text-primary">
                          {joinResult.member.role}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-bold text-card-foreground">
                        {joinResult.member.displayName}
                        {joinResult.member.phone ? ` • ${joinResult.member.phone}` : ''}
                      </p>
                    </Alert>

                    <div className="rounded-tile border border-border bg-secondary/60 p-4">
                      <h3 className="text-sm font-bold text-card-foreground">
                        Lưu link cá nhân của bạn (/p/{joinResult.member.publicToken.slice(0, 8)}…)
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dùng link này để xem lịch sử buổi đánh và quét mã VietQR thanh toán đúng số
                        tiền của riêng bạn bất cứ lúc nào (không cần đăng nhập).
                      </p>

                      <div className="mt-4 flex flex-col items-center">
                        <QrCodeSvg
                          value={personalUrl}
                          size={164}
                          label={`Link cá nhân của ${joinResult.member.displayName}`}
                        />
                        <p className="mt-2.5 break-all text-center font-mono text-xs text-primary">
                          {personalUrl}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          onClick={handleCopyPersonalLink}
                          className="border-border-strong"
                        >
                          {copiedPersonalLink ? 'Đã sao chép link!' : 'Sao chép link cá nhân'}
                        </Button>
                        <Button onClick={handleSharePersonalLink}>Lưu / Chia sẻ qua Zalo</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
