'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useClubPermissions } from '../lib/auth-context';
import { BrandLogo } from './brand-logo';
import { ThemeToggle } from './theme-toggle';
import { UserSessionBar } from './user-session-bar';

interface NavPillar {
  href: string;
  label: string;
  shortLabel: string;
  matchPrefix?: string;
  icon: (active: boolean) => ReactNode;
}

const NAV_PILLARS: NavPillar[] = [
  {
    href: '/',
    label: 'Tổng quan',
    shortLabel: 'Tổng quan',
    icon: () => (
      <svg
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: '/matches',
    label: 'Kèo giao lưu & Buổi đánh',
    shortLabel: 'Giao lưu',
    matchPrefix: '/matches',
    icon: () => (
      <svg
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    href: '/market',
    label: 'Chợ vợt & Phụ kiện',
    shortLabel: 'Chợ vợt',
    matchPrefix: '/market',
    icon: () => (
      <svg
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    href: '/clubs',
    label: 'CLB cố định & Hồ sơ',
    shortLabel: 'CLB',
    matchPrefix: '/clubs',
    icon: () => (
      <svg
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

function isNavActive(pathname: string, pillar: NavPillar): boolean {
  if (pillar.href === '/') {
    return pathname === '/';
  }
  return Boolean(pillar.matchPrefix && pathname.startsWith(pillar.matchPrefix));
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isPlatformAdmin } = useClubPermissions();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
        {/* Desktop Persistent Left Sidebar Rail (>= 1024px) */}
        <aside
          aria-label="Điều hướng chính"
          className="hidden w-[260px] shrink-0 lg:flex lg:flex-col lg:justify-between lg:rounded-block lg:border lg:border-border lg:bg-card lg:p-5 lg:shadow-block"
        >
          <div className="space-y-6">
            {/* Brand Header */}
            <Link
              href="/"
              className="flex items-center gap-3 rounded-tile p-1.5 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-1.5 shadow-tile">
                <BrandLogo alt="SmashBill" size={32} />
              </div>
              <div>
                <p className="text-base font-extrabold tracking-tight text-card-foreground">
                  Smash<span className="text-primary">Bill</span>
                </p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  CLB &amp; Kèo giao lưu VietQR
                </p>
              </div>
            </Link>

            {/* Primary 4-Pillar Navigation */}
            <nav aria-label="Menu 4 trụ cột" className="space-y-1.5">
              {NAV_PILLARS.map((pillar) => {
                const active = isNavActive(pathname, pillar);
                return (
                  <Link
                    key={pillar.href}
                    href={pillar.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[44px] items-center gap-3 rounded-tile px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? 'bg-primary text-on-primary shadow-tile'
                        : 'text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {pillar.icon(active)}
                    <span>{pillar.label}</span>
                  </Link>
                );
              })}

              {isPlatformAdmin && (
                <Link
                  href="/admin"
                  aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center justify-between rounded-tile border px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    pathname.startsWith('/admin')
                      ? 'border-border-strong bg-primary-soft text-primary'
                      : 'border-border bg-secondary/40 text-secondary-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                    <span>Quản trị hệ thống</span>
                  </span>
                  <span className="rounded-pill bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-on-primary">
                    ADMIN
                  </span>
                </Link>
              )}
            </nav>

            {/* Quick CTA: Fixed Club vs 1-Time Giao Lưu Match */}
            <div className="space-y-2 rounded-tile border border-border bg-secondary/50 p-3.5">
              <p className="text-xs font-semibold text-card-foreground">
                CLB hàng tuần hay Giao lưu?
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Tạo <strong>CLB cố định</strong> cho hội đánh hàng tuần, hoặc mở{' '}
                <strong>Kèo giao lưu</strong> cho từng buổi ra sân.
              </p>
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <Link
                  href="/matches"
                  className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-tile border border-border bg-card px-3 py-2 text-xs font-semibold text-card-foreground shadow-tile transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>Tìm / Mở kèo giao lưu</span>
                </Link>
                <Link
                  href="/clubs/new"
                  className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-tile bg-primary px-3 py-2 text-xs font-semibold text-on-primary shadow-tile transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  <span>Tạo CLB cố định</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Giao diện</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        {/* Main Workspace Container */}
        <div className="flex min-w-0 flex-1 flex-col px-4 pt-4 pb-28 sm:px-6 lg:px-0 lg:pt-0 lg:pb-6">
          {/* Top Command Bar */}
          <header className="flex flex-col gap-2.5 rounded-block border border-border bg-card px-4 py-3 shadow-block sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <Link
                  href="/"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card p-1.5 shadow-tile lg:hidden"
                >
                  <BrandLogo alt="SmashBill" size={28} />
                </Link>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-base font-bold tracking-tight text-card-foreground lg:hidden">
                    Smash<span className="text-primary">Bill</span>
                  </span>
                  <span className="truncate rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {NAV_PILLARS.find((p) => isNavActive(pathname, p))?.label ??
                      'CLB & Kèo giao lưu'}
                  </span>
                </div>
              </div>

              <div className="shrink-0 sm:hidden">
                <ThemeToggle />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-2.5 sm:border-t-0 sm:pt-0">
              <div className="hidden shrink-0 sm:block lg:hidden">
                <ThemeToggle />
              </div>
              <UserSessionBar />
            </div>
          </header>

          {/* Page Content */}
          <main className="mt-6 flex-1">{children}</main>
        </div>
      </div>

      {/* Mobile Sticky 4-Tab Bottom Navigation Dock (< 1024px) */}
      <nav
        aria-label="Điều hướng di động"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 py-1.5 backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {NAV_PILLARS.map((pillar) => {
            const active = isNavActive(pathname, pillar);
            return (
              <li key={pillar.href}>
                <Link
                  href={pillar.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-tile px-2 py-1 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation] ${
                    active
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted-foreground hover:text-card-foreground'
                  }`}
                >
                  {pillar.icon(active)}
                  <span className="truncate">{pillar.shortLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
