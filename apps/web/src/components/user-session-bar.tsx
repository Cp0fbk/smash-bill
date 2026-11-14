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
        aria-label="Loading profile"
        className="h-11 w-36 animate-pulse rounded-xl bg-slate-800/80 motion-reduce:animate-none"
      />
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors duration-150 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 motion-reduce:transition-none [touch-action:manipulation]"
      >
        <span>Sign in</span>
      </a>
    );
  }

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.name} avatar`}
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-emerald-500/40"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40"
          >
            {initials || 'SB'}
          </span>
        )}
        <span className="max-w-[120px] truncate text-xs font-semibold text-slate-100 sm:max-w-[180px]">
          {user.name}
        </span>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        aria-label="Log out"
        className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition-colors duration-150 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 motion-reduce:transition-none [touch-action:manipulation]"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-slate-400"
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
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
