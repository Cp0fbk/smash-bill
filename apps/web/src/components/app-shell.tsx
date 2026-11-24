'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Calendar,
  LayoutGrid,
  type LucideIcon,
  Plus,
  Shield,
  ShoppingBag,
  Users,
} from 'lucide-react';
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
  Icon: LucideIcon;
}

const NAV_PILLARS: NavPillar[] = [
  {
    href: '/',
    label: 'Tổng quan',
    shortLabel: 'Tổng quan',
    Icon: LayoutGrid,
  },
  {
    href: '/matches',
    label: 'Kèo giao lưu & Buổi đánh',
    shortLabel: 'Giao lưu',
    matchPrefix: '/matches',
    Icon: Calendar,
  },
  {
    href: '/market',
    label: 'Chợ vợt & Phụ kiện',
    shortLabel: 'Chợ vợt',
    matchPrefix: '/market',
    Icon: ShoppingBag,
  },
  {
    href: '/clubs',
    label: 'CLB cố định & Hồ sơ',
    shortLabel: 'CLB',
    matchPrefix: '/clubs',
    Icon: Users,
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
        <Card
          aria-label="Điều hướng chính"
          className="hidden w-[260px] shrink-0 lg:flex lg:flex-col lg:justify-between lg:p-5"
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
                const Icon = pillar.Icon;
                return (
                  <Button
                    key={pillar.href}
                    asChild
                    variant={active ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 px-3.5 text-sm',
                      !active && 'text-secondary-foreground hover:bg-secondary/80',
                    )}
                  >
                    <Link href={pillar.href} aria-current={active ? 'page' : undefined}>
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span>{pillar.label}</span>
                    </Link>
                  </Button>
                );
              })}

              {isPlatformAdmin && (
                <Button
                  asChild
                  variant={pathname.startsWith('/admin') ? 'soft' : 'outline'}
                  className="w-full justify-between px-3.5 text-sm"
                >
                  <Link
                    href="/admin"
                    aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
                  >
                    <span className="flex items-center gap-3">
                      <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span>Quản trị hệ thống</span>
                    </span>
                    <Badge variant="default" className="px-2 py-0.5 font-mono text-[10px]">
                      ADMIN
                    </Badge>
                  </Link>
                </Button>
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
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/matches">Tìm / Mở kèo giao lưu</Link>
                </Button>
                <Button asChild size="sm" className="w-full">
                  <Link href="/clubs/new">
                    <Plus aria-hidden="true" />
                    <span>Tạo CLB cố định</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="space-y-3 pt-4">
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Giao diện</span>
              <ThemeToggle />
            </div>
          </div>
        </Card>

        {/* Main Workspace Container */}
        <div className="flex min-w-0 flex-1 flex-col px-4 pt-4 pb-28 sm:px-6 lg:px-0 lg:pt-0 lg:pb-6">
          {/* Top Command Bar */}
          <Card className="px-4 py-3 sm:px-5 sm:py-3.5">
            <header className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
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
                    <Badge variant="soft" className="truncate">
                      {NAV_PILLARS.find((p) => isNavActive(pathname, p))?.label ??
                        'CLB & Kèo giao lưu'}
                    </Badge>
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
          </Card>

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
            const Icon = pillar.Icon;
            return (
              <li key={pillar.href}>
                <Link
                  href={pillar.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-tile px-2 py-1 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]',
                    active
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted-foreground hover:text-card-foreground',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
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
