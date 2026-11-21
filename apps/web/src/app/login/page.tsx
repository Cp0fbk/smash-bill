'use client';

import { useEffect, useState } from 'react';
import { BrandLogo } from '../../components/brand-logo';
import { ThemeToggle } from '../../components/theme-toggle';
import { getGoogleLoginUrl } from '../../lib/api-client';

export default function LoginPage() {
  const [stage, setStage] = useState<'splash' | 'login'>('splash');
  const [authError, setAuthError] = useState<string | null>(null);
  const googleAuthHref = getGoogleLoginUrl();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setAuthError('Đăng nhập Google không thành công. Vui lòng thử lại.');
      setStage('login');
    }
  }, []);

  useEffect(() => {
    if (stage !== 'splash') {
      return;
    }
    const timer = setTimeout(() => {
      setStage('login');
    }, 1850);
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (stage === 'splash' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
        setStage('login');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stage]);

  // ============================================================================
  // STAGE 1: WELCOME SPLASH SCREEN
  // ============================================================================
  if (stage === 'splash') {
    return (
      <main className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-background px-6 py-8 select-none">
        {/* Top Utility Bar */}
        <div className="flex w-full items-center justify-end">
          <ThemeToggle />
        </div>

        {/* Center Welcome Emblem */}
        <div className="animate-fade-up relative flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-40 w-40 rounded-full bg-primary/10 blur-2xl"
            />
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-block border border-border bg-card p-3.5 shadow-block sm:h-28 sm:w-28">
              <BrandLogo alt="SmashBill Logo" size={84} />
            </div>
          </div>

          <p className="mt-7 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Chào mừng đến với
          </p>
          <h1 className="text-display-block mt-1.5 font-extrabold tracking-tight text-foreground">
            Smash<span className="text-primary">Bill</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Điểm danh &amp; chia tiền sân cầu lông
          </p>

          <div className="mt-8 w-44 overflow-hidden rounded-pill bg-muted p-0.5">
            <div className="animate-splash-progress h-1.5 w-full rounded-pill bg-primary" />
          </div>
        </div>

        {/* Bottom Skip / Continue Action */}
        <div className="flex w-full max-w-md justify-center">
          <button
            type="button"
            onClick={() => setStage('login')}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
          >
            <span>Bắt đầu</span>
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>
    );
  }

  // ============================================================================
  // STAGE 2: MINIMAL SSO LOGIN CARD
  // ============================================================================
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 py-8">
      <div className="animate-fade-up w-full max-w-[400px]">
        {/* Top Controls: Replay Welcome Splash + Theme Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStage('splash')}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-tile px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Màn hình chào</span>
          </button>

          <ThemeToggle />
        </div>

        {/* Minimal Login Card */}
        <section
          aria-labelledby="login-heading"
          className="rounded-block border border-border bg-card p-7 shadow-block sm:p-8"
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card p-2.5 shadow-tile">
              <BrandLogo alt="Logo SmashBill" size={52} />
            </div>

            <h1
              id="login-heading"
              className="mt-5 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl"
            >
              Đăng nhập Smash<span className="text-primary">Bill</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Tiếp tục bằng tài khoản Google của bạn
            </p>
          </div>

          <div className="mt-7 space-y-3">
            {authError && (
              <p
                role="alert"
                className="rounded-tile border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-center text-xs font-medium text-destructive"
              >
                {authError}
              </p>
            )}

            <a
              href={googleAuthHref}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-3 rounded-tile bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-cta transition-all duration-200 hover:bg-primary-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none [touch-action:manipulation]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white p-1">
                <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29A7.12 7.12 0 0 1 4.9 12c0-.8.14-1.57.37-2.29V6.62H1.29A11.99 11.99 0 0 0 0 12c0 1.92.46 3.74 1.29 5.38l3.98-3.09Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
                  />
                </svg>
              </span>
              <span>Tiếp tục với Google</span>
            </a>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-between rounded-tile border border-border bg-secondary/70 px-4 py-3 text-sm font-medium text-muted-foreground"
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-qr-soft text-xs font-bold text-on-accent-qr"
                >
                  Z
                </span>
                <span>Tiếp tục với Zalo</span>
              </span>
              <span className="rounded-pill border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Sắp ra mắt
              </span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Đăng nhập bảo mật SSO • Không cần mật khẩu
          </p>
        </section>
      </div>
    </main>
  );
}
