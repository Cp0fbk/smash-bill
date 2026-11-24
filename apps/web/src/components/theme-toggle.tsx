'use client';

import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
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
    <Button
      variant="outline"
      size="default"
      onClick={toggleTheme}
      aria-label={dark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-pressed={dark}
      className="min-w-[44px] px-3"
    >
      {dark ? (
        <Sun className="h-4 w-4 text-warning" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{dark ? 'Sáng' : 'Tối'}</span>
    </Button>
  );
}
