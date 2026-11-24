'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCurrentUser } from '../lib/auth-context';

export function UserSessionBar() {
  const router = useRouter();
  const { user, loading, logout } = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  if (loading) {
    return <Skeleton aria-label="Đang tải tài khoản" className="h-11 w-32" />;
  }

  if (!user) {
    return (
      <Button asChild>
        <a href="/login?reauth=1">Đăng nhập</a>
      </Button>
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
        <Avatar className="h-7 w-7">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
          <AvatarFallback>{initials || 'SB'}</AvatarFallback>
        </Avatar>
        <span className="max-w-[160px] truncate text-xs font-semibold text-card-foreground">
          {user.name}
        </span>
        {user.role === 'ADMIN' && (
          <Badge variant="soft" className="px-2 py-0.5 font-mono text-[10px]">
            ADMIN
          </Badge>
        )}
      </div>

      <Button
        variant="outline"
        onClick={handleLogout}
        disabled={loggingOut}
        aria-label="Đăng xuất"
        className="min-w-[44px] px-3 hover:border-destructive hover:bg-destructive-soft hover:text-destructive"
      >
        <LogOut aria-hidden="true" />
        <span className="hidden sm:inline">{loggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
      </Button>
    </div>
  );
}
