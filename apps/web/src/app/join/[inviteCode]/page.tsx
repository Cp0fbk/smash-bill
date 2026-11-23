'use client';

import type {
  InviteSelfJoinType,
  JoinByInviteResult,
  PublicInviteClubInfo,
} from '@smash-bill/shared';
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
              <span className="rounded-pill bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                Ghi danh nhanh
              </span>
            </div>
          </Link>
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        {loading ? (
          <div
            aria-label="Đang tải lời mời CLB"
            className="mx-auto h-72 max-w-lg animate-pulse rounded-block border border-border bg-card p-6 shadow-block motion-reduce:animate-none"
          />
        ) : notFound || !clubInfo ? (
          <section
            role="alert"
            className="mx-auto max-w-lg rounded-block border border-border bg-card p-6 text-center shadow-block sm:p-8"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-on-warning-soft">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="mt-4 text-lg font-bold text-card-foreground">
              Mã mời không tồn tại hoặc đã được làm mới
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {loadError ||
                'Chủ sân có thể đã đổi mã mời QR mới để bảo mật danh sách CLB. Vui lòng xin lại link hoặc quét mã QR mới nhất tại sân.'}
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/"
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary shadow-cta"
              >
                Về trang chủ SmashBill
              </Link>
            </div>
          </section>
        ) : (
          /* Centered max-w-lg on mobile, 12-col split view max-w-4xl on desktop */
          <div className="mx-auto max-w-lg lg:grid lg:max-w-4xl lg:grid-cols-12 lg:items-start lg:gap-8">
            {/* Left 5 Columns: Club Info Showcase */}
            <section className="mb-6 rounded-block border border-border bg-card p-6 shadow-block lg:col-span-5 lg:mb-0">
              <span className="inline-flex items-center rounded-pill bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                Lời mời tham gia CLB Cầu Lông
              </span>
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
            </section>

            {/* Right 7 Columns: Self-Join Form OR Personal Link Card */}
            <section className="rounded-block border border-border bg-card p-6 shadow-block lg:col-span-7">
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
                    <div>
                      <label
                        htmlFor="join-display-name"
                        className="block text-xs font-semibold text-card-foreground"
                      >
                        Họ tên hoặc Biệt danh trên sân *
                      </label>
                      <input
                        id="join-display-name"
                        type="text"
                        required
                        maxLength={80}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="VD: Minh Quân / Đức Anh"
                        className="mt-1.5 min-h-[44px] w-full rounded-tile border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="join-phone"
                        className="block text-xs font-semibold text-card-foreground"
                      >
                        Số điện thoại / Zalo (khuyên dùng để không bị tạo trùng tên)
                      </label>
                      <input
                        id="join-phone"
                        type="tel"
                        maxLength={25}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="VD: 0912 345 678"
                        className="mt-1.5 min-h-[44px] w-full rounded-tile border border-input bg-background px-3.5 py-2.5 font-mono text-sm text-foreground tabular-nums placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <fieldset>
                      <legend className="block text-xs font-semibold text-card-foreground">
                        Hình thức tham gia
                      </legend>
                      <div className="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setJoinType('REGULAR')}
                          className={`flex min-h-[52px] cursor-pointer flex-col items-start justify-center rounded-tile border p-3 text-left transition-colors [touch-action:manipulation] ${
                            joinType === 'REGULAR'
                              ? 'border-primary bg-primary-soft text-primary'
                              : 'border-border bg-secondary/50 text-foreground hover:bg-secondary'
                          }`}
                        >
                          <span className="text-xs font-bold">Thành viên cố định</span>
                          <span className="mt-0.5 text-[11px] opacity-80">
                            Đánh định kỳ hàng tuần / tháng
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setJoinType('GUEST')}
                          className={`flex min-h-[52px] cursor-pointer flex-col items-start justify-center rounded-tile border p-3 text-left transition-colors [touch-action:manipulation] ${
                            joinType === 'GUEST'
                              ? 'border-primary bg-primary-soft text-primary'
                              : 'border-border bg-secondary/50 text-foreground hover:bg-secondary'
                          }`}
                        >
                          <span className="text-xs font-bold">Khách vãng lai (Giao lưu)</span>
                          <span className="mt-0.5 text-[11px] opacity-80">
                            Tham gia theo buổi đánh lẻ
                          </span>
                        </button>
                      </div>
                    </fieldset>

                    {submitError && (
                      <div
                        role="alert"
                        className="rounded-tile border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-xs font-semibold text-on-destructive-soft"
                      >
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-tile bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-cta transition-colors hover:bg-primary-hover disabled:opacity-60 [touch-action:manipulation]"
                    >
                      {submitting ? 'Đang ghi danh...' : 'Tham gia CLB ngay'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-tile border border-success/30 bg-success-soft p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-on-success-soft">
                        {joinResult.reactivated
                          ? 'Đã kích hoạt lại hồ sơ thành viên của bạn!'
                          : joinResult.isExisting
                            ? 'Đã nhận diện hồ sơ thành viên qua số điện thoại!'
                            : 'Ghi danh thành công vào CLB!'}
                      </span>
                      <span className="rounded-pill bg-card px-2.5 py-0.5 font-mono text-[11px] font-bold text-primary">
                        {joinResult.member.role}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-card-foreground">
                      {joinResult.member.displayName}
                      {joinResult.member.phone ? ` • ${joinResult.member.phone}` : ''}
                    </p>
                  </div>

                  {/* Save Your Personal Link Card */}
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
                      <button
                        type="button"
                        onClick={handleCopyPersonalLink}
                        className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile border border-border-strong bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                      >
                        {copiedPersonalLink ? 'Đã sao chép link!' : 'Sao chép link cá nhân'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSharePersonalLink}
                        className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover"
                      >
                        Lưu / Chia sẻ qua Zalo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
