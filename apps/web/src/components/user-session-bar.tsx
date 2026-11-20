'use client';

import type { AuthUserProfile } from '@smash-bill/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logoutUser } from '../lib/api-client';

export function UserSessionBar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    fetchCurrentUser()
      .then((profile) => {
        if (active) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
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
  }, []);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Clear client state and navigate to login even if cookie already expired
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div
        aria-label="Đang tải tài khoản"
        className="h-11 w-32 animate-pulse rounded-tile bg-secondary motion-reduce:animate-none"
      />
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-tile bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-tile transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [touch-action:manipulation]"
      >
        <span>Đăng nhập</span>
      </a>
    );
  }

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
      <div className="flex min-h-[44px] min-w-0 items-center gap-2.5 rounded-tile border border-border bg-secondary/70 px-3 py-1.5">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            width={26}
            height={26}
            className="h-6.5 w-6.5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary"
          >
            {initials || 'SB'}
          </span>
        )}
        <span className="max-w-[200px] truncate text-xs font-semibold text-card-foreground sm:max-w-[160px]">
          {user.name}
        </span>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        aria-label="Đăng xuất"
        className="inline-flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-tile border border-border bg-card px-3 py-2 text-xs font-semibold text-secondary-foreground shadow-tile transition-colors duration-200 hover:border-destructive hover:bg-destructive-soft hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 motion-reduce:transition-none [touch-action:manipulation]"
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
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
        <span className="hidden sm:inline">{loggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
      </button>
    </div>
  );
}
