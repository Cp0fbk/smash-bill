import { getGoogleLoginUrl } from '../../lib/api-client';

export default function LoginPage() {
  const googleAuthHref = getGoogleLoginUrl();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-4 py-8">
      {/* Brand Header */}
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 18a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
            <path d="m9.5 18.5-5-14.5 5.5 3 2-5 2 5 5.5-3-5 14.5" />
          </svg>
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-50">SmashBill</h1>
          <p className="text-xs font-medium text-emerald-400">
            Badminton Attendance &amp; Dynamic VietQR Billing
          </p>
        </div>
      </header>

      {/* Login Card */}
      <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Verified Club Admin SSO</span>
          </span>
          <h2 className="text-xl font-bold text-slate-50">Sign in to manage your club</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Track 1-touch court attendance, split shuttlecock &amp; court fees to the nearest{' '}
            <span className="font-semibold text-slate-200 tabular-nums">1,000 ₫</span>, and share
            instant VietQR payment links.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <a
            href={googleAuthHref}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-md transition-transform duration-150 hover:bg-emerald-400 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none [touch-action:manipulation]"
          >
            <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.81-1.5 3.34-3.2 4.37v3.62h5.18c3.03-2.79 4.78-6.9 4.78-11.82 0-.8-.08-1.57-.23-2.32l.13.42Z"
              />
              <path
                fill="currentColor"
                d="M12.18 22c4.32 0 7.95-1.43 10.6-3.88l-5.18-3.62c-1.43.96-3.27 1.53-5.42 1.53-4.17 0-7.7-2.81-8.96-6.6H-2.1v3.73C.54 18.42 5.94 22 12.18 22Z"
              />
              <path
                fill="currentColor"
                d="M3.22 9.43A9.57 9.57 0 0 1 2.7 6.3c0-1.09.19-2.15.52-3.13V-.56H-2.1A15.93 15.93 0 0 0-3.82 6.3c0 2.58.62 5.02 1.72 7.16l5.32-4.03Z"
              />
              <path
                fill="currentColor"
                d="M12.18 2.58c2.35 0 4.46.81 6.12 2.4l4.59-4.59C20.12-2.18 16.5-3.6 12.18-3.6 5.94-3.6.54-.02-2.1 5.24l5.32 4.03c1.26-3.79 4.79-6.69 8.96-6.69Z"
              />
            </svg>
            <span>Continue with Google</span>
          </a>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs text-slate-400">
          <p className="font-semibold text-slate-200">Single-Player Mode Ready</p>
          <p className="mt-1">
            Only the Club Admin needs to sign in. Regular members and drop-in guests can check in
            and pay via VietQR without creating an account.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
        SSO-only authentication (ADR-003) • High-Contrast Court PWA
      </footer>
    </main>
  );
}
