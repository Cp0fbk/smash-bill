const SAMPLE_PLAYERS = [
  { name: 'Minh Nguyen (Admin)', role: 'Regular', present: true, debt: '65,000 ₫' },
  { name: 'Hoang Le', role: 'Regular', present: true, debt: '65,000 ₫' },
  { name: 'Thao Pham', role: 'Regular', present: true, debt: '130,000 ₫ (2 sessions)' },
  {
    name: 'Khanh Tran (Vãng lai)',
    role: 'Guest • 50k Deposit Paid',
    present: true,
    debt: '15,000 ₫',
  },
  { name: 'Duc Vu', role: 'Regular', present: false, debt: '0 ₫' },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-4 py-6 sm:max-w-2xl">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40"
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
            <h1 className="text-lg font-bold tracking-tight text-white">SmashBill</h1>
            <p className="text-xs text-emerald-400">Badminton Fund & Attendance PWA</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700 tabular-nums">
          MVP v0.1.0
        </span>
      </header>

      {/* Main Content */}
      <div className="my-6 space-y-5">
        {/* Active Match Card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Tonight&apos;s Session • Court #2 & #3
              </span>
              <h2 className="mt-0.5 text-base font-semibold text-white tabular-nums">
                CLB Cầu Lông Sao Mai (20:00 - 22:00)
              </h2>
            </div>
            <span className="shrink-0 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 tabular-nums">
              4 Present
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-950/80 p-2.5 ring-1 ring-slate-800/80">
              <p className="text-xs text-slate-400">Court + Shuttle</p>
              <p className="mt-1 text-sm font-bold text-white tabular-nums">260,000 ₫</p>
            </div>
            <div className="rounded-xl bg-slate-950/80 p-2.5 ring-1 ring-slate-800/80">
              <p className="text-xs text-slate-400">Split / Player</p>
              <p className="mt-1 text-sm font-bold text-emerald-400 tabular-nums">65,000 ₫</p>
            </div>
            <div className="rounded-xl bg-slate-950/80 p-2.5 ring-1 ring-slate-800/80">
              <p className="text-xs text-slate-400">Checkout</p>
              <p className="mt-1 text-sm font-bold text-sky-400">VietQR Auto</p>
            </div>
          </div>
        </section>

        {/* One-Touch Attendance Board Preview */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-200">1-Touch Court Attendance Board</h3>
            <button
              type="button"
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-slate-700 transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Guest (Vãng lai)
            </button>
          </div>

          <ul className="space-y-2">
            {SAMPLE_PLAYERS.map((player) => (
              <li key={player.name}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={player.present}
                  className="flex min-h-[48px] w-full cursor-pointer items-center justify-between rounded-xl border border-slate-800/90 bg-slate-950/60 px-3.5 py-2.5 text-left transition-colors duration-150 hover:border-slate-700 hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 motion-reduce:transition-none"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors duration-150 ${
                        player.present
                          ? 'bg-emerald-500 text-slate-950'
                          : 'border border-slate-700 bg-slate-900 text-transparent'
                      }`}
                    >
                      <svg
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-100">{player.name}</p>
                      <p className="text-xs text-slate-400">{player.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-200 tabular-nums">
                    {player.debt}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Feature Highlights */}
        <section className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
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
              <span>Google & Zalo SSO</span>
            </div>
            <p className="mt-1.5 text-slate-400">
              Verified player identities & anti-flaking deposit protection for drop-in guests.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-sky-400">
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="5" height="5" x="3" y="3" rx="1" />
                <rect width="5" height="5" x="16" y="3" rx="1" />
                <rect width="5" height="5" x="3" y="16" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                <path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                <path d="M3 12h.01" />
                <path d="M12 3h.01" />
                <path d="M12 16v.01" />
                <path d="M16 12h1" />
                <path d="M21 12v.01" />
                <path d="M12 21v-1" />
              </svg>
              <span>Dynamic VietQR</span>
            </div>
            <p className="mt-1.5 text-slate-400">
              Pre-filled bank account, exact debt & transfer syntax in one scan.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
        SmashBill Monorepo • Next.js PWA + NestJS + Prisma + PostgreSQL + Biome
      </footer>
    </main>
  );
}
