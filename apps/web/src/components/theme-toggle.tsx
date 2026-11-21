'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('sb_theme');
    const isDark =
      stored === 'dark' || (!stored && document.documentElement.classList.contains('dark'));
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      window.localStorage.setItem('sb_theme', next ? 'dark' : 'light');
    } catch {
      // Ignore storage write errors in private mode
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-pressed={dark}
      className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-2 rounded-tile border border-border bg-card px-3 py-2 text-xs font-semibold text-secondary-foreground shadow-tile transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none [touch-action:manipulation]"
    >
      {dark ? (
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-warning"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
      <span className="hidden sm:inline">{dark ? 'Sáng' : 'Tối'}</span>
    </button>
  );
}
