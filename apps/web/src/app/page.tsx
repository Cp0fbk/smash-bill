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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-4 py-6 sm:max-w-2xl">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-xl ring-1 ring-emerald-500/40">
            🏸
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">SmashBill</h1>
            <p className="text-xs text-emerald-400">Badminton Fund & Attendance PWA</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700">
          MVP v0.1.0
        </span>
      </header>

      {/* Main Content */}
      <div className="my-6 space-y-5">
        {/* Active Match Card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Tonight&apos;s Session • Court #2 & #3
              </span>
              <h2 className="mt-0.5 text-base font-semibold text-white">
                CLB Cầu Lông Sao Mai (20:00 - 22:00)
              </h2>
            </div>
            <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              4 Present
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-950/80 p-2.5 ring-1 ring-slate-800/80">
              <p className="text-[11px] text-slate-400">Court + Shuttle</p>
              <p className="mt-1 text-sm font-bold text-white">260,000 ₫</p>
            </div>
            <div className="rounded-xl bg-slate-950/80 p-2.5 ring-1 ring-slate-800/80">
              <p className="text-[11px] text-slate-400">Split / Player</p>
              <p className="mt-1 text-sm font-bold text-emerald-400">65,000 ₫</p>
            </div>
            <div className="rounded-xl bg-slate-950/80 p-2.5 ring-1 ring-slate-800/80">
              <p className="text-[11px] text-slate-400">Checkout</p>
              <p className="mt-1 text-sm font-bold text-sky-400">VietQR Auto</p>
            </div>
          </div>
        </section>

        {/* One-Touch Attendance Board Preview */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">1-Touch Court Attendance Board</h3>
            <span className="text-xs text-slate-400">+ Add Guest (Vãng lai)</span>
          </div>

          <ul className="space-y-2">
            {SAMPLE_PLAYERS.map((player) => (
              <li
                key={player.name}
                className="flex items-center justify-between rounded-xl border border-slate-800/90 bg-slate-950/60 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md text-xs font-bold ${
                      player.present
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 bg-slate-900 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-100">{player.name}</p>
                    <p className="text-[11px] text-slate-400">{player.role}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-200">{player.debt}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Feature Highlights */}
        <section className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <p className="font-semibold text-emerald-400">🔐 Google & Zalo SSO</p>
            <p className="mt-1 text-slate-400">
              Verified player identities & anti-flaking deposit protection for drop-in guests.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
            <p className="font-semibold text-sky-400">⚡ Dynamic VietQR</p>
            <p className="mt-1 text-slate-400">
              Pre-filled bank account, exact debt & transfer syntax in one scan.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-4 text-center text-xs text-slate-500">
        SmashBill Monorepo • Next.js PWA + NestJS + Prisma + PostgreSQL + Biome
      </footer>
    </main>
  );
}
